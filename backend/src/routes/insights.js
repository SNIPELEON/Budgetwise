const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/insights
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const insights = [];

    // 1. Total spending this month
    const thisMonthSpend = await db.get(`
      SELECT COALESCE(SUM(amount),0) as total FROM transactions
      WHERE user_id=? AND type='expense' AND strftime('%Y-%m',date)=?
    `, [userId, currentMonth]).total;

    const lastMonthSpend = await db.get(`
      SELECT COALESCE(SUM(amount),0) as total FROM transactions
      WHERE user_id=? AND type='expense' AND strftime('%Y-%m',date)=?
    `, [userId, lastMonth]).total;

    if (lastMonthSpend > 0) {
      const changePct = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend * 100).toFixed(0);
      if (changePct > 10) {
        insights.push({
          id: 'spending_spike',
          type: 'warning',
          title: 'Spending Increased This Month',
          description: `Your spending is up ${changePct}% vs last month ($${lastMonthSpend.toFixed(0)} → $${thisMonthSpend.toFixed(0)}). Review discretionary categories to find savings.`,
          category: 'Overview',
          priority: 1,
        });
      } else if (changePct < -10) {
        insights.push({
          id: 'spending_drop',
          type: 'success',
          title: 'Great Job Reducing Spending!',
          description: `You spent ${Math.abs(changePct)}% less than last month. Keep it up to meet your financial goals faster.`,
          category: 'Overview',
          priority: 1,
        });
      }
    }

    // 2. Savings rate analysis
    const thisMonthIncome = await db.get(`
      SELECT COALESCE(SUM(amount),0) as total FROM transactions
      WHERE user_id=? AND type='income' AND strftime('%Y-%m',date)=?
    `, [userId, currentMonth]).total;

    if (thisMonthIncome > 0) {
      const savingsRate = ((thisMonthIncome - thisMonthSpend) / thisMonthIncome * 100);
      if (savingsRate < 10) {
        insights.push({
          id: 'low_savings_rate',
          type: 'danger',
          title: 'Low Savings Rate Alert',
          description: `You're saving only ${savingsRate.toFixed(0)}% of your income this month. Financial experts recommend saving at least 20%. Consider the 50/30/20 budgeting rule.`,
          category: 'Savings',
          priority: 2,
        });
      } else if (savingsRate >= 20) {
        insights.push({
          id: 'good_savings_rate',
          type: 'success',
          title: 'Excellent Savings Rate!',
          description: `You're saving ${savingsRate.toFixed(0)}% of your income — above the recommended 20%. Consider investing the surplus in index funds or emergency savings.`,
          category: 'Savings',
          priority: 3,
        });
      }
    }

    // 3. Over-budget categories
    const overBudget = await db.get(`
      SELECT c.name, b.amount as budgeted,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t
           WHERE t.user_id=b.user_id AND t.category_id=b.category_id
           AND t.type='expense' AND strftime('%Y-%m',t.date)=b.month),0
        ) as spent
      FROM budgets b JOIN categories c ON b.category_id=c.id
      WHERE b.user_id=? AND b.month=? AND spent > b.amount
    `).all(userId, currentMonth);

    for (const ob of overBudget.slice(0, 2)) {
      const over = ob.spent - ob.budgeted;
      insights.push({
        id: `over_budget_${ob.name.replace(/\s/g, '_').toLowerCase()}`,
        type: 'warning',
        title: `Over Budget: ${ob.name}`,
        description: `You've exceeded your ${ob.name} budget by $${over.toFixed(0)} ($${ob.spent.toFixed(0)} vs $${ob.budgeted.toFixed(0)} budget). Reduce spending in this category for the rest of the month.`,
        category: ob.name,
        priority: 2,
      });
    }

    // 4. Top spending category
    const topCategory = await db.all(`
      SELECT c.name, COALESCE(SUM(t.amount),0) as total
      FROM transactions t JOIN categories c ON t.category_id=c.id
      WHERE t.user_id=? AND t.type='expense' AND strftime('%Y-%m',t.date)=?
      GROUP BY c.id ORDER BY total DESC LIMIT 1
    `, [userId, currentMonth]);

    if (topCategory && topCategory.total > 0) {
      insights.push({
        id: 'top_spending_cat',
        type: 'info',
        title: `Top Spend: ${topCategory.name}`,
        description: `${topCategory.name} is your largest expense category this month at $${topCategory.total.toFixed(0)}. See if there are ways to reduce costs in this area.`,
        category: topCategory.name,
        priority: 4,
      });
    }

    // 5. Goals nearly complete
    const nearComplete = await db.get(`
      SELECT * FROM goals
      WHERE user_id=? AND status='active' AND current_amount/target_amount >= 0.8
    `, [userId]);

    for (const g of nearComplete.slice(0, 2)) {
      const pct = ((g.current_amount / g.target_amount) * 100).toFixed(0);
      insights.push({
        id: `goal_near_${g.id}`,
        type: 'success',
        title: `Almost There: ${g.title}`,
        description: `You're ${pct}% of the way to your "${g.title}" goal! Just $${(g.target_amount - g.current_amount).toFixed(0)} more to go. Consider allocating extra savings here.`,
        category: 'Goals',
        priority: 3,
      });
    }

    // 6. High frequency spending
    const frequentTx = db.prepare(`
      SELECT c.name, COUNT(*) as count, COALESCE(SUM(t.amount),0) as total
      FROM transactions t JOIN categories c ON t.category_id=c.id
      WHERE t.user_id=? AND t.type='expense' AND strftime('%Y-%m',t.date)=?
      AND c.name IN ('Food & Dining','Entertainment','Subscriptions')
      GROUP BY c.id HAVING count >= 10
      ORDER BY count DESC LIMIT 1
    `, [userId, currentMonth]);

    if (frequentTx) {
      insights.push({
        id: 'high_frequency',
        type: 'tip',
        title: `High Frequency: ${frequentTx.name}`,
        description: `You've made ${frequentTx.count} ${frequentTx.name} transactions this month, totaling $${frequentTx.total.toFixed(0)}. Consider meal planning or cooking at home to reduce these expenses.`,
        category: frequentTx.name,
        priority: 5,
      });
    }

    // 7. Generic tips if few insights
    if (insights.length < 3) {
      insights.push({
        id: 'tip_emergency_fund',
        type: 'tip',
        title: '💡 Build Your Emergency Fund',
        description: 'Financial experts recommend keeping 3–6 months of living expenses in an easily accessible savings account. Set up a goal to track your progress!',
        category: 'General',
        priority: 6,
      });
      insights.push({
        id: 'tip_automate',
        type: 'tip',
        title: '💡 Automate Your Savings',
        description: 'Automate a fixed transfer to savings on payday. Treat it like a bill — pay yourself first. Even $100/month grows to $1,200+ per year before interest.',
        category: 'General',
        priority: 7,
      });
    }

    // Sort by priority
    insights.sort((a, b) => a.priority - b.priority);

    res.json({ insights, generated_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
