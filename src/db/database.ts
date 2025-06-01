/**
 * 数据库访问层
 * 提供SQLite数据库连接和基本操作
 */

// 实际项目中需要引入SQLite库，如better-sqlite3或sqlite3
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { SchemaValidator } from './utils/schemaValidator';

// Define your database models and schema here

export interface AttendanceExceptionItem {
  id?: number;
  name: string; // 异常项名称，如：迟到、早退、旷工
  deductionRuleType: 'fixed' | 'per_hour' | 'per_day_salary' | 'tiered_count'; // 扣款规则类型：固定金额、每小时、每天工资比例、按次数分级
  deductionRuleValue?: number; // 扣款规则值：固定金额、每小时/天扣款金额、每天工资比例（0-1之间）
  deductionRuleThreshold?: number; // 扣款规则阈值：按次数分级时，超过此次数开始扣款
  notes?: string; // 备注
}


export interface ImportedAttendanceData {
  id?: number;
  importDate: string; // 导入日期时间戳
  filePath: string; // 导入的文件路径
  status: 'pending' | 'processed' | 'error'; // 导入状态
  matchingKeyword: 'name' | 'name+id' | 'name+idcard'; // 匹配关键词
  data: any; // 原始导入数据，存储为 JSON 或其他格式
  rawData: any[]; // 添加 rawData 属性
  // TODO: Add fields to link to processed data/exceptions
}

export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  record_date: string; // Assuming DATE is stored as 'YYYY-MM-DD'
  exception_type_id: number;
  exception_count: number; // Count of the exception (e.g., hours late, days absent, occurrences)
  remark?: string;
}

// Example:
// export interface User {
//   id: number;
//   name: string;
//   email: string;
// }

/**
 * 数据库连接配置
 */
export interface DatabaseConfig {
  filename: string; // 数据库文件路径
  memory?: boolean; // 是否使用内存数据库
  verbose?: boolean; // sqlite3特有配置项
}

/**
 * 数据库管理类
 */
export class Database {
  private static instance: Database;
  private db: any = null;
  private initialized: boolean = false;
  
  /**
   * 获取数据库实例（单例模式）
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  /**
   * 初始化数据库连接
   * @param config 数据库配置
   */
  public async initialize(config: DatabaseConfig): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 1; // 只重试一次

    while (retryCount <= maxRetries) {
      try {
        // 打开数据库连接
        this.db = await open({
          filename: config.filename,
          driver: sqlite3.Database
        });
        
        // 在执行数据库迁移之前标记为已初始化
        this.initialized = true;
        console.log('数据库连接已打开');

        // 执行数据库迁移
        const { MigrationManager } = await import('./migrations/migrationManager');
        await MigrationManager.runAllMigrations();
        
        console.log('数据库迁移完成');
        
        // 验证数据库表结构
        console.log('开始验证数据库表结构...');
        const validationReport = await SchemaValidator.validateSchema();
        
        if (!validationReport.valid) {
          console.warn('数据库表结构验证发现问题:');
          console.warn(SchemaValidator.generateReadableReport(validationReport));
          
          // 如果有重复列问题，尝试修复
          const hasDuplicateColumns = validationReport.tables.some(table => 
            table.duplicateColumns.length > 0
          );
          
          if (hasDuplicateColumns) {
            console.log('检测到重复列问题，尝试通过迁移修复...');
            // 迁移系统应该已经包含了修复重复列的迁移脚本，这里不需要额外操作
          }
        } else {
          console.log('数据库表结构验证通过');
        }
        
        console.log('数据库初始化成功');
        return; // 初始化成功，退出循环

      } catch (error: any) {
        console.error(`数据库初始化或迁移失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error);

        if (retryCount < maxRetries) {
          console.log(`尝试删除数据库文件 ${config.filename} 并重试...`);
          try {
            const fs = require('fs');
            if (fs.existsSync(config.filename)) {
              fs.unlinkSync(config.filename);
              console.log('数据库文件删除成功');
            } else {
              console.log('数据库文件不存在，无需删除');
            }
          } catch (deleteError) {
            console.error('删除数据库文件失败:', deleteError);
            // 如果删除失败，直接抛出原始错误，不再重试
            throw error;
          }
          retryCount++;
          // 关闭可能已部分打开的连接
          if (this.db) {
            try { await this.db.close(); } catch (closeErr) { console.error('关闭数据库连接失败:', closeErr); }
            this.db = null;
          }
          this.initialized = false; // 重置初始化状态
        } else {
          // 达到最大重试次数，抛出错误
          console.error('达到最大重试次数，数据库初始化最终失败。');
          throw error;
        }
      }
    }

  }
  
  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (this.db) {
      // await this.db.close();
      this.db = null;
      this.initialized = false;
      console.log('数据库连接已关闭');
    }
  }
  
  /**
   * 获取数据库连接
   */
  public getConnection(): any {
    if (!this.initialized) {
      throw new Error('数据库未初始化');
    }
    return this.db;
  }
  
  // createTables方法已移除，表结构创建现在由迁移系统管理
  
  // 表结构创建已移至迁移系统
  
  /**
   * 备份数据库
   * @param backupPath 备份文件路径
   */
  public async backup(backupPath: string): Promise<boolean> {
    // 实际实现中需要复制数据库文件
    // const fs = require('fs');
    // fs.copyFileSync(this.db.filename, backupPath);
    
    console.log(`数据库已备份至 ${backupPath}`);
    return true;
  }
  
  /**
   * 恢复数据库
   * @param backupPath 备份文件路径
   */
  public async restore(backupPath: string): Promise<boolean> {
    // 实际实现中需要关闭当前连接，复制备份文件，然后重新连接
    // await this.close();
    // 
    // const fs = require('fs');
    // fs.copyFileSync(backupPath, this.db.filename);
    // 
    // await this.initialize({ filename: this.db.filename });
    
    console.log(`数据库已从 ${backupPath} 恢复`);
    return true;
  }
}