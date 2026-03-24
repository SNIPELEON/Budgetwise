const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/goals
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const goals = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY status ASC, created_at DESC'
    ).all(req.user.id);
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

// POST /api/goals
router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 150 }),
  body('target_amount').isFloat({ min: 0.01 }),
  body('deadline').optional().isDate(),
  body('icon').optional().trim().isLength({ max: 10 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { title, target_amount, deadline, icon = '🎯', current_amount = 0 } = req.body;
    const db = getDb();

    const result = await db.run('INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, title, target_amount, current_amount, deadline || null, icon]);

    const goal = await db.run('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
});

// PUT /api/goals/:id
router.put('/:id', [
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('target_amount').optional().isFloat({ min: 0.01 }),
  body('deadline').optional().isDate(),
  body('status').optional().isIn(['active', 'completed', 'paused']),
  body('icon').optional().trim().isLength({ max: 10 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const db = getDb();
    const { title, target_amount, deadline, status, icon } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (target_amount !== undefined) updates.target_amount = target_amount;
    if (deadline !== undefined) updates.deadline = deadline;
    if (status !== undefined) updates.status = status;
    if (icon !== undefined) updates.icon = icon;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const existing = await db.get('SELECT id FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE goals SET ${fields} WHERE id = ? AND user_id = ?`, [...Object.values(updates), req.params.id, req.user.id]);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?', [req.params.id]);
    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

// PUT /api/goals/:id/deposit — add money toward a goal
router.put('/:id/deposit', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Deposit amount must be positive'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const db = getDb();
    const goal = await db.get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    let newAmount = Math.min(goal.current_amount + req.body.amount, goal.target_amount);
    let newStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;

    await db.get('UPDATE goals SET current_amount = ?, status = ? WHERE id = ?')
      .run(newAmount, newStatus, goal.id);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?', [goal.id]);
    res.json({ goal: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
