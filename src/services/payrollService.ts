/**
 * 工资计算核心服务
 * 负责薪酬计算的核心算法、处理薪酬项与薪酬组的计算逻辑、实现个税与社保的计算、处理考勤异常与扣款规则
 */

export interface SalaryItem {
  id: number;
  name: string;
  type: 'fixed' | 'percentage' | 'formula' | string;
  value: number | string;
  subsidyCycle: number; // 补贴周期，默认为1（每月），可设置为多月一次
  isPreset: boolean; // 是否为预置薪酬项
  description?: string;
  isDisplayed?: boolean; // 是否在界面上显示
}

export interface SalaryGroup {
  id: number;
  name: string;
  description?: string;
  items: Array<{
    salaryItemId: number;
    calculationOrder: number;
  }>;
}

export interface SocialInsurance {
  id: number;
  name: string;
  pensionPersonal: number;
  pensionCompany: number;
  medicalPersonal: number;
  medicalCompany: number;
  unemploymentPersonal: number;
  unemploymentCompany: number;
  injuryCompany: number;
  maternityCompany: number;
  housingPersonal: number;
  housingCompany: number;
}

export interface TaxFormula {
  id: number;
  name: string;
  isDefault: boolean;
  // 更新 formula 结构以匹配技术文档中的描述
  formula: {
    threshold: number; // 起征点
    deductions?: any[]; // 专项附加扣除列表，这里简化为any[]，实际应定义更详细的结构
    rates: Array<{
      level: number;
      upper: number; // 本级距上限（不含）
      rate: number;
      quick_deduction: number;
    }>;
  };
}

export interface AttendanceException {
  id: number;
  employeeId: number;
  recordDate: string;
  exceptionTypeId: number;
  exceptionCount: number;
  remark?: string;
}

export interface RewardPunishment {
  id: number;
  employeeId: number;
  recordDate: string;
  type: 'reward' | 'punishment';
  amount: number;
  reason: string;
}

export interface PayrollResult {
  employeeId: number;
  yearMonth: string;
  baseSalary: number;
  totalSalary: number;
  socialInsurance: number;
  tax: number;
  attendanceDeduction: number;
  rewardPunishment: number;
  netSalary: number;
  details: Record<string, number>;
  status: 'calculated' | 'pending';
}

export class PayrollService {
  // 个税起征点（元） - 现在从 TaxFormula 中获取
  // private static readonly TAX_THRESHOLD = 5000;
  
  // 默认个税速算公式（2019年起实行的7级累进税率） - 更新结构以匹配新的 TaxFormula 接口
  protected static readonly DEFAULT_TAX_FORMULA: TaxFormula = {
    id: 1,
    name: '个人所得税（2019年起）',
    isDefault: true,
    formula: {
      threshold: 5000, // 2019年起征点
      deductions: [], // 默认无专项附加扣除
      rates: [
        { level: 1, upper: 3000, rate: 0.03, quick_deduction: 0 },
        { level: 2, upper: 12000, rate: 0.1, quick_deduction: 210 },
        { level: 3, upper: 25000, rate: 0.2, quick_deduction: 1690 }, // 修正速算扣除数
        { level: 4, upper: 35000, rate: 0.25, quick_deduction: 4410 }, // 修正速算扣除数
        { level: 5, upper: 55000, rate: 0.3, quick_deduction: 7160 }, // 修正速算扣除数
        { level: 6, upper: 80000, rate: 0.35, quick_deduction: 15660 }, // 修正速算扣除数
        { level: 7, upper: Infinity, rate: 0.45, quick_deduction: 27260 } // 修正速算扣除数
      ]
    }
  };
  
  // 默认社保基数上下限（实际应从配置获取）
  protected static readonly SOCIAL_INSURANCE_BASE_MIN = 3000;
  protected static readonly SOCIAL_INSURANCE_BASE_MAX = 25000;
  
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
    // TODO: 获取并计算公积金个人缴纳部分
    const housingFundPersonal = 0; // 待实现
    
    // TODO: 获取员工专项附加扣除总额
    const specialAdditionalDeductions = 0; // 待实现
    
