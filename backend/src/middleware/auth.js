const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = await db.get('SELECT id, name, email, currency, monthly_income, bank_account_name, bank_account_number, ifsc_code, is_verified FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken };
