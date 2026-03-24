require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const { initDb, getDb } = require('./db/database');
const { seedDemoData } = require('./db/seeder');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Managed by frontend
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/insights', require('./routes/insights'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize DB and start server
const PORT = process.env.PORT || 5000;

initDb().then(async () => {
  try {
    await seedDemoData(); // Seed demo data if needed
    app.listen(PORT, () => {
      console.log(`\n🚀 BudgetWise API running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Demo login: demo@budgetwise.com / Demo@1234\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