    // 4. 计算考勤扣款
    const attendanceDeduction = await this.calculateAttendanceDeduction(employeeId, yearMonth);
    
    // 5. 计算奖惩金额
    const rewardPunishment = await this.calculateRewardPunishment(employeeId, yearMonth);
    
    // 6. 计算个税
    // 应纳税所得额（扣除社保、公积金后，扣除起征点和专项附加扣除前）
    const taxableIncomeBeforeDeductions = salaryDetails.totalSalary - socialInsurance - housingFundPersonal;
    const taxFormula = await this.getTaxFormula(employeeId); // 获取适用的个税公式
    const tax = await this.calculateTax(taxableIncomeBeforeDeductions, taxFormula || PayrollService.DEFAULT_TAX_FORMULA, specialAdditionalDeductions);
    
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
  
  /**
   * 批量计算工资
   * @param yearMonth 年月，格式：YYYY-MM
   * @param departmentId 可选，部门ID，不传则计算所有员工
   * @returns 工资计算结果数组
   */
  async batchCalculateSalary(yearMonth: string, departmentId?: number): Promise<PayrollResult[]> {
    // 1. 获取员工列表
    const employees = await this.getEmployeeList(departmentId);
    
    // 2. 批量计算工资
    const results = [];
    for (const employee of employees) {
      const result = await this.calculateEmployeeSalary(employee.id, yearMonth);
      results.push(result);
    }
    
    // 3. 返回结果
    return results;
  }
  
  /**
   * 获取员工列表
   * @param departmentId 部门ID，不传则获取所有员工
   * @returns 员工列表
   */
  protected async getEmployeeList(departmentId?: number): Promise<any[]> {
    // 实际实现中应从数据库获取员工列表
    return [];
  }
  
  /**
   * 获取员工信息
   * @param employeeId 员工ID
   * @returns 员工信息
   */
  protected async getEmployeeInfo(employeeId: number): Promise<any> {
    // 实际实现中应从数据库获取员工信息
    return {
      id: employeeId,
      name: '测试员工',
      salaryGroupId: 1,
      socialInsuranceGroupId: 1,
      baseSalary: 8000
    };
  }
  
  /**
   * 获取薪酬组信息
   * @param salaryGroupId 薪酬组ID
   * @returns 薪酬组信息
   */
  protected async getSalaryGroup(salaryGroupId: number): Promise<SalaryGroup> {
    // 实际实现中应从数据库获取薪酬组信息
    return {
      id: salaryGroupId,
      name: '默认薪酬组',
      description: '基本薪酬组',
      items: [
        { salaryItemId: 1, calculationOrder: 1 }, // 基本工资
        { salaryItemId: 2, calculationOrder: 2 }, // 岗位津贴
        { salaryItemId: 3, calculationOrder: 3 }, // 绩效奖金
        { salaryItemId: 4, calculationOrder: 4 }, // 工龄工资
        { salaryItemId: 5, calculationOrder: 5 }  // 全勤奖
      ]
    };
  }
  
  /**
   * 获取薪酬项列表
   * @param salaryGroup 薪酬组
   * @returns 薪酬项列表（按计算顺序排序）
   */
  protected async getSalaryItems(salaryGroup: SalaryGroup): Promise<SalaryItem[]> {
    // 实际实现中应从数据库获取薪酬项信息
    const allItems = [
      { id: 1, name: '基本工资', type: 'fixed', value: 8000, description: '基本工资' },
      { id: 2, name: '岗位津贴', type: 'fixed', value: 1000, description: '岗位津贴' },
      { id: 3, name: '绩效奖金', type: 'percentage', value: 0.2, description: '基本工资的20%' },
      { id: 4, name: '工龄工资', type: 'formula', value: 'workYears * 100', description: '工龄 × 100元' },
      { id: 5, name: '全勤奖', type: 'formula', value: 'IF(attendanceExceptions == 0, 500, 0)', description: '无考勤异常则发放500元' }
    ] as SalaryItem[];
    
    // 按照薪酬组中的计算顺序排序
    const orderedItems = [];
    for (const item of salaryGroup.items) {
      const salaryItem = allItems.find(i => i.id === item.salaryItemId);
      if (salaryItem) {
        orderedItems.push(salaryItem);
      }
    }
    
    return orderedItems;
  }
  
