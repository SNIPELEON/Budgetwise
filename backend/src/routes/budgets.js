const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/budgets
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM

    const budgets = await db.get(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t
           WHERE t.user_id = b.user_id AND t.category_id = b.category_id
           AND t.type = 'expense' AND strftime('%Y-%m', t.date) = b.month),
          0
        ) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ?
      ORDER BY c.name
    `).all(req.user.id, month);

    res.json({ budgets, month });
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets
router.post('/', [
  body('category_id').isInt().withMessage('Category ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { category_id, amount, month } = req.body;
    const db = getDb();

    const result = await db.run('INSERT OR REPLACE INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)', [req.user.id, category_id, amount, month]);

    const budget = await db.run(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ budget });
  } catch (err) {
    next(err);
  }
});

// PUT /api/budgets/:id
router.put('/:id', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const db = getDb();
    const result = await db.get('UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?', [req.body.amount, req.params.id, req.user.id]);

    if (result.changes === 0) return res.status(404).json({ error: 'Budget not found' });

    const budget = await db.run(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t
           WHERE t.user_id = b.user_id AND t.category_id = b.category_id
           AND t.type = 'expense' AND strftime('%Y-%m', t.date) = b.month),
          0
        ) as spent
      FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    res.json({ budget });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (result.changes === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
