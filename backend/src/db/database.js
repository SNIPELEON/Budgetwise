const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../budgetwise.db');
const isProd = process.env.NODE_ENV === 'production';

let sqliteDb = null;
let pgPool = null;

async function initDb() {
  if (isProd) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await initSchemaPg();
  } else {
    const Database = require('better-sqlite3');
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    initSchemaSqlite();
  }
}

function getDb() {
  return dbWrapper;
}

const dbWrapper = {
  get: async (sql, params = []) => {
    if (isProd) {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const res = await pgPool.query(pgSql, Array.isArray(params) ? params : [params]);
      return res.rows[0];
    } else {
      return sqliteDb.prepare(sql).get(...(Array.isArray(params) ? params : [params]));
    }
  },
  all: async (sql, params = []) => {
    if (isProd) {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const res = await pgPool.query(pgSql, Array.isArray(params) ? params : [params]);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(...(Array.isArray(params) ? params : [params]));
    }
  },
  run: async (sql, params = []) => {
    if (isProd) {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const res = await pgPool.query(pgSql, Array.isArray(params) ? params : [params]);
      return { 
        changes: res.rowCount, 
        lastInsertRowid: res.rows[0] ? (res.rows[0].id || Object.values(res.rows[0])[0]) : null 
      };
    } else {
      // If the query has RETURNING, we must use get() in better-sqlite3 for it to return anything
      if (/RETURNING/i.test(sql)) {
         const res = sqliteDb.prepare(sql).get(...(Array.isArray(params) ? params : [params]));
         return {
           changes: 1,
           lastInsertRowid: res ? (res.id || Object.values(res)[0]) : null
         };
      }
      const res = sqliteDb.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
      return res;
    }
  }
};

function initSchemaSqlite() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      monthly_income REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      icon TEXT DEFAULT '💰',
      color TEXT DEFAULT '#00BFFF',
      is_system INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      category_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_id, month),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','paused')),
      icon TEXT DEFAULT '🎯',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_categories_seeded (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      seeded INTEGER DEFAULT 0
    );
  `);

  const row = sqliteDb.prepare('SELECT seeded FROM system_categories_seeded WHERE id = 1').get();
  if (!row || !row.seeded) {
    seedCategoriesSync();
    sqliteDb.prepare('INSERT OR REPLACE INTO system_categories_seeded (id, seeded) VALUES (1, 1)').run();
  }
}

async function initSchemaPg() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      monthly_income DECIMAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK(type IN ('income','expense')),
      icon VARCHAR(50) DEFAULT '💰',
      color VARCHAR(50) DEFAULT '#00BFFF',
      is_system INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      type VARCHAR(50) NOT NULL CHECK(type IN ('income','expense')),
      category_id INTEGER REFERENCES categories(id),
      description TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      amount DECIMAL NOT NULL,
      month VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_id, month)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      target_amount DECIMAL NOT NULL,
      current_amount DECIMAL DEFAULT 0,
      deadline DATE,
      status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active','completed','paused')),
      icon VARCHAR(50) DEFAULT '🎯',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_categories_seeded (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      seeded INTEGER DEFAULT 0
    );
  `);

  const res = await pgPool.query('SELECT seeded FROM system_categories_seeded WHERE id = 1');
  if (res.rowCount === 0 || !res.rows[0].seeded) {
    await seedCategoriesAsync();
    await pgPool.query('INSERT INTO system_categories_seeded (id, seeded) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET seeded = 1');
  }
}

function getSystemCategoriesParams() {
  return [
    { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#FF6B6B' },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#FFD93D' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#6BCB77' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#4D96FF' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#C77DFF' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#FF8C42' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#00BFFF' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#FFB347' },
    { name: 'Subscriptions', type: 'expense', icon: '📱', color: '#FF6B9D' },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#00CED1' },
    { name: 'Fitness', type: 'expense', icon: '💪', color: '#7CFC00' },
    { name: 'Other Expense', type: 'expense', icon: '📦', color: '#999999' },
    { name: 'Salary', type: 'income', icon: '💼', color: '#00BFFF' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#00E5FF' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#69FF47' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#FF6B9D' },
    { name: 'Other Income', type: 'income', icon: '💰', color: '#FFD700' },
  ];
}

function seedCategoriesSync() {
  const cats = getSystemCategoriesParams();
  const insert = sqliteDb.prepare('INSERT OR IGNORE INTO categories (name, type, icon, color, is_system) VALUES (?, ?, ?, ?, 1)');
  const insertMany = sqliteDb.transaction((items) => {
    for (const c of items) insert.run(c.name, c.type, c.icon, c.color);
  });
  insertMany(cats);
}

async function seedCategoriesAsync() {
  const cats = getSystemCategoriesParams();
  for (const c of cats) {
    await pgPool.query(
      'INSERT INTO categories (name, type, icon, color, is_system) VALUES ($1, $2, $3, $4, 1) ON CONFLICT DO NOTHING',
      [c.name, c.type, c.icon, c.color]
    );
  }
}

module.exports = { initDb, getDb };