  /**
   * 重新计算单个员工工资
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 工资计算结果
   */
  async recalculateEmployeeSalary(employeeId: number, yearMonth: string): Promise<PayrollResult> {
    // 1. 删除已有工资记录
    await this.deletePayrollRecord(employeeId, yearMonth);
    
    // 2. 重新计算
    return this.calculateEmployeeSalary(employeeId, yearMonth);
  }
  
  /**
   * 删除工资记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   */
  protected async deletePayrollRecord(employeeId: number, yearMonth: string): Promise<void> {
    // 实际实现中应从数据库删除工资记录
    console.log(`删除员工${employeeId}在${yearMonth}的工资记录`);
  }
  
  /**
   * 保存工资记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @param payrollResult 工资计算结果
   */
  protected async savePayrollRecord(employeeId: number, yearMonth: string, payrollResult: PayrollResult): Promise<void> {
    // 实际实现中应将工资记录保存到数据库
    console.log(`保存员工${employeeId}在${yearMonth}的工资记录`);
  }
  
  /**
   * 计算薪酬项
   * @param employeeId 员工ID
   * @param salaryItems 薪酬项列表
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 薪酬计算结果
   */
  protected async calculateSalaryItems(employeeId: number, salaryItems: SalaryItem[], yearMonth: string): Promise<{
    baseSalary: number;
    totalSalary: number;
    details: Record<string, number>;
  }> {
    // 获取员工信息和考勤信息等
    const employee = await this.getEmployeeInfo(employeeId);
    const attendanceExceptions = await this.getAttendanceExceptionCount(employeeId, yearMonth);
    const workYears = await this.getEmployeeWorkYears(employeeId);
    
    // 初始化结果
    const details: Record<string, number> = {};
    let totalSalary = 0;
    
    // 创建公式解析上下文
    const context: Record<string, any> = {
      baseSalary: employee.baseSalary,
      workYears,
      attendanceExceptions,
      yearMonth
    };
    
    // 按顺序计算每个薪酬项
    for (const item of salaryItems) {
      let itemValue = 0;
      
      // 根据薪酬项类型计算值
      switch (item.type) {
        case 'fixed':
          // 固定值类型
          itemValue = Number(item.value);
          break;
          
        case 'percentage':
          // 百分比类型，通常是基于基本工资的百分比
          itemValue = context.baseSalary * Number(item.value);
          break;
          
        case 'formula':
          // 公式类型，需要解析并计算公式
          itemValue = this.evaluateFormula(String(item.value), context);
          break;
      }
      
      // 将计算结果保存到上下文和明细中
      context[item.name] = itemValue;
      details[item.name] = itemValue;
      totalSalary += itemValue;
    }
    
    return {
      baseSalary: employee.baseSalary,
      totalSalary,
      details
    };
  }
  
  /**
   * 解析并计算公式
   * @param formula 公式字符串
   * @param context 计算上下文
   * @returns 计算结果
   */
  private evaluateFormula(formula: string, context: Record<string, any>): number {
    try {
      // 处理IF条件函数
      if (formula.startsWith('IF(')) {
        return this.evaluateIfCondition(formula, context);
      }
      
      // 替换上下文变量
      let expression = formula;
      for (const key in context) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, context[key]);
      }
      
