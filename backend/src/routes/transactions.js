const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/transactions
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('category_id').optional().isInt(),
  query('start_date').optional().isDate(),
  query('end_date').optional().isDate(),
  query('search').optional().trim(),
], async (req, res, next) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE t.user_id = ?';
    const params = [req.user.id];

    if (req.query.type) { where += ' AND t.type = ?'; params.push(req.query.type); }
    if (req.query.category_id) { where += ' AND t.category_id = ?'; params.push(req.query.category_id); }
    if (req.query.start_date) { where += ' AND t.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { where += ' AND t.date <= ?'; params.push(req.query.end_date); }
    if (req.query.search) {
      where += ' AND t.description LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    const totalRes = await db.get(`SELECT COUNT(*) as count FROM transactions t ${where}`, [...params]); const total = totalRes ? totalRes.count : 0;

    const transactions = await db.all(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${where}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').isDate().withMessage('Valid date required'),
  body('description').optional().trim().isLength({ max: 255 }),
  body('category_id').optional().isInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { amount, type, date, description, category_id } = req.body;
    const db = getDb();

    const result = await db.run('INSERT INTO transactions (user_id, amount, type, category_id, description, date) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, amount, type, category_id || null, description || null, date]);

    const transaction = await db.run(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
});

// PUT /api/transactions/:id
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('type').optional().isIn(['income', 'expense']),
  body('date').optional().isDate(),
  body('description').optional().trim().isLength({ max: 255 }),
  body('category_id').optional().isInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const db = getDb();
    const existing = await db.get('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const { amount, type, date, description, category_id } = req.body;
    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (type !== undefined) updates.type = type;
    if (date !== undefined) updates.date = date;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;

    if (Object.keys(updates).length > 0) {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      await db.run(`UPDATE transactions SET ${fields} WHERE id = ? AND user_id = ?`, [...Object.values(updates), req.params.id, req.user.id]);
    }

    const transaction = await db.get(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/categories
router.get('/categories', async (req, res, next) => {
  try {
    const db = getDb();
    const categories = await db.all('SELECT * FROM categories ORDER BY type, name', []);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
