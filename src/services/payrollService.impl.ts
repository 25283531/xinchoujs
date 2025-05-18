/**
 * 工资计算核心服务实现类
 * 使用数据库存储和查询数据，实现薪酬计算的核心逻辑
 */

import { PayrollService, SalaryItem, SalaryGroup, SocialInsurance, TaxFormula, AttendanceException, RewardPunishment, PayrollResult } from './payrollService';
import { PayrollRepository } from '../db/payrollRepository';
import { AttendanceService, AttendanceServiceImpl } from './attendanceService';
import { Database } from '../db/database';
import { AttendanceRepositoryImpl } from '../db/attendanceRepository';

export class PayrollServiceImpl extends PayrollService {
  private repository: PayrollRepository;
  private attendanceService: AttendanceService;

  constructor() {
    super();
    this.repository = new PayrollRepository();
    // Initialize AttendanceService with necessary dependencies
    const db = Database.getInstance().getConnection(); // Assuming Database is initialized elsewhere
    const attendanceRepository = new AttendanceRepositoryImpl(db);
    this.attendanceService = new AttendanceServiceImpl(attendanceRepository);
  }
  
  /**
   * 获取员工列表
   * @param departmentId 部门ID，不传则获取所有员工
   * @returns 员工列表
   */
  protected async getEmployeeList(departmentId?: number): Promise<any[]> {
    return this.repository.getEmployeeList(departmentId);
  }
  
  /**
   * 获取员工信息
   * @param employeeId 员工ID
   * @returns 员工信息
   */
  protected async getEmployeeInfo(employeeId: number): Promise<any> {
    return this.repository.getEmployeeInfo(employeeId);
  }
  
  /**
   * 获取薪酬组信息
   * @param salaryGroupId 薪酬组ID
   * @returns 薪酬组信息
   */
  protected async getSalaryGroup(salaryGroupId: number): Promise<SalaryGroup> {
    return this.repository.getSalaryGroup(salaryGroupId);
  }
  
  /**
   * 获取薪酬项列表
   * @param salaryGroup 薪酬组
   * @returns 薪酬项列表（按计算顺序排序）
   */
  protected async getSalaryItems(salaryGroup: SalaryGroup): Promise<SalaryItem[]> {
    // 获取薪酬项ID列表
    const salaryItemIds = salaryGroup.items.map(item => item.salaryItemId);
    
    // 获取薪酬项详情
    const items = await this.repository.getSalaryItems(salaryItemIds);
    
    // 按照薪酬组中的计算顺序排序
    const orderedItems: SalaryItem[] = [];
    for (const groupItem of salaryGroup.items) {
      const salaryItem = items.find(item => item.id === groupItem.salaryItemId);
      if (salaryItem) {
        orderedItems.push(salaryItem);
      }
    }
    
    return orderedItems;
  }
  
  /**
   * 删除工资记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   */
  protected async deletePayrollRecord(employeeId: number, yearMonth: string): Promise<void> {
    return this.repository.deletePayrollRecord(employeeId, yearMonth);
  }
  
  /**
   * 保存工资记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @param payrollResult 工资计算结果
   */
  protected async savePayrollRecord(employeeId: number, yearMonth: string, payrollResult: PayrollResult): Promise<void> {
    return this.repository.savePayrollRecord(payrollResult);
  }
  
  /**
   * 获取员工考勤异常次数
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 考勤异常次数
   */
  protected async getAttendanceExceptionCount(employeeId: number, yearMonth: string): Promise<number> {
    const records = await this.getAttendanceRecords(employeeId, yearMonth);
    return records.length;
  }
  
  /**
   * 获取员工工龄
   * @param employeeId 员工ID
   * @returns 工龄（年）
   */
  protected async getEmployeeWorkYears(employeeId: number): Promise<number> {
    return this.repository.getEmployeeWorkYears(employeeId);
  }
  
  /**
   * 获取员工适用的个税公式
   * @param employeeId 员工ID
   * @returns 个税公式
   */
  protected async getTaxFormula(employeeId: number): Promise<TaxFormula | null> {
    // 实际实现中可能需要根据员工所在地区或其他因素获取适用的个税公式
    // 这里简化为直接获取默认公式
    return this.repository.getDefaultTaxFormula();
  }
  