      // 安全地计算表达式
      // 注意：实际生产环境中应使用更安全的表达式解析库
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error(`公式解析错误: ${formula}`, error);
      return 0;
    }
  }
  
  /**
   * 解析并计算IF条件函数
   * @param formula IF条件公式
   * @param context 计算上下文
   * @returns 计算结果
   */
  private evaluateIfCondition(formula: string, context: Record<string, any>): number {
    try {
      // 提取IF函数的参数: IF(condition, trueValue, falseValue)
      const argsMatch = formula.match(/IF\((.+),(.+),(.+)\)/);
      if (!argsMatch || argsMatch.length !== 4) {
        throw new Error('IF函数格式不正确');
      }
      
      const condition = argsMatch[1].trim();
      const trueValue = argsMatch[2].trim();
      const falseValue = argsMatch[3].trim();
      
      // 替换条件中的上下文变量
      let conditionExpr = condition;
      for (const key in context) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        conditionExpr = conditionExpr.replace(regex, context[key]);
      }
      
      // 计算条件
      // eslint-disable-next-line no-eval
      const conditionResult = eval(conditionExpr);
      
      // 根据条件结果返回相应的值
      if (conditionResult) {
        return this.evaluateFormula(trueValue, context);
      } else {
        return this.evaluateFormula(falseValue, context);
      }
    } catch (error) {
      console.error(`IF条件解析错误: ${formula}`, error);
      return 0;
    }
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
    // 实际实现中应从数据库获取员工入职日期，然后计算工龄
    return 3; // 示例：3年工龄
  }
  
  /**
   * 计算个税
   * @param employeeId 员工ID
   * @param totalSalary 总工资
   * @param socialInsurance 社保金额
   * @returns 个税金额
   */
  protected async calculateTax(taxableIncomeBeforeDeductions: number, taxFormula: TaxFormula, specialAdditionalDeductions: number): Promise<number> {
    // 1. 获取个税公式
    // const taxFormula = await this.getTaxFormula(employeeId) || PayrollService.DEFAULT_TAX_FORMULA; // 移除重复声明和冗余调用
    
    // 2. 计算应纳税所得额
    const taxableIncome = taxableIncomeBeforeDeductions - taxFormula.formula.threshold - specialAdditionalDeductions; // 减去起征点和专项附加扣除
    
    // 3. 计算个税
    let tax = 0;
    if (taxableIncome > 0) {
      // 按照累进税率计算个税
      for (const level of taxFormula.formula.rates) {
        if (taxableIncome <= level.upper) { // 修正条件，使用 upper 属性
          tax = taxableIncome * level.rate - level.quick_deduction; // 修正计算方式
          break; // 找到对应级距后退出循环
        }
      }
    }
    
    return Math.max(0, tax); // 确保税额不为负数
  }
  
  /**
   * 获取员工适用的个税公式
   * @param employeeId 员工ID
   * @returns 个税公式
   */
  protected async getTaxFormula(employeeId: number): Promise<TaxFormula | null> {
    // 实际实现中需要根据员工所在地区或其他因素获取适用的个税公式
    // 这里返回 null，表示由实现类（PayrollServiceImpl）负责获取
    return null;
  }
  
  /**
   * 计算社保
   * @param employeeId 员工ID
   * @param totalSalary 总工资
   * @returns 社保金额（个人部分）
   */
  protected async calculateSocialInsurance(employeeId: number, totalSalary: number): Promise<number> {
    // 1. 获取员工社保组
    const employee = await this.getEmployeeInfo(employeeId);
    const socialInsuranceGroup = await this.getSocialInsuranceGroup(employee.socialInsuranceGroupId);
    
    if (!socialInsuranceGroup) {
      return 0; // 如果没有社保组，则不计算社保
    }
    
    // 2. 计算社保基数（确保在上下限范围内）
    const socialInsuranceBase = Math.min(
      Math.max(totalSalary, PayrollService.SOCIAL_INSURANCE_BASE_MIN),
      PayrollService.SOCIAL_INSURANCE_BASE_MAX
    );
    
    // 3. 计算社保金额（个人部分）
    const pension = socialInsuranceBase * socialInsuranceGroup.pensionPersonal;
    const medical = socialInsuranceBase * socialInsuranceGroup.medicalPersonal;
    const unemployment = socialInsuranceBase * socialInsuranceGroup.unemploymentPersonal;
    const housing = socialInsuranceBase * socialInsuranceGroup.housingPersonal;
    
    // 4. 返回个人需缴纳的社保总额
    return pension + medical + unemployment + housing;
  }
  
  /**
   * 获取员工社保组
   * @param socialInsuranceGroupId 社保组ID
   * @returns 社保组信息
   */
  protected async getSocialInsuranceGroup(socialInsuranceGroupId: number): Promise<SocialInsurance | null> {
    // 实际实现中应从数据库获取社保组信息
    // 这里返回一个示例社保组
    return {
      id: socialInsuranceGroupId,
      name: '默认社保组',
      pensionPersonal: 0.08, // 养老保险个人缴纳比例
      pensionCompany: 0.16, // 养老保险公司缴纳比例
      medicalPersonal: 0.02, // 医疗保险个人缴纳比例
      medicalCompany: 0.085, // 医疗保险公司缴纳比例
      unemploymentPersonal: 0.005, // 失业保险个人缴纳比例
      unemploymentCompany: 0.005, // 失业保险公司缴纳比例
      injuryCompany: 0.005, // 工伤保险公司缴纳比例
      maternityCompany: 0.01, // 生育保险公司缴纳比例
      housingPersonal: 0.07, // 住房公积金个人缴纳比例
      housingCompany: 0.07 // 住房公积金公司缴纳比例
    };
  }
  
  /**
   * 计算考勤扣款
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 考勤扣款金额
   */
  protected async calculateAttendanceDeduction(employeeId: number, yearMonth: string): Promise<number> {
    // 1. 获取考勤记录
    const attendanceRecords = await this.getAttendanceRecords(employeeId, yearMonth);
    
    // 2. 获取考勤异常设置
    const exceptionSettings = await this.getAttendanceExceptionSettings();
    
    // 3. 计算扣款
    let totalDeduction = 0;
    for (const record of attendanceRecords) {
      const setting = exceptionSettings.find(s => s.id === record.exceptionTypeId);
      if (setting && setting.deductionRule) {
        // 根据多段式规则计算扣款
        const deduction = this.calculateDeductionByRule(record.exceptionCount, setting.deductionRule);
        totalDeduction += deduction;
      }
    }
    
    return totalDeduction;
  }
  
  /**
   * 根据多段式规则计算扣款
   * @param count 异常次数
   * @param rule 扣款规则
   * @returns 扣款金额
   */
  protected calculateDeductionByRule(count: number, rule: any): number {
    // 实际实现中应根据多段式规则计算扣款
    // 例如：迟到1次扣10元，2次扣30元，3次以上每次扣50元
    if (!rule || count <= 0) return 0;
    
    let deduction = 0;
    for (const level of rule.levels) {
      if (count <= level.threshold) {
        deduction = level.value * count;
        break;
      }
    }
    
    return deduction;
  }
  
  /**
   * 获取考勤记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 考勤异常记录
   */
  protected async getAttendanceRecords(employeeId: number, yearMonth: string): Promise<AttendanceException[]> {
    // 实际实现中应从数据库获取考勤记录
    return [];
  }
  
  /**
   * 获取考勤异常设置
   * @returns 考勤异常设置
   */
  protected async getAttendanceExceptionSettings(): Promise<any[]> {
    // 实际实现中应从数据库获取考勤异常设置
    return [];
  }
  
  /**
   * 计算奖惩金额
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 奖惩金额
   */
  protected async calculateRewardPunishment(employeeId: number, yearMonth: string): Promise<number> {
    // 1. 获取奖惩记录
    const records = await this.getRewardPunishmentRecords(employeeId, yearMonth);
    
    // 2. 计算奖惩金额
    let total = 0;
    for (const record of records) {
      total += record.type === 'reward' ? record.amount : -record.amount; // 奖励为正，惩罚为负
    }
    
    return total;
  }
  
  /**
   * 获取奖惩记录
   * @param employeeId 员工ID
   * @param yearMonth 年月，格式：YYYY-MM
   * @returns 奖惩记录
   */
  protected async getRewardPunishmentRecords(employeeId: number, yearMonth: string): Promise<RewardPunishment[]> {
    // 实际实现中应从数据库获取奖惩记录
    return [];
  }
}