/**
 * 数据库迁移脚本：向 salary_items 表添加 is_preset 列
 */

import { Database } from '../database';
import { Migration } from './migration';

export class AddIsPresetToSalaryItems implements Migration {
  readonly version = 2023060103; // 使用一个唯一的版本号，大于之前的迁移
  readonly name = 'Add is_preset to salary_items';

  async up(): Promise<void> {
    console.log(`开始执行迁移 ${this.version} - ${this.name}...`);
    const db = Database.getInstance().getConnection();

    try {
      // 检查表是否存在
      try {
        await db.get(`SELECT 1 FROM salary_items LIMIT 1`);
      } catch (error) {
        console.log('salary_items 表不存在，将在表创建后再执行迁移');
        return; // 表不存在，退出迁移
      }

      // 获取表结构信息
      const tableInfo = await db.all(`PRAGMA table_info(salary_items)`);
      console.log('当前 salary_items 表结构:', tableInfo.map((col: any) => col.name).join(', '));

      // 检查并添加 is_preset 列
      if (!tableInfo.some((column: any) => column.name === 'is_preset')) {
        try {
          console.log('添加 is_preset 列...');
          // SQLite ALTER TABLE ADD COLUMN 语法
          await db.exec(`ALTER TABLE salary_items ADD COLUMN is_preset INTEGER NOT NULL DEFAULT 0;`);
          console.log('is_preset 列添加成功');
        } catch (error) {
          console.error('添加 is_preset 列失败:', error);
          throw error; // 添加列失败是严重错误，中断迁移
        }
      } else {
        console.log('is_preset 列已存在，跳过添加');
      }

      console.log(`迁移 ${this.version} - ${this.name} 完成`);
    } catch (error) {
      console.error(`执行迁移 ${this.version} - ${this.name} 失败:`, error);
      throw error; // 抛出错误，让迁移管理器处理
    }
  }

  // down 方法用于回滚，这里可以留空或实现删除列的逻辑
  async down(): Promise<void> {
    console.log(`执行迁移回滚 ${this.version} - ${this.name}...`);
    const db = Database.getInstance().getConnection();
    try {
      // 注意：SQLite 不直接支持 ALTER TABLE DROP COLUMN，需要重建表
      // 为了简单起见，这里不实现回滚逻辑
      console.log('此迁移不支持自动回滚 is_preset 列的删除。');
    } catch (error) {
      console.error(`执行迁移回滚 ${this.version} - ${this.name} 失败:`, error);
      throw error;
    }
  }
}