  /**
   * 获取员工社保组
   * @param socialInsuranceGroupId 社保组ID
   * @returns 社保组信息
   */
  protected async getSocialInsuranceGroup(socialInsuranceGroupId: number): Promise<SocialInsurance | null> {
    return this.repository.getSocialInsuranceGroup(socialInsuranceGroupId);
  }
  
  /**
   * 获取考勤记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 考勤异常记录
   */
  protected async getAttendanceRecords(employeeId: number, yearMonth: string): Promise<AttendanceException[]> {
    return this.repository.getAttendanceRecords(employeeId, yearMonth);
  }
  
  /**
   * 获取考勤异常设置
   * @returns 考勤异常设置
   */
  protected async getAttendanceExceptionSettings(): Promise<any[]> {
    return this.repository.getAttendanceExceptionSettings();
  }
  
  /**
   * 获取奖惩记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 奖惩记录
   */
  protected async getRewardPunishmentRecords(employeeId: number, yearMonth: string): Promise<RewardPunishment[]> {
    return this.repository.getRewardPunishmentRecords(employeeId, yearMonth);
  }

  /**
   * 计算单个员工的工资
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 工资计算结果
   */
  async calculateEmployeeSalary(employeeId: number, yearMonth: string): Promise<PayrollResult> {
    // 实际实现中需要从数据库获取员工信息、薪酬组、社保组、考勤记录等数据
    // 这里仅提供基本框架
    
    // 1. 获取员工基本信息和薪酬组
    const employee = await this.getEmployeeInfo(employeeId);
    const salaryGroup = await this.getSalaryGroup(employee.salaryGroupId);
    const salaryItems = await this.getSalaryItems(salaryGroup);
    
    // 2. 计算薪酬项
    const salaryDetails = await this.calculateSalaryItems(employeeId, salaryItems, yearMonth);
    
    // 3. 计算社保和公积金
    const socialInsurance = await this.calculateSocialInsurance(employeeId, salaryDetails.totalSalary);
    // TODO: 从数据库获取并计算公积金个人缴纳部分
    const housingFundPersonal = 0; // 待实现
    
    // TODO: 从数据库获取员工专项附加扣除总额
    const specialAdditionalDeductions = 0; // 待实现
    
    // 4. 计算考勤扣款
    const attendanceDeduction = await this.attendanceService.calculateDeductions(employeeId, yearMonth);

    // 5. 计算奖惩金额
    const rewardPunishment = await this.calculateRewardPunishment(employeeId, yearMonth);
    
    // 6. 计算个税
    // 应纳税所得额（扣除社保、公积金后，扣除起征点和专项附加扣除前）
    const taxableIncomeBeforeDeductions = salaryDetails.totalSalary - socialInsurance - housingFundPersonal;
    const taxFormula = await this.getTaxFormula(employeeId); // 获取适用的个税公式
    // 调用基类的 calculateTax 方法进行计算
    const tax = await super.calculateTax(taxableIncomeBeforeDeductions, taxFormula || PayrollService.DEFAULT_TAX_FORMULA, specialAdditionalDeductions);
    
    // 7. 计算实发工资
    const netSalary = salaryDetails.totalSalary - socialInsurance - housingFundPersonal - tax - attendanceDeduction + rewardPunishment;
    
    // 8. 保存工资记录
    await this.savePayrollRecord(employeeId, yearMonth, {
      employeeId,
      yearMonth,
      baseSalary: salaryDetails.baseSalary,
      totalSalary: salaryDetails.totalSalary,
      socialInsurance,
      tax,
      attendanceDeduction,
      rewardPunishment,
      netSalary,
      details: salaryDetails.details,
      status: 'calculated'
    });
    
    return {
      employeeId,
      yearMonth,
      baseSalary: salaryDetails.baseSalary,
      totalSalary: salaryDetails.totalSalary,
      socialInsurance,
      tax,
      attendanceDeduction,
      rewardPunishment,
      netSalary,
      details: salaryDetails.details,
      status: 'calculated'
    };
  }
}