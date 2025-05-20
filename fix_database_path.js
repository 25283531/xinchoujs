/**
 * 数据库路径修复脚本
 * 解决应用程序使用两个不同数据库文件的问题
 * 将hr_payroll.db中的数据合并到payroll.db中
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const hrDbPath = path.join(__dirname, 'data', 'hr_payroll.db');
const payrollDbPath = path.join(__dirname, 'data', 'payroll.db');

console.log('数据库路径修复脚本启动');
console.log('hr_payroll.db 路径:', hrDbPath);
console.log('payroll.db 路径:', payrollDbPath);

// 检查两个数据库文件是否都存在
if (!fs.existsSync(hrDbPath)) {
  console.error('hr_payroll.db 文件不存在');
  process.exit(1);
}

if (!fs.existsSync(payrollDbPath)) {
  console.log('payroll.db 文件不存在，将创建新文件');
  // 如果payroll.db不存在，直接复制hr_payroll.db为payroll.db
  fs.copyFileSync(hrDbPath, payrollDbPath);
  console.log('已将 hr_payroll.db 复制为 payroll.db');
  process.exit(0);
}

// 打开两个数据库连接
const hrDb = new sqlite3.Database(hrDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('无法连接到 hr_payroll.db:', err.message);
    process.exit(1);
  }
  console.log('已连接到 hr_payroll.db');
});

const payrollDb = new sqlite3.Database(payrollDbPath, (err) => {
  if (err) {
    console.error('无法连接到 payroll.db:', err.message);
    closeHrDb();
    process.exit(1);
  }
  console.log('已连接到 payroll.db');
});

// 获取hr_payroll.db中的所有表
hrDb.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('查询hr_payroll.db表失败:', err.message);
    closeAllDbs();
    return;
  }
  
  console.log('hr_payroll.db中的所有表:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // 获取payroll.db中的所有表
  payrollDb.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, payrollTables) => {
    if (err) {
      console.error('查询payroll.db表失败:', err.message);
      closeAllDbs();
      return;
    }
    
    console.log('\npayroll.db中的所有表:');
    payrollTables.forEach(table => {
      console.log(`- ${table.name}`);
    });
    
    // 开始合并数据
    console.log('\n开始合并数据...');
    
    // 开始事务
    payrollDb.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('开始事务失败:', err.message);
        closeAllDbs();
        return;
      }
      
      // 处理每个表
      processNextTable(tables, 0, payrollTables.map(t => t.name), () => {
        // 所有表处理完成，提交事务
        payrollDb.run('COMMIT', (err) => {
          if (err) {
            console.error('提交事务失败:', err.message);
            payrollDb.run('ROLLBACK');
          } else {
            console.log('数据合并完成，事务已提交');
            console.log('\n请使用 payroll.db 作为唯一的数据库文件');
            console.log('建议修改 src/main.ts 中的数据库路径配置，确保使用 payroll.db');
          }
          closeAllDbs();
        });
      });
    });
  });
});

// 递归处理每个表
function processNextTable(tables, index, existingTables, callback) {
  if (index >= tables.length) {
    callback(); // 所有表处理完成
    return;
  }
  
  const tableName = tables[index].name;
  
  // 跳过sqlite内部表
  if (tableName === 'sqlite_sequence') {
    processNextTable(tables, index + 1, existingTables, callback);
    return;
  }
  
  console.log(`处理表: ${tableName}`);
  
  // 检查表是否存在于payroll.db中
  if (existingTables.includes(tableName)) {
    // 表已存在，合并数据
    mergeTableData(tableName, () => {
      processNextTable(tables, index + 1, existingTables, callback);
    });
  } else {
    // 表不存在，创建表并复制数据
    createTableAndCopyData(tableName, () => {
      processNextTable(tables, index + 1, existingTables, callback);
    });
  }
}

// 合并表数据
function mergeTableData(tableName, callback) {
  console.log(`表 ${tableName} 已存在，合并数据...`);
  
  // 获取表结构
  hrDb.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
    if (err) {
      console.error(`获取表 ${tableName} 结构失败:`, err.message);
      callback();
      return;
    }
    
    // 构建列名列表
    const columnNames = columns.map(col => col.name).join(', ');
    
    // 获取hr_payroll.db中的数据
    hrDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(`从hr_payroll.db获取表 ${tableName} 数据失败:`, err.message);
        callback();
        return;
      }
      
      console.log(`表 ${tableName} 中有 ${rows.length} 条记录`);
      
      if (rows.length === 0) {
        console.log(`表 ${tableName} 没有数据需要合并`);
        callback();
        return;
      }
      
      // 为每行数据构建INSERT语句
      let processed = 0;
      
      rows.forEach(row => {
        // 构建VALUES部分
        const placeholders = Object.keys(row).map(() => '?').join(', ');
        const values = Object.values(row);
        
        // 构建INSERT OR IGNORE语句（忽略已存在的记录）
        const insertSql = `INSERT OR IGNORE INTO ${tableName} (${Object.keys(row).join(', ')}) VALUES (${placeholders})`;
        
        payrollDb.run(insertSql, values, function(err) {
          if (err) {
            console.error(`插入数据到表 ${tableName} 失败:`, err.message);
          }
          
          processed++;
          if (processed === rows.length) {
            console.log(`表 ${tableName} 数据合并完成`);
            callback();
          }
        });
      });
    });
  });
}

// 创建表并复制数据
function createTableAndCopyData(tableName, callback) {
  console.log(`表 ${tableName} 不存在，创建表并复制数据...`);
  
  // 获取表创建语句
  hrDb.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, result) => {
    if (err || !result) {
      console.error(`获取表 ${tableName} 创建语句失败:`, err ? err.message : '未找到表');
      callback();
      return;
    }
    
    // 创建表
    payrollDb.run(result.sql, (err) => {
      if (err) {
        console.error(`创建表 ${tableName} 失败:`, err.message);
        callback();
        return;
      }
      
      console.log(`表 ${tableName} 创建成功`);
      
      // 复制数据
      hrDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) {
          console.error(`从hr_payroll.db获取表 ${tableName} 数据失败:`, err.message);
          callback();
          return;
        }
        
        console.log(`表 ${tableName} 中有 ${rows.length} 条记录需要复制`);
        
        if (rows.length === 0) {
          console.log(`表 ${tableName} 没有数据需要复制`);
          callback();
          return;
        }
        
        // 为每行数据构建INSERT语句
        let processed = 0;
        
        rows.forEach(row => {
          // 构建VALUES部分
          const placeholders = Object.keys(row).map(() => '?').join(', ');
          const values = Object.values(row);
          
          // 构建INSERT语句
          const insertSql = `INSERT INTO ${tableName} (${Object.keys(row).join(', ')}) VALUES (${placeholders})`;
          
          payrollDb.run(insertSql, values, function(err) {
            if (err) {
              console.error(`插入数据到表 ${tableName} 失败:`, err.message);
            }
            
            processed++;
            if (processed === rows.length) {
              console.log(`表 ${tableName} 数据复制完成`);
              callback();
            }
          });
        });
      });
    });
  });
}

// 关闭hr_payroll.db连接
function closeHrDb() {
  hrDb.close((err) => {
    if (err) {
      console.error('关闭hr_payroll.db连接失败:', err.message);
    } else {
      console.log('hr_payroll.db连接已关闭');
    }
  });
}

// 关闭payroll.db连接
function closePayrollDb() {
  payrollDb.close((err) => {
    if (err) {
      console.error('关闭payroll.db连接失败:', err.message);
    } else {
      console.log('payroll.db连接已关闭');
    }
  });
}

// 关闭所有数据库连接
function closeAllDbs() {
  closeHrDb();
  closePayrollDb();
}