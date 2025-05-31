/**
 * 检查数据库表结构的脚本
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库连接
const dbPath = path.join(__dirname, 'data', 'payroll.db');
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
  
  // 特别检查employees表
  const hasEmployeesTable = tables.some(table => table.name === 'employees');
  console.log('employees表是否存在:', hasEmployeesTable ? '是' : '否');
  
  // 如果employees表存在，查询其结构和约束
  if (hasEmployeesTable) {
    db.all("PRAGMA table_info(employees)", [], (err, columns) => {
      if (err) {
        console.error('查询employees表结构失败:', err.message);
        closeDb();
        return;
      }
      
      console.log('\nemployees表结构:');
      columns.forEach(column => {
        console.log(`- ${column.name} (${column.type}, pk: ${column.pk}, notnull: ${column.notnull}, unique: ${column.dflt_value})`);
      });
      
      // 查询索引信息
      db.all("PRAGMA index_list(employees)", [], (err, indexes) => {
        if (err) {
          console.error('查询employees表索引失败:', err.message);
          closeDb();
          return;
        }
        
        console.log('\nemployees表索引:');
        indexes.forEach(index => {
          console.log(`- ${index.name} (unique: ${index.unique})`);
        });
        
        // 查询现有数据数量
        db.get("SELECT COUNT(*) as count FROM employees", [], (err, row) => {
          if (err) {
            console.error('查询employees表数据数量失败:', err.message);
          } else {
            console.log(`\nemployees表现有数据数量: ${row.count}`);
          }
          closeDb();
        });
      });
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