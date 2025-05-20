/**
 * 检查数据库表结构的脚本
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库连接
const dbPath = path.join(__dirname, 'data', 'hr_payroll.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库:', dbPath);
});

// 查询所有表
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('查询表失败:', err.message);
    closeDb();
    return;
  }
  
  console.log('数据库中的所有表:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // 特别检查departments表
  const hasDepartmentsTable = tables.some(table => table.name === 'departments');
  console.log('\ndepartments表是否存在:', hasDepartmentsTable ? '是' : '否');
  
  // 如果departments表存在，查询其结构
  if (hasDepartmentsTable) {
    db.all("PRAGMA table_info(departments)", [], (err, columns) => {
      if (err) {
        console.error('查询departments表结构失败:', err.message);
        closeDb();
        return;
      }
      
      console.log('\ndepartments表结构:');
      columns.forEach(column => {
        console.log(`- ${column.name} (${column.type})`);
      });
      
      closeDb();
    });
  } else {
    closeDb();
  }
});

// 关闭数据库连接
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接失败:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
  });
}