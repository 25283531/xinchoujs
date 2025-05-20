/**
 * 创建职位表迁移脚本
 * 确保positions表被正确创建
 */

import { BaseMigration } from './migration';

export class CreatePositionsTable extends BaseMigration {
  version = 2025052001; // 版本号比之前的迁移大，确保在之后执行
  name = 'Create positions table';
  
  /**
   * 执行迁移 - 创建职位表
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始创建职位表...');
    
    try {
      // 检查表是否已存在
      const tableExists = await this.checkTableExists('positions');
      
      if (tableExists) {
        this.log('职位表已存在，跳过创建');
        return;
      }
      
      // 创建职位表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS positions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL,
          department_id INTEGER NOT NULL,
          description TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
          UNIQUE(name, department_id)
        )
      `);
      
      // 添加默认职位数据
      await db.exec(`
        INSERT INTO positions (name, department_id) VALUES
        ('软件工程师', 1),
        ('产品经理', 1),
        ('市场专员', 2),
        ('财务专员', 3),
        ('HR专员', 4);
      `);
      
      this.log('职位表创建完成，并添加了默认数据');
    } catch (error) {
      this.logError('创建职位表失败', error);
      throw error;
    }
  }
  
  /**
   * 检查表是否存在
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    const db = this.getDb();
    
    try {
      const result = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      
      return !!result;
    } catch (error) {
      this.logError(`检查表 ${tableName} 是否存在时出错`, error);
      return false;
    }
  }
  
  /**
   * 回滚迁移 - 删除职位表
   */
  async down(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始回滚职位表...');
    
    try {
      await db.exec('DROP TABLE IF EXISTS positions');
      
      this.log('职位表回滚完成');
    } catch (error) {
      this.logError('回滚职位表失败', error);
      throw error;
    }
  }
}
