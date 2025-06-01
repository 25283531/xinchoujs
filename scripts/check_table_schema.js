/**
 * 检查数据库表结构的临时脚本
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 获取命令行参数，默认检查attendance_records表
const tableName = process.argv[2] || 'attendance_records';

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/payroll.db');

console.log('开始检查数据库表结构');
console.log('数据库路径:', dbPath);
console.log('检查表名:', tableName);

// 打开数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 查询表结构
db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
  if (err) {
    console.error(`查询${tableName}表结构出错:`, err.message);
  } else {
    console.log(`${tableName}表结构:`);
    console.table(rows);
    
    // 打印原始行数据，用于调试
    console.log('\n原始行数据:');
    rows.forEach((row, index) => {
      console.log(`行 ${index}:`, JSON.stringify(row));
    });
    
    // 检查是否有重复的cid
    console.log('\n检查cid是否重复:');
    const cidMap = new Map();
    rows.forEach(row => {
      if (!cidMap.has(row.cid)) {
        cidMap.set(row.cid, []);
      }
      cidMap.get(row.cid).push(row);
    });
    
    let hasDuplicateCid = false;
    for (const [cid, rowsWithCid] of cidMap.entries()) {
      if (rowsWithCid.length > 1) {
        hasDuplicateCid = true;
        console.log(`cid ${cid} 重复出现 ${rowsWithCid.length} 次`);
      }
    }
    
    if (!hasDuplicateCid) {
      console.log('没有发现重复的cid');
    }
    
    // 检查是否有重复的列名
    console.log('\n检查列名是否重复:');
    const nameMap = new Map();
    rows.forEach(row => {
      const name = row.name.replace(/['"`]/g, '');
      console.log(`处理列名: '${row.name}' -> '${name}'`);
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name).push(row);
    });
    
    let hasDuplicateName = false;
    for (const [name, rowsWithName] of nameMap.entries()) {
      if (rowsWithName.length > 1) {
        hasDuplicateName = true;
        console.log(`列名 '${name}' 重复出现 ${rowsWithName.length} 次:`);
        rowsWithName.forEach((row, index) => {
          console.log(`  实例 ${index + 1}: cid=${row.cid}, name=${row.name}, type=${row.type}`);
        });
      }
    }
    
    if (hasDuplicateName) {
      console.log('\n警告: 表中存在重复列定义!');
    } else {
      console.log('\n表结构正常，没有重复列定义');
    }
    
    // 查询表中的数据数量
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
      if (err) {
        console.error(`查询${tableName}表数据数量出错:`, err.message);
      } else {
        console.log(`\n${tableName}表中的数据数量:`, result.count);
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
  }
});
