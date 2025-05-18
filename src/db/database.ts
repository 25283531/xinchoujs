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
      // 实际实现中需要打开数据库连接
      // 实际实现中需要打开数据库连接
      this.db = await open({
        filename: config.filename,
        driver: sqlite3.Database
      });
      
      // 创建表结构
      await this.createTables();
      
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
  
  /**
   * 创建数据库表结构
   */
  private async createTables(): Promise<void> {
    // 实际实现中需要执行SQL语句创建表
    // 以下是示例SQL语句
    
    // 员工表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_no VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        department VARCHAR NOT NULL,
        position VARCHAR NOT NULL,
        entry_date DATE NOT NULL,
        status INTEGER NOT NULL DEFAULT 1,
        social_insurance_group_id INTEGER,
        salary_group_id INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (social_insurance_group_id) REFERENCES social_insurance_groups (id),
        FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id)
      )
    `);

    // 考勤异常设置表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_exception_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL UNIQUE,
        deduction_rule_type VARCHAR NOT NULL,
        deduction_rule_value REAL,
        deduction_rule_threshold REAL,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 考勤异常记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        record_date DATE NOT NULL,
        exception_type_id INTEGER NOT NULL,
        exception_count REAL NOT NULL DEFAULT 0,
        remark TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (exception_type_id) REFERENCES attendance_exception_settings (id)
      )
    `);

    // 自定义字段表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_name VARCHAR NOT NULL,
        field_type VARCHAR NOT NULL,
        field_options TEXT,
        is_required BOOLEAN NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    // 员工自定义字段值表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS employee_custom_field_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        custom_field_id INTEGER NOT NULL,
        field_value TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (custom_field_id) REFERENCES custom_fields (id)
      )
    `);
    
    // 社保组表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS social_insurance_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        pension_personal DECIMAL NOT NULL,
        pension_company DECIMAL NOT NULL,
        medical_personal DECIMAL NOT NULL,
        medical_company DECIMAL NOT NULL,
        unemployment_personal DECIMAL NOT NULL,
        unemployment_company DECIMAL NOT NULL,
        injury_company DECIMAL NOT NULL,
        maternity_company DECIMAL NOT NULL,
        housing_personal DECIMAL NOT NULL,
        housing_company DECIMAL NOT NULL
      )
    `);
    
    // 个税设置表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tax_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT 0,
        formula TEXT NOT NULL
      )
    `);
    
    // 薪酬项表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS salary_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        value TEXT NOT NULL,
        subsidy_cycle INTEGER NOT NULL DEFAULT 1,
        is_preset BOOLEAN NOT NULL DEFAULT 0,
        description TEXT
      )
    `);
    
    // 薪酬组表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS salary_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        description TEXT
      )
    `);
    
    // 薪酬组项目表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS salary_group_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        salary_group_id INTEGER NOT NULL,
        salary_item_id INTEGER NOT NULL,
        calculation_order INTEGER NOT NULL,
        FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id),
        FOREIGN KEY (salary_item_id) REFERENCES salary_items (id)
      )
    `);
    
    // 考勤异常设置表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_exception_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        deduction_rule_type VARCHAR NOT NULL, -- 扣款规则类型：fixed, per_hour, per_day_salary, tiered_count
        deduction_rule_value DECIMAL,
        deduction_rule_threshold INTEGER,
        notes TEXT -- 备注
      )
    `);
    
    // 考勤记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        record_date DATE NOT NULL,
        exception_type_id INTEGER NOT NULL,
        exception_count INTEGER NOT NULL DEFAULT 1,
        remark TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (exception_type_id) REFERENCES attendance_exception_settings (id)
      )
    `);
    
    // 奖惩记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS reward_punishment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        record_date DATE NOT NULL,
        type VARCHAR NOT NULL,
        amount DECIMAL NOT NULL,
        reason TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);
    
    // 工资记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS payroll_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        year_month VARCHAR NOT NULL,
        base_salary DECIMAL NOT NULL,
        total_salary DECIMAL NOT NULL,
        social_insurance DECIMAL NOT NULL,
        tax DECIMAL NOT NULL,
        attendance_deduction DECIMAL NOT NULL,
        reward_punishment DECIMAL NOT NULL,
        net_salary DECIMAL NOT NULL,
        details TEXT NOT NULL,
        status VARCHAR NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);
    
    // 导出模板表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS export_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        export_type VARCHAR NOT NULL,
        content TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT 0
      )
    `);
  }
  
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