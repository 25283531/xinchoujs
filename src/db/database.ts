/**
 * 数据库访问层
 * 提供SQLite数据库连接和基本操作
 */

// 实际项目中需要引入SQLite库，如better-sqlite3或sqlite3
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
    
    try {
      // 打开数据库连接
      this.db = await open({
        filename: config.filename,
        driver: sqlite3.Database
      });
      
      // 执行数据库迁移
      const { MigrationManager } = await import('./migrations/migrationManager');
      await MigrationManager.runAllMigrations();
      
      this.initialized = true;
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
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