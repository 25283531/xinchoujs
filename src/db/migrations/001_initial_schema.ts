/**
 * 初始数据库表结构迁移脚本
 * 创建系统所需的所有基础表结构
 */

import { BaseMigration } from './migration';

export class InitialSchemaMigration extends BaseMigration {
  version = 2023060100; // 版本号比考勤异常设置表迁移小，确保先执行
  name = 'Initial database schema';
  
  /**
   * 执行迁移 - 创建所有基础表结构
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始创建基础表结构...');
    
    try {
      // 员工表
      this.log('创建员工表...');
      await db.exec(`
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
      this.log('创建考勤异常设置表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS attendance_exception_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          deduction_rule_type VARCHAR,
          deduction_rule_value REAL,
          deduction_rule_threshold REAL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 考勤异常记录表
      this.log('创建考勤异常记录表...');
      await db.exec(`
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
      this.log('创建自定义字段表...');
      await db.exec(`
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
      this.log('创建员工自定义字段值表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS employee_custom_field_values (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          custom_field_id INTEGER NOT NULL,
          field_value TEXT,
          FOREIGN KEY (employee_id) REFERENCES employees (id),
          FOREIGN KEY (custom_field_id) REFERENCES custom_fields (id)
        )
      `);

      // 薪资组表
      this.log('创建薪资组表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS salary_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 薪资项目表
      this.log('创建薪资项目表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS salary_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR NOT NULL UNIQUE,
          name VARCHAR NOT NULL,
          description TEXT,
          type VARCHAR NOT NULL, -- 'base', 'bonus', 'deduction', 'tax', 'insurance', 'other'
          calculation_type VARCHAR NOT NULL, -- 'fixed', 'formula', 'percentage', 'attendance_based'
          calculation_value TEXT,
          is_taxable BOOLEAN NOT NULL DEFAULT 1,
          is_displayed BOOLEAN NOT NULL DEFAULT 1,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 薪资组项目关联表
      this.log('创建薪资组项目关联表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS salary_group_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          salary_group_id INTEGER NOT NULL,
          salary_item_id INTEGER NOT NULL,
          default_value REAL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id),
          FOREIGN KEY (salary_item_id) REFERENCES salary_items (id),
          UNIQUE(salary_group_id, salary_item_id)
        )
      `);

      // 社保组表
      this.log('创建社保组表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS social_insurance_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          description TEXT,
          pension_base REAL NOT NULL DEFAULT 0,
          medical_base REAL NOT NULL DEFAULT 0,
          unemployment_base REAL NOT NULL DEFAULT 0,
          injury_base REAL NOT NULL DEFAULT 0,
          maternity_base REAL NOT NULL DEFAULT 0,
          housing_fund_base REAL NOT NULL DEFAULT 0,
          pension_rate_company REAL NOT NULL DEFAULT 0,
          pension_rate_personal REAL NOT NULL DEFAULT 0,
          medical_rate_company REAL NOT NULL DEFAULT 0,
          medical_rate_personal REAL NOT NULL DEFAULT 0,
          unemployment_rate_company REAL NOT NULL DEFAULT 0,
          unemployment_rate_personal REAL NOT NULL DEFAULT 0,
          injury_rate_company REAL NOT NULL DEFAULT 0,
          maternity_rate_company REAL NOT NULL DEFAULT 0,
          housing_fund_rate_company REAL NOT NULL DEFAULT 0,
          housing_fund_rate_personal REAL NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 税收公式表
      this.log('创建税收公式表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS tax_formulas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL,
          formula_type VARCHAR NOT NULL, -- 'progressive', 'flat_rate'
          effective_date DATE NOT NULL,
          expiry_date DATE,
          is_default BOOLEAN NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 税收公式级别表
      this.log('创建税收公式级别表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS tax_formula_levels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tax_formula_id INTEGER NOT NULL,
          level_index INTEGER NOT NULL,
          min_amount REAL NOT NULL,
          max_amount REAL,
          rate REAL NOT NULL,
          quick_deduction REAL NOT NULL DEFAULT 0,
          FOREIGN KEY (tax_formula_id) REFERENCES tax_formulas (id)
        )
      `);

      // 薪资计算结果表
      this.log('创建薪资计算结果表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS payroll_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          year_month VARCHAR NOT NULL, -- 格式：YYYY-MM
          calculation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gross_salary REAL NOT NULL DEFAULT 0,
          net_salary REAL NOT NULL DEFAULT 0,
          tax_amount REAL NOT NULL DEFAULT 0,
          social_insurance_amount REAL NOT NULL DEFAULT 0,
          details TEXT, -- JSON格式存储详细计算结果
          status VARCHAR NOT NULL DEFAULT 'draft', -- 'draft', 'confirmed', 'paid'
          FOREIGN KEY (employee_id) REFERENCES employees (id),
          UNIQUE(employee_id, year_month)
        )
      `);

      // 导入的考勤数据表
      this.log('创建导入的考勤数据表...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS imported_attendance_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          import_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          file_path TEXT NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'error'
          matching_keyword VARCHAR NOT NULL, -- 'name', 'name+id', 'name+idcard'
          data TEXT -- JSON格式存储原始导入数据
        )
      `);
      
      this.log('基础表结构创建完成');
    } catch (error) {
      this.logError('创建基础表结构失败', error);
      throw error;
    }
  }
  
  /**
   * 回滚迁移 - 删除所有表
   * 注意：这是一个危险操作，实际应用中可能不需要实现
   */
  async down(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始回滚基础表结构...');
    
    try {
      // 按照外键依赖关系的反序删除表
      const tables = [
        'payroll_results',
        'tax_formula_levels',
        'tax_formulas',
        'imported_attendance_data',
        'salary_group_items',
        'salary_items',
        'salary_groups',
        'employee_custom_field_values',
        'custom_fields',
        'attendance_records',
        'attendance_exception_settings',
        'social_insurance_groups',
        'employees'
      ];
      
      for (const table of tables) {
        this.log(`删除表 ${table}...`);
        await db.exec(`DROP TABLE IF EXISTS ${table}`);
      }
      
      this.log('基础表结构回滚完成');
    } catch (error) {
      this.logError('回滚基础表结构失败', error);
      throw error;
    }
  }
}