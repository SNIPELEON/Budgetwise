const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('bank_account_name').trim().notEmpty().withMessage('Bank Account Name required'),
  body('bank_account_number').trim().notEmpty().matches(/^\d{8,18}$/).withMessage('Valid Account Number required'),
  body('ifsc_code').trim().notEmpty().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC Code required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, email, password, currency = 'USD', monthly_income = 0, bank_account_name, bank_account_number, ifsc_code } = req.body;
    const db = getDb();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    
    // Generate Mock OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    // Expires in 10 minutes
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, currency, monthly_income, bank_account_name, bank_account_number, ifsc_code, otp_code, otp_expires_at, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0) RETURNING id', 
      [name, email, password_hash, currency, monthly_income, bank_account_name, bank_account_number, ifsc_code, otp_code, otp_expires_at]
    );

    res.status(201).json({
      message: 'Registration successful. Please verify your bank account.',
      requires_otp: true,
      email: email,
      // DEV ONLY: Returning OTP in response for easy local testing
      dev_otp: otp_code
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp_code').isString().isLength({ min: 6, max: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { email, otp_code } = req.body;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'User is already verified' });

    if (user.otp_code !== otp_code || new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified
    await db.run('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user.id]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      message: 'Bank account verified successfully',
      token,
      user: {
        id: user.id, name: user.name, email: user.email, currency: user.currency, 
        monthly_income: user.monthly_income, bank_account_name: user.bank_account_name,
        bank_account_number: user.bank_account_number, ifsc_code: user.ifsc_code, is_verified: 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
       // Issue new OTP if unverified
       const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
       const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
       await db.run('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [otp_code, otp_expires_at, user.id]);
       return res.status(403).json({ 
         error: 'Please verify your bank account first.', 
         requires_otp: true, 
         email: email,
         dev_otp: otp_code 
       });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        currency: user.currency, monthly_income: user.monthly_income,
        bank_account_name: user.bank_account_name, bank_account_number: user.bank_account_number,
        ifsc_code: user.ifsc_code, is_verified: 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('monthly_income').optional().isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, currency, monthly_income, currentPassword, newPassword } = req.body;
    const db = getDb();

    if (newPassword) {
      const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      const isValid = await bcrypt.compare(currentPassword || '', user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(newPassword, 12);
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (currency !== undefined) updates.currency = currency;
    if (monthly_income !== undefined) updates.monthly_income = monthly_income;

    if (Object.keys(updates).length > 0) {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), req.user.id];
      await db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values]);
    }

    const updatedUser = await db.get('SELECT id, name, email, currency, monthly_income FROM users WHERE id = ?', [req.user.id]);

    res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
