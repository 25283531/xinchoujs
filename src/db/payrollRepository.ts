/**
 * 薪酬管理系统数据访问层
 * 提供员工、薪酬组、社保、考勤等数据的CRUD操作
 */

import { Database } from './database';
import { SalaryItem, SalaryGroup, SocialInsurance, TaxFormula, AttendanceException, RewardPunishment, PayrollResult } from '../services/payrollService';

export class PayrollRepository {
  private db: Database;
  
  constructor() {
    this.db = Database.getInstance();
  }
  
  /**
   * 获取员工信息
   * @param employeeId 员工ID
   * @returns 员工信息
   */
  async getEmployeeInfo(employeeId: number): Promise<any> {
    const conn = this.db.getConnection();
    try {
      const query = `
        SELECT e.*, d.name as department_name, p.name as position_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN positions p ON e.position_id = p.id
        WHERE e.id = ?
      `;
      
      return await conn.get(query, [employeeId]);
    } catch (error) {
      console.error('获取员工信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取员工列表
   * @param departmentId 部门ID，不传则获取所有员工
   * @returns 员工列表
   */
  async getEmployeeList(departmentId?: number): Promise<any[]> {
    const conn = this.db.getConnection();
    try {
      let query = `
        SELECT e.*, d.name as department_name, p.name as position_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN positions p ON e.position_id = p.id
      `;
      
      const params = [];
      if (departmentId) {
        query += ' WHERE e.department_id = ?';
        params.push(departmentId);
      }
      
      return await conn.all(query, params);
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取薪酬组信息
   * @param salaryGroupId 薪酬组ID
   * @returns 薪酬组信息
   */
  async getSalaryGroup(salaryGroupId: number): Promise<SalaryGroup> {
    const conn = this.db.getConnection();
    try {
      // 获取薪酬组基本信息
      const groupQuery = 'SELECT * FROM salary_groups WHERE id = ?';
      const group = await conn.get(groupQuery, [salaryGroupId]);
      
      if (!group) {
        throw new Error(`薪酬组不存在: ${salaryGroupId}`);
      }
      
      // 获取薪酬组项目
      const itemsQuery = 'SELECT * FROM salary_group_items WHERE salary_group_id = ? ORDER BY calculation_order';
      const items = await conn.all(itemsQuery, [salaryGroupId]);
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        items: items.map((item: { salary_item_id: number; calculation_order: number }) => ({
          salaryItemId: item.salary_item_id,
          calculationOrder: item.calculation_order
        }))
      };
    } catch (error) {
      console.error('获取薪酬组信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取薪酬项列表
   * @param salaryItemIds 薪酬项ID列表
   * @returns 薪酬项列表
   */
  async getSalaryItems(salaryItemIds: number[]): Promise<SalaryItem[]> {
    if (salaryItemIds.length === 0) {
      return [];
    }
    
    const conn = this.db.getConnection();
    try {
      const placeholders = salaryItemIds.map(() => '?').join(',');
      const query = `SELECT * FROM salary_items WHERE id IN (${placeholders})`;
      
      const items = await conn.all(query, salaryItemIds);
      
      return items.map((item: { id: number; name: string; type: 'fixed' | 'percentage' | 'formula' | string; value: number; description?: string }) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'fixed' | 'percentage' | 'formula',
        value: item.value,
        description: item.description
      }));
    } catch (error) {
      console.error('获取薪酬项列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取社保组信息
   * @param socialInsuranceGroupId 社保组ID
   * @returns 社保组信息
   */
  async getSocialInsuranceGroup(socialInsuranceGroupId: number): Promise<SocialInsurance | null> {
    const conn = this.db.getConnection();
    try {
      const query = 'SELECT * FROM social_insurance_groups WHERE id = ?';
      const group = await conn.get(query, [socialInsuranceGroupId]);
      
      if (!group) {
        return null;
      }
      
      return {
        id: group.id,
        name: group.name,
        pensionPersonal: group.pension_personal,
        pensionCompany: group.pension_company,
        medicalPersonal: group.medical_personal,
        medicalCompany: group.medical_company,
        unemploymentPersonal: group.unemployment_personal,
        unemploymentCompany: group.unemployment_company,
        injuryCompany: group.injury_company,
        maternityCompany: group.maternity_company,
        housingPersonal: group.housing_personal,
        housingCompany: group.housing_company
      };
    } catch (error) {
      console.error('获取社保组信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取考勤异常记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 考勤异常记录
   */
  async getAttendanceRecords(employeeId: number, yearMonth: string): Promise<AttendanceException[]> {
    const conn = this.db.getConnection();
    try {
      // 构建日期范围
      const startDate = `${yearMonth}-01`;
      const endDate = this.getLastDayOfMonth(yearMonth);
      
      const query = `
        SELECT * FROM attendance_exceptions 
        WHERE employee_id = ? AND record_date BETWEEN ? AND ?
      `;
      
      const records = await conn.all(query, [employeeId, startDate, endDate]);
      
      return records.map((record: { id: number; employee_id: number; record_date: string; type: 'reward' | 'punishment'; amount: number; reason?: string }) => ({
        id: record.id,
        employeeId: record.employee_id,
        recordDate: record.record_date,
        type: record.type,
        amount: record.amount,
        reason: record.reason
      }));
    } catch (error) {
      console.error('获取考勤异常记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取考勤异常设置
   * @returns 考勤异常设置
   */
  async getAttendanceExceptionSettings(): Promise<any[]> {
    const conn = this.db.getConnection();
    try {
      const query = 'SELECT * FROM attendance_exception_types';
      return await conn.all(query);
    } catch (error) {
      console.error('获取考勤异常设置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取奖惩记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 奖惩记录
   */
  async getRewardPunishmentRecords(employeeId: number, yearMonth: string): Promise<RewardPunishment[]> {
    const conn = this.db.getConnection();
    try {
      // 构建日期范围
      const startDate = `${yearMonth}-01`;
      const endDate = this.getLastDayOfMonth(yearMonth);
      
      const query = `
        SELECT * FROM reward_punishments 
        WHERE employee_id = ? AND record_date BETWEEN ? AND ?
      `;
      
      const records = await conn.all(query, [employeeId, startDate, endDate]);
      
      return records.map((record: { id: number; employee_id: number; record_date: string; type: 'reward' | 'punishment'; amount: number; reason?: string }) => ({
        id: record.id,
        employeeId: record.employee_id,
        recordDate: record.record_date,
        type: record.type as 'reward' | 'punishment',
        amount: record.amount,
        reason: record.reason
      }));
    } catch (error) {
      console.error('获取奖惩记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取个税公式
   * @param id 个税公式ID
   * @returns 个税公式
   */
  async getTaxFormula(id: number): Promise<TaxFormula | null> {
    const conn = this.db.getConnection();
    try {
      // 获取公式基本信息
      const formulaQuery = 'SELECT * FROM tax_formulas WHERE id = ?';
      const formula = await conn.get(formulaQuery, [id]);
      
      if (!formula) {
        return null;
      }
      
      // 获取公式级数
      const levelsQuery = 'SELECT * FROM tax_formula_levels WHERE formula_id = ? ORDER BY threshold';
      const levels = await conn.all(levelsQuery, [id]);
      
      return {
        id: formula.id,
        name: formula.name,
        isDefault: formula.is_default === 1,
        formula: levels.map((level: { threshold: number; rate: number; quick_deduction: number }) => ({
          threshold: level.threshold,
          rate: level.rate,
          quickDeduction: level.quick_deduction
        }))
      };
    } catch (error) {
      console.error('获取个税公式失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取默认个税公式
   * @returns 默认个税公式
   */
  async getDefaultTaxFormula(): Promise<TaxFormula | null> {
    const conn = this.db.getConnection();
    try {
      // 获取默认公式ID
      const defaultFormulaQuery = 'SELECT id FROM tax_formulas WHERE is_default = 1 LIMIT 1';
      const defaultFormula = await conn.get(defaultFormulaQuery);
      
      if (!defaultFormula) {
        return null;
      }
      
      return this.getTaxFormula(defaultFormula.id);
    } catch (error) {
      console.error('获取默认个税公式失败:', error);
      throw error;
    }
  }
  
  /**
   * 保存工资记录
   * @param payrollResult 工资计算结果
   */
  async savePayrollRecord(payrollResult: PayrollResult): Promise<void> {
    const conn = this.db.getConnection();
    try {
      // 开始事务
      await conn.run('BEGIN TRANSACTION');
      
      try {
        // 保存主记录
        const mainQuery = `
          INSERT INTO payroll_records (
            employee_id, year_month, base_salary, total_salary, 
            social_insurance, tax, attendance_deduction, reward_punishment, 
            net_salary, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(employee_id, year_month) DO UPDATE SET
            base_salary = excluded.base_salary,
            total_salary = excluded.total_salary,
            social_insurance = excluded.social_insurance,
            tax = excluded.tax,
            attendance_deduction = excluded.attendance_deduction,
            reward_punishment = excluded.reward_punishment,
            net_salary = excluded.net_salary,
            status = excluded.status,
            updated_at = datetime('now')
        `;
        
        const result = await conn.run(mainQuery, [
          payrollResult.employeeId,
          payrollResult.yearMonth,
          payrollResult.baseSalary,
          payrollResult.totalSalary,
          payrollResult.socialInsurance,
          payrollResult.tax,
          payrollResult.attendanceDeduction,
          payrollResult.rewardPunishment,
          payrollResult.netSalary,
          payrollResult.status
        ]);
        
        // 获取记录ID
        let recordId: number;
        if (result.lastID) {
          recordId = result.lastID;
        } else {
          const idQuery = 'SELECT id FROM payroll_records WHERE employee_id = ? AND year_month = ?';
          const record = await conn.get(idQuery, [payrollResult.employeeId, payrollResult.yearMonth]);
          recordId = record.id;
        }
        
        // 删除旧的明细记录
        await conn.run('DELETE FROM payroll_details WHERE payroll_id = ?', [recordId]);
        
        // 保存明细记录
        const detailQuery = `
          INSERT INTO payroll_details (payroll_id, item_name, item_value)
          VALUES (?, ?, ?)
        `;
        
        for (const [itemName, itemValue] of Object.entries(payrollResult.details)) {
          await conn.run(detailQuery, [recordId, itemName, itemValue]);
        }
        
        // 提交事务
        await conn.run('COMMIT');
      } catch (error) {
        // 回滚事务
        await conn.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('保存工资记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除工资记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   */
  async deletePayrollRecord(employeeId: number, yearMonth: string): Promise<void> {
    const conn = this.db.getConnection();
    try {
      // 开始事务
      await conn.run('BEGIN TRANSACTION');
      
      try {
        // 查询记录ID
        const idQuery = 'SELECT id FROM payroll_records WHERE employee_id = ? AND year_month = ?';
        const record = await conn.get(idQuery, [employeeId, yearMonth]);
        
        if (record) {
          // 删除明细记录
          await conn.run('DELETE FROM payroll_details WHERE payroll_id = ?', [record.id]);
          
          // 删除主记录
          await conn.run('DELETE FROM payroll_records WHERE id = ?', [record.id]);
        }
        
        // 提交事务
        await conn.run('COMMIT');
      } catch (error) {
        // 回滚事务
        await conn.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('删除工资记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取员工工龄
   * @param employeeId 员工ID
   * @returns 工龄（年）
   */
  async getEmployeeWorkYears(employeeId: number): Promise<number> {
    const conn = this.db.getConnection();
    try {
      const query = `
        SELECT entry_date FROM employees WHERE id = ?
      `;
      
      const employee = await conn.get(query, [employeeId]);
      
      if (!employee || !employee.entry_date) {
        return 0;
      }
      
      const entryDate = new Date(employee.entry_date);
      const now = new Date();
      
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      
      return Math.floor(diffYears);
    } catch (error) {
      console.error('获取员工工龄失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取月份的最后一天
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 最后一天的日期字符串，格式：YYYY-MM-DD
   */
  private getLastDayOfMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
  }
}