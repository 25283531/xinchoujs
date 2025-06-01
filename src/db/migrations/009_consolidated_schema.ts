/**
 * 合并数据库表结构迁移脚本
 * 提供所有表的完整定义，简化迁移系统
 */

import { BaseMigration } from './migration';

export class ConsolidatedSchema extends BaseMigration {
  version = 2025052003; // 版本号比之前的所有迁移都大，确保最后执行
  name = 'Consolidated database schema';
  
  /**
   * 执行迁移 - 确保所有表结构符合预期
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始验证并确保数据库表结构完整...');
    
    try {
      // 验证employees表结构
      await this.ensureEmployeesTable();
      
      // 验证departments表结构
      await this.ensureDepartmentsTable();
      
      // 验证positions表结构
      await this.ensurePositionsTable();
      
      // 验证attendance_exception_settings表结构
      await this.ensureAttendanceExceptionSettingsTable();
      
      // 验证attendance_records表结构
      await this.ensureAttendanceRecordsTable();
      
      // 验证custom_fields表结构
      await this.ensureCustomFieldsTable();
      
      // 验证employee_custom_field_values表结构
      await this.ensureEmployeeCustomFieldValuesTable();
      
      // 验证salary_groups表结构
      await this.ensureSalaryGroupsTable();
      
      // 验证salary_items表结构
      await this.ensureSalaryItemsTable();
      
      // 验证social_insurance_groups表结构
      await this.ensureSocialInsuranceGroupsTable();
      
      this.log('数据库表结构验证完成');
    } catch (error) {
      this.logError('验证数据库表结构失败', error);
      throw error;
    }
  }
  
  /**
   * 确保employees表结构正确
   */
  private async ensureEmployeesTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证employees表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('employees');
    
