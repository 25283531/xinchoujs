/**
 * 考勤异常设置表迁移脚本
 * 添加缺失的列到attendance_exception_settings表
 */

import { BaseMigration } from './migration';

export class AttendanceExceptionSettingsMigration extends BaseMigration {
  version = 2023060101; // 与原有迁移脚本保持一致的版本号
  name = 'Add columns to attendance_exception_settings';
  
  /**
   * 执行迁移 - 添加缺失的列到考勤异常设置表
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始执行考勤异常设置表迁移...');
    
    try {
      // 检查表是否存在
      try {
        await db.get(`SELECT 1 FROM attendance_exception_settings LIMIT 1`);
      } catch (error) {
        this.log('考勤异常设置表不存在，将在表创建后再执行迁移');
        return; // 表不存在，退出迁移
      }
      
      // 获取表结构信息
      const tableInfo = await db.all(`PRAGMA table_info(attendance_exception_settings)`);
      this.log('当前表结构: ' + tableInfo.map((col: any) => col.name).join(', '));
      
      // 检查并添加 deduction_rule_type 列
      if (!tableInfo.some((column: any) => column.name === 'deduction_rule_type')) {
        try {
          this.log('添加 deduction_rule_type 列...');
          await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_type VARCHAR;`);
        } catch (error) {
          this.logError('添加 deduction_rule_type 列失败', error);
          // 继续执行，不中断整个迁移过程
        }
      }
      
      // 检查并添加 deduction_rule_value 列
      if (!tableInfo.some((column: any) => column.name === 'deduction_rule_value')) {
        try {
          this.log('添加 deduction_rule_value 列...');
          await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_value REAL;`);
        } catch (error) {
          this.logError('添加 deduction_rule_value 列失败', error);
          // 继续执行，不中断整个迁移过程
        }
      }
      
      // 检查并添加 deduction_rule_threshold 列
      if (!tableInfo.some((column: any) => column.name === 'deduction_rule_threshold')) {
        try {
          this.log('添加 deduction_rule_threshold 列...');
          await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_threshold REAL;`);
        } catch (error) {
          this.logError('添加 deduction_rule_threshold 列失败', error);
          // 继续执行，不中断整个迁移过程
        }
      }
      
      // 检查并添加 notes 列
      if (!tableInfo.some((column: any) => column.name === 'notes')) {
        try {
          this.log('添加 notes 列...');
          await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN notes TEXT;`);
        } catch (error) {
          this.logError('添加 notes 列失败', error);
          // 继续执行，不中断整个迁移过程
        }
      }
      
      // 更新现有记录，设置默认值
      try {
        this.log('更新现有记录，设置默认值...');
        await db.exec(`
          UPDATE attendance_exception_settings 
          SET deduction_rule_type = 'fixed',
              deduction_rule_value = 0
          WHERE deduction_rule_type IS NULL;
        `);
      } catch (error) {
        this.logError('更新默认值失败', error);
        // 继续执行，不中断整个迁移过程
      }
      
      this.log('考勤异常设置表迁移完成');
    } catch (error) {
      this.logError('考勤异常设置表迁移失败', error);
      // 不抛出异常，让应用程序继续运行
      this.log('尽管迁移失败，应用程序将继续运行');
    }
  }
}