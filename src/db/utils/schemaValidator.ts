/**
 * 数据库表结构验证工具
 * 用于检测数据库表结构问题并提供详细报告
 */

import { Database } from '../database';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface TableValidationResult {
  tableName: string;
  exists: boolean;
  duplicateColumns: { name: string, instances: ColumnInfo[] }[];
  missingColumns: string[];
  unexpectedColumns: string[];
}

interface ValidationReport {
  valid: boolean;
  tables: TableValidationResult[];
  errors: string[];
}

/**
 * 数据库表结构验证器
 */
export class SchemaValidator {
  /**
   * 验证数据库表结构
   * @returns 验证报告
   */
  public static async validateSchema(): Promise<ValidationReport> {
    const db = Database.getInstance().getConnection();
    const report: ValidationReport = {
      valid: true,
      tables: [],
      errors: []
    };
    
    try {
      // 验证employees表
      const employeesResult = await this.validateTable(db, 'employees', [
        'id', 'employee_no', 'name', 'department', 'position', 'entry_date', 'status',
        'social_insurance_group_id', 'salary_group_id', 'created_at', 'updated_at',
        'gender', 'base_salary', 'birth_date', 'id_card', 'phone', 'email', 'address',
        'leave_date', 'remark'
      ]);
      report.tables.push(employeesResult);
      
      // 验证departments表
      const departmentsResult = await this.validateTable(db, 'departments', [
        'id', 'name', 'parent_id', 'description', 'created_at', 'updated_at'
      ]);
      report.tables.push(departmentsResult);
      
      // 验证positions表
      const positionsResult = await this.validateTable(db, 'positions', [
        'id', 'name', 'department_id', 'description', 'created_at', 'updated_at'
      ]);
      report.tables.push(positionsResult);
      
      // 验证attendance_exception_settings表
      const attendanceExceptionSettingsResult = await this.validateTable(db, 'attendance_exception_settings', [
        'id', 'name', 'deduction_rule_type', 'deduction_rule_value', 'deduction_rule_threshold',
        'notes', 'created_at', 'is_preset', 'is_enabled', 'display_order'
      ]);
      report.tables.push(attendanceExceptionSettingsResult);
      
      // 验证attendance_records表
      const attendanceRecordsResult = await this.validateTable(db, 'attendance_records', [
        'id', 'employee_id', 'record_date', 'exception_type_id', 'exception_count',
        'remark', 'created_at'
      ]);
      report.tables.push(attendanceRecordsResult);
      
      // 验证custom_fields表
      const customFieldsResult = await this.validateTable(db, 'custom_fields', [
        'id', 'field_name', 'field_type', 'field_options', 'is_required', 'display_order'
      ]);
      report.tables.push(customFieldsResult);
      
      // 验证employee_custom_field_values表
      const employeeCustomFieldValuesResult = await this.validateTable(db, 'employee_custom_field_values', [
        'id', 'employee_id', 'custom_field_id', 'field_value'
      ]);
      report.tables.push(employeeCustomFieldValuesResult);
      
      // 验证salary_groups表
      const salaryGroupsResult = await this.validateTable(db, 'salary_groups', [
        'id', 'name', 'description', 'created_at', 'updated_at', 'calculation_order'
      ]);
      report.tables.push(salaryGroupsResult);
      
      // 验证salary_items表
      const salaryItemsResult = await this.validateTable(db, 'salary_items', [
        'id', 'name', 'group_id', 'type', 'calculation_type', 'calculation_value',
        'is_taxable', 'is_enabled', 'display_order', 'created_at', 'updated_at',
        'subsidy_cycle', 'is_preset'
      ]);
      report.tables.push(salaryItemsResult);
      
      // 验证social_insurance_groups表
      const socialInsuranceGroupsResult = await this.validateTable(db, 'social_insurance_groups', [
        'id', 'name', 'description', 'pension_base', 'pension_company_ratio', 'pension_personal_ratio',
        'medical_base', 'medical_company_ratio', 'medical_personal_ratio',
        'unemployment_base', 'unemployment_company_ratio', 'unemployment_personal_ratio',
        'injury_base', 'injury_company_ratio', 'maternity_base', 'maternity_company_ratio',
        'housing_base', 'housing_company_ratio', 'housing_personal_ratio',
        'created_at', 'updated_at'
      ]);
      report.tables.push(socialInsuranceGroupsResult);
      
      // 检查是否有任何表验证失败
      for (const tableResult of report.tables) {
        if (!tableResult.exists || 
            tableResult.duplicateColumns.length > 0 || 
            tableResult.missingColumns.length > 0) {
          report.valid = false;
          break;
        }
      }
    } catch (error: any) {
      report.valid = false;
      report.errors.push(`验证过程中发生错误: ${error.message}`);
    }
    
    return report;
  }
  
