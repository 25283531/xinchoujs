/**
 * 修复departments表的脚本
 * 用于检查并创建departments表，解决应用程序启动问题
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

// 检查departments表是否存在
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'", [], (err, table) => {
  if (err) {
    console.error('查询表失败:', err.message);
    closeDb();
    return;
  }
  
  if (table) {
    console.log('departments表已存在，无需创建');
    closeDb();
    return;
  }
  
  console.log('departments表不存在，开始创建...');
  
  // 创建departments表
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建departments表失败:', err.message);
      closeDb();
      return;
    }
    
    console.log('departments表创建成功');
    
    // 添加一个默认部门
    db.run('INSERT INTO departments (name, description) VALUES (?, ?)', ['默认部门', '系统默认创建的部门'], function(err) {
      if (err) {
        console.error('添加默认部门失败:', err.message);
      } else {
        console.log('已添加默认部门，ID:', this.lastID);
      }
      
      // 更新迁移版本表，记录departments表已创建
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'", [], (err, migrationsTable) => {
        if (err) {
          console.error('检查迁移版本表失败:', err.message);
          closeDb();
          return;
        }
        
        // 如果迁移版本表不存在，先创建它
        if (!migrationsTable) {
          console.log('迁移版本表不存在，开始创建...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
              version INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('创建迁移版本表失败:', err.message);
              closeDb();
              return;
            }
            
            console.log('迁移版本表创建成功');
            addMigrationRecord();
          });
        } else {
          addMigrationRecord();
        }
        
        // 定义添加迁移记录的函数
      function addMigrationRecord() {
        // 检查是否已有版本号为2023060103的记录
        db.get('SELECT version FROM schema_migrations WHERE version = ?', [2023060103], (err, row) => {
          if (err) {
            console.error('查询迁移版本记录失败:', err.message);
            closeDb();
            return;
          }
          
          if (row) {
            console.log('迁移版本2023060103已存在，无需添加');
            closeDb();
            return;
          }
          
          // 添加迁移版本记录
          db.run(
            'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
            [2023060103, 'Create departments table'],
            (err) => {
              if (err) {
                console.error('添加迁移版本记录失败:', err.message);
              } else {
                console.log('已添加迁移版本记录2023060103');
              }
              
              closeDb();
            }
          );
        });
      }
      
      // 调用函数检查并添加迁移记录
      addMigrationRecord();
      });
    });
  });
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