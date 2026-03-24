const { getDb } = require('./database');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
  const db = getDb();

  // Only seed if demo user hasn't been created yet
  const existing = await db.get("SELECT id FROM users WHERE email = 'demo@budgetwise.com'");
  if (existing) return;

  const password_hash = bcrypt.hashSync('Demo@1234', 12);
  const userResult = await db.run(
    "INSERT INTO users (name, email, password_hash, currency, monthly_income, bank_account_name, bank_account_number, ifsc_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE) RETURNING id",
    ['Alex Johnson', 'demo@budgetwise.com', password_hash, 'USD', 5500, 'Alex Johnson', '000123456789', 'HDFC0001234']
  );
  const userId = userResult.lastInsertRowid;

  // Fetch categories
  const cats = {};
  const categoriesDb = await db.all('SELECT * FROM categories');
  categoriesDb.forEach(c => { cats[c.name] = c.id; });

  // Generate 3 months of transactions
  const today = new Date();
  const transactions = [];

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const baseDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);

    // Salary
    transactions.push({
      user_id: userId, amount: 5500, type: 'income',
      category_id: cats['Salary'],
      description: 'Monthly Salary', date: formatDate(baseDate, 1)
    });

    // Freelance (random months)
    if (monthOffset < 2) {
      transactions.push({
        user_id: userId, amount: rand(300, 800), type: 'income',
        category_id: cats['Freelance'],
        description: 'Freelance Project', date: formatDate(baseDate, 15)
      });
    }

    // Expenses
    const expenseTemplates = [
      { cat: 'Housing', desc: 'Monthly Rent', amt: 1400, day: 1 },
      { cat: 'Utilities', desc: 'Electric Bill', amt: rand(80, 130), day: 5 },
      { cat: 'Utilities', desc: 'Internet & Phone', amt: 70, day: 5 },
      { cat: 'Food & Dining', desc: 'Grocery Run', amt: rand(100, 160), day: 3 },
      { cat: 'Food & Dining', desc: 'Restaurant Dinner', amt: rand(30, 70), day: 7 },
      { cat: 'Food & Dining', desc: 'Coffee Shop', amt: rand(15, 30), day: 10 },
      { cat: 'Food & Dining', desc: 'Work Lunch', amt: rand(20, 50), day: 13 },
      { cat: 'Food & Dining', desc: 'Grocery Run', amt: rand(80, 130), day: 17 },
      { cat: 'Food & Dining', desc: 'Takeout', amt: rand(25, 55), day: 21 },
      { cat: 'Transportation', desc: 'Gas & Fuel', amt: rand(50, 90), day: 6 },
      { cat: 'Transportation', desc: 'Uber Ride', amt: rand(15, 35), day: 12 },
      { cat: 'Entertainment', desc: 'Movie Tickets', amt: rand(20, 45), day: 8 },
      { cat: 'Entertainment', desc: 'Concert / Event', amt: rand(40, 100), day: 20 },
      { cat: 'Subscriptions', desc: 'Netflix', amt: 15.99, day: 2 },
      { cat: 'Subscriptions', desc: 'Spotify', amt: 9.99, day: 2 },
      { cat: 'Subscriptions', desc: 'Gym Membership', amt: 49, day: 3 },
      { cat: 'Shopping', desc: 'Amazon Purchase', amt: rand(30, 80), day: 14 },
      { cat: 'Shopping', desc: 'Clothing', amt: rand(50, 150), day: 22 },
      { cat: 'Healthcare', desc: 'Pharmacy', amt: rand(15, 40), day: 9 },
    ];

    for (const tx of expenseTemplates) {
      const catId = cats[tx.cat];
      if (catId) {
        transactions.push({
          user_id: userId, amount: tx.amt, type: 'expense',
          category_id: catId, description: tx.desc,
          date: formatDate(baseDate, Math.min(tx.day, getDaysInMonth(baseDate)))
        });
      }
    }
  }

  for (const t of transactions) {
    await db.run('INSERT INTO transactions (user_id, amount, type, category_id, description, date) VALUES (?,?,?,?,?,?)', [t.user_id, t.amount, t.type, t.category_id, t.description, t.date]);
  }

  // Budgets for current month
  const currentMonth = today.toISOString().slice(0, 7);
  const budgets = [
    { cat: 'Food & Dining', amount: 500 },
    { cat: 'Housing', amount: 1500 },
    { cat: 'Transportation', amount: 200 },
    { cat: 'Entertainment', amount: 150 },
    { cat: 'Shopping', amount: 200 },
    { cat: 'Subscriptions', amount: 100 },
    { cat: 'Utilities', amount: 200 },
    { cat: 'Healthcare', amount: 100 },
  ];

  for (const b of budgets) {
    const catId = cats[b.cat];
    if (catId) {
      await db.run('INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?,?,?,?) ON CONFLICT DO NOTHING', [userId, catId, b.amount, currentMonth]).catch(() => {
         // fallback for SQLite if ON CONFLICT syntax is not supported in the exact same way, though better-sqlite3 supports it since 3.24
         return db.run('INSERT OR IGNORE INTO budgets (user_id, category_id, amount, month) VALUES (?,?,?,?)', [userId, catId, b.amount, currentMonth]);
      });
    }
  }

  // Goals
  const goals = [
    { title: 'Emergency Fund', target_amount: 15000, current_amount: 8500, deadline: '2025-12-31', icon: '🛡️' },
    { title: 'Vacation to Japan', target_amount: 3500, current_amount: 1200, deadline: '2025-08-01', icon: '✈️' },
    { title: 'New Laptop', target_amount: 1800, current_amount: 1620, deadline: '2025-05-01', icon: '💻' },
    { title: 'Investment Portfolio', target_amount: 10000, current_amount: 2400, deadline: '2026-01-01', icon: '📈' },
  ];

  for (const g of goals) {
    await db.run('INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, icon) VALUES (?,?,?,?,?,?)', [userId, g.title, g.target_amount, g.current_amount, g.deadline, g.icon]);
  }

  console.log('✅ Demo data seeded. Login: demo@budgetwise.com / Demo@1234');
}

function rand(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function formatDate(base, day) {
  const d = new Date(base.getFullYear(), base.getMonth(), day);
  return d.toISOString().slice(0, 10);
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

module.exports = { seedDemoData };
