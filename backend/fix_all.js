const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix async async
  content = content.replace(/async\s+async/g, 'async');

  // Fix generic `await db.run(...)` that are actually selects (mostly returning single value)
  // Well, it's not trivial via regex. Let's do common specific replacements.
  if (file === 'auth.js') {
    content = content.replace(/await db\.run\('SELECT \* FROM users WHERE email = \?', \[email\]\);/, "await db.get('SELECT * FROM users WHERE email = ?', [email]);");
    content = content.replace(/await db\.get\('UPDATE users SET password_hash/g, "await db.run('UPDATE users SET password_hash");
    content = content.replace(/const updatedUser = db\.prepare\([\s\S]*?\]\);/g, "const updatedUser = await db.get('SELECT id, name, email, currency, monthly_income FROM users WHERE id = ?', [req.user.id]);");
  }

  if (file === 'transactions.js') {
    content = content.replace(/const total\s*=\s*(await db\.get\([\s\S]*?\))\.count;/g, "const totalRes = $1; const total = totalRes ? totalRes.count : 0;");
    
    // Fix multi-line string transactions query
    content = content.replace(/const transactions = await db\.get\(\`([\s\S]*?)\`\)\.all\(\.\.\.params, limit, offset\);/g, "const transactions = await db.all(`$1`, [...params, limit, offset]);");
    
    // Fix INSERT
    content = content.replace(/const result = await db\.all\('INSERT INTO transactions([\s\S]*?)'\s*\)\.run\(([\s\S]*?)\);/g, "const result = await db.run('INSERT INTO transactions$1', [$2]);");
    
    // Fix UPDATE
    content = content.replace(/await db\.get\(\`UPDATE transactions SET \$\{fields\} WHERE id = \? AND user_id = \?\`\)\s*\.run\(\.\.\.Object\.values\(updates\), req\.params\.id, req\.user\.id\);/g, "await db.run(`UPDATE transactions SET \${fields} WHERE id = ? AND user_id = ?`, [...Object.values(updates), req.params.id, req.user.id]);");
    
    // Fix db.prepare SELECT transaction
    content = content.replace(/const transaction = db\.prepare\(\`([\s\S]*?)\`,\s*\[(.*?)\]\);/g, "const transaction = await db.get(`$1`, [$2]);");
    
    content = content.replace(/const categories = db\.prepare\('SELECT \* FROM categories ORDER BY type, name',\s*\[\]\);/g, "const categories = await db.all('SELECT * FROM categories ORDER BY type, name', []);");
    content = content.replace(/const result = db\.prepare\([\s\S]*?'DELETE FROM transactions WHERE id = \? AND user_id = \?', \[(.*?)\]\);/g, "const result = await db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [$1]);");
  }

  // Same logic goes exactly for others
  if (file === 'goals.js') {
    content = content.replace(/const total\s*=\s*(await db\.get\([\s\S]*?\))\.count;/g, "const totalRes = $1; const total = totalRes ? totalRes.count : 0;");
    content = content.replace(/const goals = await db\.get\(\`([\s\S]*?)\`\)\.all\(\.\.\.params, limit, offset\);/g, "const goals = await db.all(`$1`, [...params, limit, offset]);");
    content = content.replace(/const result = await db\.all\('INSERT INTO goals([\s\S]*?)'\s*\)\.run\(([\s\S]*?)\);/g, "const result = await db.run('INSERT INTO goals$1', [$2]);");
    content = content.replace(/await db\.get\(\`UPDATE goals SET \$\{fields\} WHERE id = \? AND user_id = \?\`\)\s*\.run\(\.\.\.Object\.values\(updates\), req\.params\.id, req\.user\.id\);/g, "await db.run(`UPDATE goals SET \${fields} WHERE id = ? AND user_id = ?`, [...Object.values(updates), req.params.id, req.user.id]);");
    content = content.replace(/const goal = db\.prepare\(\`([\s\S]*?)\`,\s*\[(.*?)\]\);/g, "const goal = await db.get(`$1`, [$2]);");
    content = content.replace(/const goal = db\.prepare\('SELECT \* FROM goals WHERE id = \? AND user_id = \?', \[(.*?)\]\);/g, "const goal = await db.get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [$1]);");
    content = content.replace(/const result = db\.prepare\([\s\S]*?'DELETE FROM goals WHERE id = \? AND user_id = \?', \[(.*?)\]\);/g, "const result = await db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [$1]);");
  }
  
  if (file === 'budgets.js') {
    content = content.replace(/const budgets = await db\.get\(\`([\s\S]*?)\`\)\.all\(\.\.\.params\);/g, "const budgets = await db.all(`$1`, [...params]);");
    content = content.replace(/const result = await db\.all\('INSERT INTO budgets([\s\S]*?)'\s*\)\.run\(([\s\S]*?)\);/g, "const result = await db.run('INSERT INTO budgets$1', [$2]);");
    content = content.replace(/await db\.get\(\`UPDATE budgets SET \$\{fields\} WHERE id = \? AND user_id = \?\`\)\s*\.run\(\.\.\.Object\.values\(updates\), req\.params\.id, req\.user\.id\);/g, "await db.run(`UPDATE budgets SET \${fields} WHERE id = ? AND user_id = ?`, [...Object.values(updates), req.params.id, req.user.id]);");
    content = content.replace(/const budget = db\.prepare\(\`([\s\S]*?)\`,\s*\[(.*?)\]\);/g, "const budget = await db.get(`$1`, [$2]);");
    content = content.replace(/const result = db\.prepare\([\s\S]*?'DELETE FROM budgets WHERE id = \? AND user_id = \?', \[(.*?)\]\);/g, "const result = await db.run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [$1]);");
  }

  if (file === 'analytics.js') {
    content = content.replace(/const totalRes = db\.prepare\(\`([\s\S]*?)\`\)\.get\(\.\.\.params\);/g, "const totalRes = await db.get(`$1`, [...params]);");
    content = content.replace(/const chartData = db\.prepare\(\`([\s\S]*?)\`\)\.all\(\.\.\.params\);/g, "const chartData = await db.all(`$1`, [...params]);");
    content = content.replace(/const totals = db\.prepare\('([\s\S]*?)'\)\.all\(\.\.\.params\);/g, "const totals = await db.all('$1', [...params]);");
    content = content.replace(/const incomeRes = db\.prepare\([\s\S]*?'SELECT SUM\(amount\) as sum FROM transactions WHERE user_id = \? AND type = \? AND date >= \? AND date <= \?',\s*\[(.*?)\]/g, "const incomeRes = await db.get('SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?', [$1]");
    content = content.replace(/const expenseRes = db\.prepare\([\s\S]*?'SELECT SUM\(amount\) as sum FROM transactions WHERE user_id = \? AND type = \? AND date >= \? AND date <= \?',\s*\[(.*?)\]/g, "const expenseRes = await db.get('SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?', [$1]");
  }

  if (file === 'insights.js') {
    content = content.replace(/const stats = db\.prepare\(\`([\s\S]*?)\`\)\.all\(\.\.\.params\);/g, "const stats = await db.all(`$1`, [...params]);");
    content = content.replace(/const budgets = db\.prepare\(\`([\s\S]*?)\`\)\.all\(req\.user\.id, currentMonth\);/g, "const budgets = await db.all(`$1`, [req.user.id, currentMonth]);");
    content = content.replace(/const trends = db\.prepare\(\`([\s\S]*?)\`\)\.all\(\.\.\.params\);/g, "const trends = await db.all(`$1`, [...params]);");
  }

  fs.writeFileSync(filePath, content);
});

console.log('Fix script applied.');