  /**
   * 验证单个表的结构
   * @param db 数据库连接
   * @param tableName 表名
   * @param expectedColumns 期望的列名列表
   * @returns 表验证结果
   */
  private static async validateTable(db: any, tableName: string, expectedColumns: string[]): Promise<TableValidationResult> {
    const result: TableValidationResult = {
      tableName,
      exists: false,
      duplicateColumns: [],
      missingColumns: [...expectedColumns],
      unexpectedColumns: []
    };
    
    try {
      // 检查表是否存在
      const tableExists = await this.checkTableExists(db, tableName);
      result.exists = tableExists;
      
      if (!tableExists) {
        return result;
      }
      
      // 获取表的列信息
      const columns = await this.getTableColumns(db, tableName);
      
      // 检查重复列
      const nameMap = new Map<string, ColumnInfo[]>();
      columns.forEach(column => {
        const name = column.name.toLowerCase();
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)!.push(column);
      });
      
      // 使用传统循环替代Map.entries()迭代
      const mapKeys = Array.from(nameMap.keys());
      for (let i = 0; i < mapKeys.length; i++) {
        const name = mapKeys[i];
        const columnsWithName = nameMap.get(name)!;
        if (columnsWithName.length > 1) {
          result.duplicateColumns.push({ name, instances: columnsWithName });
        }
      }
      
      // 检查缺失列和意外列
      const actualColumns = columns.map(col => col.name.toLowerCase());
      // 使用对象作为集合来获取唯一值，避免使用Set展开语法
      const uniqueColumnsObj: {[key: string]: boolean} = {};
      actualColumns.forEach(col => uniqueColumnsObj[col] = true);
      const uniqueActualColumns = Object.keys(uniqueColumnsObj);
      
      result.missingColumns = expectedColumns.filter(col => 
        !uniqueActualColumns.includes(col.toLowerCase())
      );
      
      result.unexpectedColumns = uniqueActualColumns.filter(col => 
        !expectedColumns.map(c => c.toLowerCase()).includes(col)
      );
    } catch (error: any) {
      console.error(`验证表 ${tableName} 时出错:`, error);
    }
    
    return result;
  }
  
  /**
   * 检查表是否存在
   * @param db 数据库连接
   * @param tableName 表名
   * @returns 表是否存在
   */
  private static async checkTableExists(db: any, tableName: string): Promise<boolean> {
    try {
      const result = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      
      return !!result;
    } catch (error) {
      console.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }
  
  /**
   * 获取表的列信息
   * @param db 数据库连接
   * @param tableName 表名
   * @returns 列信息数组
   */
  private static async getTableColumns(db: any, tableName: string): Promise<ColumnInfo[]> {
    try {
      return await db.all(`PRAGMA table_info(${tableName})`);
    } catch (error) {
      console.error(`获取表 ${tableName} 的列信息失败:`, error);
      throw error;
    }
  }
  
  /**
   * 生成验证报告的可读文本
   * @param report 验证报告
   * @returns 可读文本报告
   */
  public static generateReadableReport(report: ValidationReport): string {
    let output = '数据库表结构验证报告\n';
    output += '======================\n\n';
    
    if (report.errors.length > 0) {
      output += '错误:\n';
      report.errors.forEach(error => {
        output += `- ${error}\n`;
      });
      output += '\n';
    }
    
    output += `总体状态: ${report.valid ? '有效' : '无效'}\n\n`;
    
    report.tables.forEach(table => {
      output += `表: ${table.tableName}\n`;
      output += `  存在: ${table.exists ? '是' : '否'}\n`;
      
      if (!table.exists) {
        output += '  表不存在，无法进一步验证\n';
      } else {
        if (table.duplicateColumns.length > 0) {
          output += '  重复列:\n';
          table.duplicateColumns.forEach(dup => {
            output += `    - ${dup.name} (出现 ${dup.instances.length} 次)\n`;
          });
        } else {
          output += '  重复列: 无\n';
        }
        
        if (table.missingColumns.length > 0) {
          output += '  缺失列:\n';
          table.missingColumns.forEach(col => {
            output += `    - ${col}\n`;
          });
        } else {
          output += '  缺失列: 无\n';
        }
        
        if (table.unexpectedColumns.length > 0) {
          output += '  意外列:\n';
          table.unexpectedColumns.forEach(col => {
            output += `    - ${col}\n`;
          });
        } else {
          output += '  意外列: 无\n';
        }
      }
      
      output += '\n';
    });
    
    return output;
  }
}