    if (!tableExists) {
      this.log('employees表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_no VARCHAR NOT NULL UNIQUE,
          name VARCHAR NOT NULL,
          department INTEGER NOT NULL,
          position INTEGER NOT NULL,
          entry_date DATE NOT NULL,
          status INTEGER NOT NULL DEFAULT 1,
          social_insurance_group_id INTEGER,
          salary_group_id INTEGER,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gender TEXT DEFAULT 'male',
          base_salary REAL DEFAULT 0,
          birth_date DATE,
          id_card TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          leave_date DATE,
          remark TEXT,
          FOREIGN KEY (social_insurance_group_id) REFERENCES social_insurance_groups (id),
          FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id)
        )
      `);
      
      this.log('employees表创建成功');
      return;
    }
    
    // 检查表结构是否有重复列
    const columns = await this.getTableColumns('employees');
    const nameMap = new Map<string, any[]>();
    
    columns.forEach(column => {
      const name = column.name.toLowerCase();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(column);
    });
    
    let hasDuplicateColumns = false;
    
    // 使用传统循环替代Map.entries()迭代
    const mapKeys = Array.from(nameMap.keys());
    for (let i = 0; i < mapKeys.length; i++) {
      const name = mapKeys[i];
      const columnsWithName = nameMap.get(name)!;
      if (columnsWithName.length > 1) {
        hasDuplicateColumns = true;
        this.log(`employees表中列名 '${name}' 重复出现 ${columnsWithName.length} 次`);
      }
    }
    
    if (hasDuplicateColumns) {
      this.log('employees表存在重复列，需要修复...');
      
      // 开始事务
      await db.exec('BEGIN TRANSACTION');
      
      try {
        // 创建临时表，不包含重复列
        this.log('创建临时表...');
        await db.exec(`
          CREATE TABLE employees_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_no VARCHAR NOT NULL UNIQUE,
            name VARCHAR NOT NULL,
            department INTEGER NOT NULL,
            position INTEGER NOT NULL,
            entry_date DATE NOT NULL,
            status INTEGER NOT NULL DEFAULT 1,
            social_insurance_group_id INTEGER,
            salary_group_id INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            gender TEXT DEFAULT 'male',
            base_salary REAL DEFAULT 0,
            birth_date DATE,
            id_card TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            leave_date DATE,
            remark TEXT,
            FOREIGN KEY (social_insurance_group_id) REFERENCES social_insurance_groups (id),
            FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id)
          )
        `);
        
        // 复制数据到临时表
        this.log('复制数据到临时表...');
        await db.exec(`
          INSERT INTO employees_temp (
            id, employee_no, name, department, position, entry_date, status,
            social_insurance_group_id, salary_group_id, created_at, updated_at,
            gender, base_salary, birth_date, id_card, phone, email, address,
            leave_date, remark
          )
          SELECT 
            id, employee_no, name, department, position, entry_date, status,
            social_insurance_group_id, salary_group_id, created_at, updated_at,
            gender, base_salary, birth_date, id_card, phone, email, address,
            leave_date, remark
          FROM employees
        `);
        
        // 删除原表
        this.log('删除原表...');
        await db.exec('DROP TABLE employees');
        
        // 重命名临时表
        this.log('重命名临时表...');
        await db.exec('ALTER TABLE employees_temp RENAME TO employees');
        
        // 提交事务
        await db.exec('COMMIT');
        
        this.log('employees表重复列修复完成！');
      } catch (error) {
        // 回滚事务
        await db.exec('ROLLBACK');
        this.logError('修复过程中出错', error);
        throw error;
      }
    } else {
      this.log('employees表结构正常，无需修复');
    }
  }
  
  /**
   * 确保departments表结构正确
   */
  private async ensureDepartmentsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证departments表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('departments');
    
    if (!tableExists) {
      this.log('departments表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          parent_id INTEGER,
          description TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
        )
      `);
      
      // 添加默认部门数据
      await db.exec(`
        INSERT INTO departments (name, parent_id, description) VALUES
        ('技术部', NULL, '负责产品研发和技术支持'),
        ('市场部', NULL, '负责市场营销和品牌推广'),
        ('财务部', NULL, '负责财务管理和会计核算'),
        ('人力资源部', NULL, '负责人员招聘和培训')
      `);
      
      this.log('departments表创建成功，并添加了默认数据');
    } else {
      this.log('departments表已存在，无需创建');
    }
  }
  
  /**
   * 确保positions表结构正确
   */
  private async ensurePositionsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证positions表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('positions');
    
    if (!tableExists) {
      this.log('positions表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE positions (
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
      
      this.log('positions表创建成功，并添加了默认数据');
    } else {
      this.log('positions表已存在，无需创建');
    }
  }
  
  /**
   * 确保attendance_exception_settings表结构正确
   */
  private async ensureAttendanceExceptionSettingsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证attendance_exception_settings表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('attendance_exception_settings');
    
    if (!tableExists) {
      this.log('attendance_exception_settings表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE attendance_exception_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          deduction_rule_type VARCHAR,
          deduction_rule_value REAL,
          deduction_rule_threshold REAL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_preset BOOLEAN NOT NULL DEFAULT 0,
          is_enabled BOOLEAN NOT NULL DEFAULT 1,
          display_order INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      this.log('attendance_exception_settings表创建成功');
    } else {
      this.log('attendance_exception_settings表已存在，无需创建');
    }
  }
  
  /**
   * 确保attendance_records表结构正确
   */
  private async ensureAttendanceRecordsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证attendance_records表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('attendance_records');
    
    if (!tableExists) {
      this.log('attendance_records表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE attendance_records (
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
      
      this.log('attendance_records表创建成功');
    } else {
      this.log('attendance_records表已存在，无需创建');
    }
  }
  
  /**
   * 确保custom_fields表结构正确
   */
  private async ensureCustomFieldsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证custom_fields表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('custom_fields');
    
    if (!tableExists) {
      this.log('custom_fields表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE custom_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          field_name VARCHAR NOT NULL,
          field_type VARCHAR NOT NULL,
          field_options TEXT,
          is_required BOOLEAN NOT NULL DEFAULT 0,
          display_order INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      this.log('custom_fields表创建成功');
    } else {
      this.log('custom_fields表已存在，无需创建');
    }
  }
  
  /**
   * 确保employee_custom_field_values表结构正确
   */
  private async ensureEmployeeCustomFieldValuesTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证employee_custom_field_values表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('employee_custom_field_values');
    
    if (!tableExists) {
      this.log('employee_custom_field_values表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE employee_custom_field_values (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          custom_field_id INTEGER NOT NULL,
          field_value TEXT,
          FOREIGN KEY (employee_id) REFERENCES employees (id),
          FOREIGN KEY (custom_field_id) REFERENCES custom_fields (id)
        )
      `);
      
      this.log('employee_custom_field_values表创建成功');
    } else {
      this.log('employee_custom_field_values表已存在，无需创建');
    }
  }
  
  /**
   * 确保salary_groups表结构正确
   */
  private async ensureSalaryGroupsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证salary_groups表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('salary_groups');
    
    if (!tableExists) {
      this.log('salary_groups表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE salary_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          calculation_order INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      this.log('salary_groups表创建成功');
    } else {
      this.log('salary_groups表已存在，无需创建');
    }
  }
  
  /**
   * 确保salary_items表结构正确
   */
  private async ensureSalaryItemsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证salary_items表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('salary_items');
    
    if (!tableExists) {
      this.log('salary_items表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE salary_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL,
          group_id INTEGER NOT NULL,
          type VARCHAR NOT NULL,
          calculation_type VARCHAR NOT NULL,
          calculation_value TEXT,
          is_taxable BOOLEAN NOT NULL DEFAULT 1,
          is_enabled BOOLEAN NOT NULL DEFAULT 1,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          subsidy_cycle VARCHAR,
          is_preset BOOLEAN NOT NULL DEFAULT 0,
          FOREIGN KEY (group_id) REFERENCES salary_groups (id) ON DELETE CASCADE
        )
      `);
      
      this.log('salary_items表创建成功');
    } else {
      this.log('salary_items表已存在，无需创建');
    }
  }
  
  /**
   * 确保social_insurance_groups表结构正确
   */
  private async ensureSocialInsuranceGroupsTable(): Promise<void> {
    const db = this.getDb();
    
    this.log('验证social_insurance_groups表结构...');
    
    // 检查表是否存在
    const tableExists = await this.checkTableExists('social_insurance_groups');
    
    if (!tableExists) {
      this.log('social_insurance_groups表不存在，创建表...');
      
      await db.exec(`
        CREATE TABLE social_insurance_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR NOT NULL UNIQUE,
          description TEXT,
          pension_base REAL NOT NULL DEFAULT 0,
          pension_company_ratio REAL NOT NULL DEFAULT 0,
          pension_personal_ratio REAL NOT NULL DEFAULT 0,
          medical_base REAL NOT NULL DEFAULT 0,
          medical_company_ratio REAL NOT NULL DEFAULT 0,
          medical_personal_ratio REAL NOT NULL DEFAULT 0,
          unemployment_base REAL NOT NULL DEFAULT 0,
          unemployment_company_ratio REAL NOT NULL DEFAULT 0,
          unemployment_personal_ratio REAL NOT NULL DEFAULT 0,
          injury_base REAL NOT NULL DEFAULT 0,
          injury_company_ratio REAL NOT NULL DEFAULT 0,
          maternity_base REAL NOT NULL DEFAULT 0,
          maternity_company_ratio REAL NOT NULL DEFAULT 0,
          housing_base REAL NOT NULL DEFAULT 0,
          housing_company_ratio REAL NOT NULL DEFAULT 0,
          housing_personal_ratio REAL NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      this.log('social_insurance_groups表创建成功');
    } else {
      this.log('social_insurance_groups表已存在，无需创建');
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
   * 获取表的列信息
   */
  private async getTableColumns(tableName: string): Promise<any[]> {
    const db = this.getDb();
    
    try {
      return await db.all(`PRAGMA table_info(${tableName})`);
    } catch (error) {
      this.logError(`获取表 ${tableName} 的列信息失败`, error);
      throw error;
    }
  }
  
  /**
   * 回滚迁移
   * 注意：此迁移不支持回滚，因为它是合并的表结构定义
   */
  async down(): Promise<void> {
    this.log('此迁移不支持回滚，因为它是合并的表结构定义');
    return Promise.resolve();
  }
}