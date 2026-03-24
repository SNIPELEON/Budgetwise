const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/analytics/summary — total income, expenses, net savings, savings rate
router.get('/summary', async (req, res, next) => {
  try {
    const db = getDb();
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const totals = await db.get(`
      SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `, [req.user.id, month]);

    const netSavings = totals.total_income - totals.total_expenses;
    const savingsRate = totals.total_income > 0
      ? ((netSavings / totals.total_income) * 100).toFixed(1)
      : 0;

    // Balance = all-time income - all-time expense
    const balance = await db.get(`
      SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as balance
      FROM transactions WHERE user_id = ?
    `, [req.user.id]).balance;

    // Active goals count
    const activeGoals = await db.get("SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'active'", [req.user.id]).count;

    // Transaction count this month
    const txCount = await db.get("SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ?", [req.user.id, month]).count;

    res.json({
      month,
      total_income: totals.total_income,
      total_expenses: totals.total_expenses,
      net_savings: netSavings,
      savings_rate: parseFloat(savingsRate),
      balance,
      active_goals: activeGoals,
      transaction_count: txCount,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/spending-by-category — pie chart data
router.get('/spending-by-category', async (req, res, next) => {
  try {
    const db = getDb();
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const data = await db.all(`
      SELECT c.name, c.icon, c.color,
             COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
      GROUP BY c.id
      ORDER BY total DESC
    `, [req.user.id, month]);

    const totalExpenses = data.reduce((s, d) => s + d.total, 0);
    const result = data.map(d => ({
      ...d,
      percentage: totalExpenses > 0 ? ((d.total / totalExpenses) * 100).toFixed(1) : 0,
    }));

    res.json({ categories: result, total: totalExpenses, month });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/monthly-trends — 6-month income vs expense line chart
router.get('/monthly-trends', async (req, res, next) => {
  try {
    const db = getDb();

    const trends = await db.all(`
      SELECT
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ? AND date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `, [req.user.id]);

    res.json({ trends });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/budget-usage — current month budget burn rate
router.get('/budget-usage', async (req, res, next) => {
  try {
    const db = getDb();
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const usage = await db.all(`
      SELECT b.id, b.amount as budgeted, c.name, c.icon, c.color,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t
           WHERE t.user_id = b.user_id AND t.category_id = b.category_id
           AND t.type = 'expense' AND strftime('%Y-%m', t.date) = b.month),
          0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ?
    `, [req.user.id, month]);

    const result = usage.map(u => ({
      ...u,
      remaining: Math.max(0, u.budgeted - u.spent),
      percentage: u.budgeted > 0 ? Math.min(100, ((u.spent / u.budgeted) * 100)).toFixed(1) : 0,
      over_budget: u.spent > u.budgeted,
    }));

    res.json({ budgets: result, month });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/recent-transactions
router.get('/recent-transactions', async (req, res, next) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 5;

    const transactions = await db.all(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ?
    `, [req.user.id, limit]);

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
