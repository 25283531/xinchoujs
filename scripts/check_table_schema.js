/**
 * 检查数据库表结构的临时脚本
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/payroll.db');

console.log('开始检查数据库表结构');
console.log('数据库路径:', dbPath);

// 打开数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 查询attendance_records表结构
db.all("PRAGMA table_info(attendance_records)", [], (err, rows) => {
  if (err) {
    console.error('查询表结构出错:', err.message);
  } else {
    console.log('attendance_records表结构:');
    console.table(rows);
  }
  
  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('关闭数据库时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
  });
});
