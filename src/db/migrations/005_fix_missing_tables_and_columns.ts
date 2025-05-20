import { Database } from '../database';
import { Migration } from './migration';

interface ColumnInfo {
  name: string;
  type: string;
  [key: string]: any;
}

/**
 * 数据库迁移：修复缺失的表和字段
 * 1. 创建positions表
 * 2. 为salary_groups表添加calculation_order列
 * 3. 确保salary_items表有subsidy_cycle列
 */
export class FixMissingTablesAndColumns implements Migration {
  readonly version = 2023060104; // 迁移版本号
  readonly name = '修复缺失的表和字段'; // 迁移名称

  async up(): Promise<void> {
    console.log(`开始执行迁移 ${this.version} - ${this.name}...`);
    const db = Database.getInstance().getConnection();
    try {
      // 1. 创建positions表
      console.log('检查并创建positions表...');
      const tableExists = await this.checkTableExists(db, 'positions');
      
      if (!tableExists) {
        console.log('positions表不存在，开始创建...');
        await db.exec(`
          CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department_id INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
          )
        `);
        console.log('positions表创建成功');
      } else {
        console.log('positions表已存在，无需创建');
      }
      
      // 2. 为salary_groups表添加calculation_order列
      console.log('检查salary_groups表结构...');
      const salaryGroupsColumns = await this.getTableColumns(db, 'salary_groups');
      const hasCalculationOrder = salaryGroupsColumns.some(col => col.name === 'calculation_order');
      
      if (!hasCalculationOrder) {
        console.log('添加calculation_order列到salary_groups表...');
        await db.exec(`ALTER TABLE salary_groups ADD COLUMN calculation_order INTEGER DEFAULT 0`);
        console.log('calculation_order列添加成功');
      } else {
        console.log('calculation_order列已存在，无需添加');
      }
      
      // 3. 检查salary_items表是否有subsidy_cycle列
      console.log('检查salary_items表结构...');
      const salaryItemsColumns = await this.getTableColumns(db, 'salary_items');
      const hasSubsidyCycle = salaryItemsColumns.some(col => col.name === 'subsidy_cycle');
      
      if (!hasSubsidyCycle) {
        console.log('添加subsidy_cycle列到salary_items表...');
        await db.exec(`ALTER TABLE salary_items ADD COLUMN subsidy_cycle TEXT DEFAULT 'monthly'`);
        console.log('subsidy_cycle列添加成功');
      } else {
        console.log('subsidy_cycle列已存在，无需添加');
      }
      
      console.log(`迁移 ${this.version} - ${this.name} 执行成功`);
    } catch (error) {
      console.error(`迁移 ${this.version} - ${this.name} 执行失败:`, error);
      throw error;
    }
  }

  async down(): Promise<void> {
    // 回滚操作暂不实现，因为删除列或表可能导致数据丢失
    return Promise.resolve();
  }
  
  // 辅助方法：检查表是否存在
  private async checkTableExists(db: any, tableName: string): Promise<boolean> {
    const row = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
    return !!row;
  }
  
  // 辅助方法：获取表的列信息
  private async getTableColumns(db: any, tableName: string): Promise<ColumnInfo[]> {
    const rows = await db.all(`PRAGMA table_info(${tableName})`);
    return rows as ColumnInfo[];
  }
}
