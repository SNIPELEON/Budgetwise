const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
files.push('../middleware/auth.js');
files.push('../db/seeder.js');

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Make router callbacks async
  content = content.replace(/\(req, res, next\) => \{/g, 'async (req, res, next) => {');
  content = content.replace(/authenticateToken\(req, res, next\) \{/g, 'async authenticateToken(req, res, next) {');
  content = content.replace(/function seedDemoData\(\) \{/g, 'async function seedDemoData() {');

  // Replace db.prepare(sql).get(...params) -> await db.get(sql, [...params])
  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.get\(([\s\S]*?)\)/g, (match, sql, params) => {
    return `await db.get(${sql}${params.trim() ? `, [${params}]` : ', []'})`;
  });
  
  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.get\(\)/g, (match, sql) => {
    return `await db.get(${sql}, [])`;
  });

  // Replace db.prepare(sql).all(...params) -> await db.all(sql, [...params])
  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.all\(([\s\S]*?)\)/g, (match, sql, params) => {
    return `await db.all(${sql}${params.trim() ? `, [${params}]` : ', []'})`;
  });

  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.all\(\)/g, (match, sql) => {
    return `await db.all(${sql}, [])`;
  });

  // Replace db.prepare(sql).run(...params) -> await db.run(sql, [...params])
  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.run\(([\s\S]*?)\)/g, (match, sql, params) => {
    return `await db.run(${sql}${params.trim() ? `, [${params}]` : ', []'})`;
  });
  
  content = content.replace(/db\.prepare\(\s*([\s\S]*?)\s*\)\.run\(\)/g, (match, sql) => {
    return `await db.run(${sql}, [])`;
  });

  // Handle db.transaction
  content = content.replace(/db\.transaction\(\(items\) => \{[\s\S]*?\}\);/g, `
    const insertMany = async (items) => {
      for (const item of items) {
        await db.run(insertSql, [item.name, item.type, item.icon, item.color]); 
      }
    };
  `);
  // specifically for seeder, we will manually fix transaction logic if needed.

  fs.writeFileSync(filePath, content);
}

console.log('Refactoring applied.');
