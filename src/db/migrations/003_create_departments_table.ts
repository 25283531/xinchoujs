/**
 * 创建部门表迁移脚本
 * 确保departments表被正确创建
 */

import { BaseMigration } from './migration';

export class CreateDepartmentsTable extends BaseMigration {
  version = 2023060103; // 版本号比之前的迁移大，确保在之后执行
  name = 'Create departments table';
  
  /**
   * 执行迁移 - 创建部门表
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始创建部门表...');
    
    try {
      // 检查表是否已存在
      const tableExists = await this.checkTableExists('departments');
      
      if (tableExists) {
        this.log('部门表已存在，跳过创建');
        return;
      }
      
      // 创建部门表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      this.log('部门表创建完成');
    } catch (error) {
      this.logError('创建部门表失败', error);
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
   * 回滚迁移 - 删除部门表
   */
  async down(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始回滚部门表...');
    
    try {
      await db.exec('DROP TABLE IF EXISTS departments');
      
      this.log('部门表回滚完成');
    } catch (error) {
      this.logError('回滚部门表失败', error);
      throw error;
    }
  }
}