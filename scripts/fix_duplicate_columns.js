/**
 * 修复数据库表中的重复列
 * 这个脚本用于检测并修复employees表中的重复remark列
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/payroll.db');

console.log('开始修复数据库表结构');
console.log('数据库路径:', dbPath);

// 打开数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 检查employees表中的重复列
async function checkAndFixDuplicateColumns() {
  return new Promise((resolve, reject) => {
    // 查询表结构
    db.all(`PRAGMA table_info(employees)`, [], async (err, rows) => {
      if (err) {
        console.error('查询employees表结构出错:', err.message);
        reject(err);
        return;
      }
      
      console.log('employees表结构:');
      console.table(rows);
      
      // 检查是否有重复的列名
      const nameMap = new Map();
      rows.forEach(row => {
        const name = row.name.replace(/['"`]/g, '');
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name).push(row);
      });
      
      let hasDuplicateColumns = false;
      const duplicateColumns = [];
      
      for (const [name, rowsWithName] of nameMap.entries()) {
        if (rowsWithName.length > 1) {
          hasDuplicateColumns = true;
          console.log(`列名 '${name}' 重复出现 ${rowsWithName.length} 次:`);
          rowsWithName.forEach((row, index) => {
            console.log(`  实例 ${index + 1}: cid=${row.cid}, name=${row.name}, type=${row.type}`);
          });
          duplicateColumns.push({ name, instances: rowsWithName });
        }
      }
      
      if (!hasDuplicateColumns) {
        console.log('表结构正常，没有重复列定义');
        resolve();
        return;
      }
      
      console.log('\n开始修复重复列...');
      
      try {
        // 开始事务
        await runAsync(db, 'BEGIN TRANSACTION');
        
        // 创建临时表
        console.log('创建临时表...');
        await createTempTable();
        
        // 复制数据到临时表
        console.log('复制数据到临时表...');
        await copyDataToTempTable();
        
        // 删除原表
        console.log('删除原表...');
        await runAsync(db, 'DROP TABLE employees');
        
        // 重命名临时表
        console.log('重命名临时表...');
        await runAsync(db, 'ALTER TABLE employees_temp RENAME TO employees');
        
        // 提交事务
        await runAsync(db, 'COMMIT');
        
        console.log('修复完成！');
        resolve();
      } catch (error) {
        // 回滚事务
        await runAsync(db, 'ROLLBACK');
        console.error('修复过程中出错:', error);
        reject(error);
      }
    });
  });
}

// 创建临时表，不包含重复列
async function createTempTable() {
  return runAsync(db, `
    CREATE TABLE employees_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no VARCHAR NOT NULL UNIQUE,
      name VARCHAR NOT NULL,
      department INTEGER NOT NULL,
      position INTEGER NOT NULL,
      entry_date DATE NOT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      social_insurance_group_id INTEGER,
      salary_group_id INTEGER,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gender TEXT DEFAULT 'male',
      base_salary REAL DEFAULT 0,
      birth_date DATE,
      id_card TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      leave_date DATE,
      remark TEXT,
      FOREIGN KEY (social_insurance_group_id) REFERENCES social_insurance_groups (id),
      FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id)
    )
  `);
}

// 复制数据到临时表
async function copyDataToTempTable() {
  return runAsync(db, `
    INSERT INTO employees_temp (
      id, employee_no, name, department, position, entry_date, status,
      social_insurance_group_id, salary_group_id, created_at, updated_at,
      gender, base_salary, birth_date, id_card, phone, email, address,
      leave_date, remark
    )
    SELECT 
      id, employee_no, name, department, position, entry_date, status,
      social_insurance_group_id, salary_group_id, created_at, updated_at,
      gender, base_salary, birth_date, id_card, phone, email, address,
      leave_date, remark
    FROM employees
  `);
}

// Promise包装的db.run方法
function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// 执行修复
checkAndFixDuplicateColumns()
  .then(() => {
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  })
  .catch(err => {
    console.error('修复过程失败:', err);
    // 关闭数据库连接
    db.close();
    process.exit(1);
  });