/**
 * 考勤异常设置表迁移脚本
 * 添加缺失的列到attendance_exception_settings表
 */

import { Database } from '../database';

export async function migrateAttendanceExceptionSettings(): Promise<void> {
  console.log('开始执行考勤异常设置表迁移...');
  
  try {
    const db = Database.getInstance().getConnection();
    
    // 检查表是否存在
    try {
      await db.get(`SELECT 1 FROM attendance_exception_settings LIMIT 1`);
    } catch (error) {
      console.log('考勤异常设置表不存在，将在表创建后再执行迁移');
      return; // 表不存在，退出迁移
    }
    
    // 获取表结构信息
    const tableInfo = await db.all(`PRAGMA table_info(attendance_exception_settings)`);
    console.log('当前表结构:', tableInfo.map((col: any) => col.name).join(', '));
    
    // 检查并添加 deduction_rule_type 列
    if (!tableInfo.some((column: any) => column.name === 'deduction_rule_type')) {
      try {
        console.log('添加 deduction_rule_type 列...');
        await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_type VARCHAR;`);
      } catch (error) {
        console.error('添加 deduction_rule_type 列失败:', error);
        // 继续执行，不中断整个迁移过程
      }
    }
    
    // 检查并添加 deduction_rule_value 列
    if (!tableInfo.some((column: any) => column.name === 'deduction_rule_value')) {
      try {
        console.log('添加 deduction_rule_value 列...');
        await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_value REAL;`);
      } catch (error) {
        console.error('添加 deduction_rule_value 列失败:', error);
        // 继续执行，不中断整个迁移过程
      }
    }
    
    // 检查并添加 deduction_rule_threshold 列
    if (!tableInfo.some((column: any) => column.name === 'deduction_rule_threshold')) {
      try {
        console.log('添加 deduction_rule_threshold 列...');
        await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN deduction_rule_threshold REAL;`);
      } catch (error) {
        console.error('添加 deduction_rule_threshold 列失败:', error);
        // 继续执行，不中断整个迁移过程
      }
    }
    
    // 检查并添加 notes 列
    if (!tableInfo.some((column: any) => column.name === 'notes')) {
      try {
        console.log('添加 notes 列...');
        await db.exec(`ALTER TABLE attendance_exception_settings ADD COLUMN notes TEXT;`);
      } catch (error) {
        console.error('添加 notes 列失败:', error);
        // 继续执行，不中断整个迁移过程
      }
    }
    
    // 更新现有记录，设置默认值
    try {
      console.log('更新现有记录，设置默认值...');
      await db.exec(`
        UPDATE attendance_exception_settings 
        SET deduction_rule_type = 'fixed',
            deduction_rule_value = 0
        WHERE deduction_rule_type IS NULL;
      `);
    } catch (error) {
      console.error('更新默认值失败:', error);
      // 继续执行，不中断整个迁移过程
    }
    
    console.log('考勤异常设置表迁移完成');
  } catch (error) {
    console.error('考勤异常设置表迁移失败:', error);
    // 不抛出异常，让应用程序继续运行
    console.log('尽管迁移失败，应用程序将继续运行');
  }
}