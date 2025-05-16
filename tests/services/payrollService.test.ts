import { PayrollService, SalaryItem, SalaryGroup, SocialInsurance, TaxFormula, PayrollResult } from '../../src/services/payrollService';

describe('PayrollService', () => {
  let payrollService: PayrollService;
  
  // 测试数据
  const mockEmployee = {
    id: 1,
    name: '测试员工',
    salaryGroupId: 1,
    socialInsuranceGroupId: 1,
    baseSalary: 8000,
    entryDate: '2020-01-01'
  };
  
  const mockSalaryGroup: SalaryGroup = {
    id: 1,
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
  
  const mockSalaryItems: SalaryItem[] = [
    { id: 1, name: '基本工资', type: 'fixed', value: 8000, description: '基本工资' },
    { id: 2, name: '岗位津贴', type: 'fixed', value: 1000, description: '岗位津贴' },
    { id: 3, name: '绩效奖金', type: 'percentage', value: 0.2, description: '基本工资的20%' },
    { id: 4, name: '工龄工资', type: 'formula', value: 'workYears * 100', description: '工龄 × 100元' },
    { id: 5, name: '全勤奖', type: 'formula', value: 'IF(attendanceExceptions == 0, 500, 0)', description: '无考勤异常则发放500元' }
  ];
  
  const mockSocialInsurance: SocialInsurance = {
    id: 1,
    name: '默认社保组',
    pensionPersonal: 0.08,
    pensionCompany: 0.16,
    medicalPersonal: 0.02,
    medicalCompany: 0.085,
    unemploymentPersonal: 0.005,
    unemploymentCompany: 0.005,
    injuryCompany: 0.005,
    maternityCompany: 0.01,
    housingPersonal: 0.07,
    housingCompany: 0.07
  };
  
  beforeEach(() => {
    payrollService = new PayrollService();
    
    // Mock 私有方法
    jest.spyOn(payrollService as any, 'getEmployeeInfo').mockResolvedValue(mockEmployee);
    jest.spyOn(payrollService as any, 'getSalaryGroup').mockResolvedValue(mockSalaryGroup);
    jest.spyOn(payrollService as any, 'getSalaryItems').mockResolvedValue(mockSalaryItems);
    jest.spyOn(payrollService as any, 'getSocialInsuranceGroup').mockResolvedValue(mockSocialInsurance);
    jest.spyOn(payrollService as any, 'getAttendanceExceptionCount').mockResolvedValue(0);
    jest.spyOn(payrollService as any, 'getEmployeeWorkYears').mockResolvedValue(3);
    jest.spyOn(payrollService as any, 'getAttendanceRecords').mockResolvedValue([]);
    jest.spyOn(payrollService as any, 'getAttendanceExceptionSettings').mockResolvedValue([]);
    jest.spyOn(payrollService as any, 'getRewardPunishmentRecords').mockResolvedValue([]);
    jest.spyOn(payrollService as any, 'savePayrollRecord').mockResolvedValue([]);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateEmployeeSalary', () => {
    it('应正确计算员工工资', async () => {
      // 执行测试
      const result = await payrollService.calculateEmployeeSalary(1, '2023-01');
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.employeeId).toBe(1);
      expect(result.yearMonth).toBe('2023-01');
      
      // 验证基本工资
      expect(result.baseSalary).toBe(8000);
      
      // 验证薪酬项计算
      expect(result.details['基本工资']).toBe(8000);
      expect(result.details['岗位津贴']).toBe(1000);
      expect(result.details['绩效奖金']).toBe(1600); // 8000 * 0.2
      expect(result.details['工龄工资']).toBe(300);  // 3年 * 100
      expect(result.details['全勤奖']).toBe(500);    // 无考勤异常
      
      // 验证总工资
      expect(result.totalSalary).toBe(11400); // 8000 + 1000 + 1600 + 300 + 500
      
      // 验证社保计算
      const expectedSocialInsurance = 11400 * (0.08 + 0.02 + 0.005 + 0.07); // 养老金 + 医疗 + 失业 + 住房公积金
      expect(result.socialInsurance).toBeCloseTo(expectedSocialInsurance, 2);
      
      // 验证个税计算
      const taxableIncome = 11400 - expectedSocialInsurance - 5000; // 总工资 - 社保 - 起征点
      let expectedTax = 0;
      if (taxableIncome <= 36000) {
        expectedTax = taxableIncome * 0.03;
      }
      expect(result.tax).toBeCloseTo(expectedTax, 2);
      
      // 验证实发工资
      const expectedNetSalary = 11400 - expectedSocialInsurance - expectedTax;
      expect(result.netSalary).toBeCloseTo(expectedNetSalary, 2);
    });
    
    it('应正确处理考勤异常', async () => {
      // 修改考勤异常次数
      jest.spyOn(payrollService as any, 'getAttendanceExceptionCount').mockResolvedValue(2);
      
      // 执行测试
      const result = await payrollService.calculateEmployeeSalary(1, '2023-01');
      
      // 验证全勤奖为0
      expect(result.details['全勤奖']).toBe(0);
      
      // 验证总工资不包含全勤奖
      expect(result.totalSalary).toBe(10900); // 8000 + 1000 + 1600 + 300
    });
    
    it('应正确处理奖惩记录', async () => {
      // 添加奖惩记录
      jest.spyOn(payrollService as any, 'getRewardPunishmentRecords').mockResolvedValue([
        { id: 1, employeeId: 1, recordDate: '2023-01-15', type: 'reward', amount: 1000, reason: '业绩突出' },
        { id: 2, employeeId: 1, recordDate: '2023-01-20', type: 'punishment', amount: 200, reason: '迟到' }
      ]);
      
      // 执行测试
      const result = await payrollService.calculateEmployeeSalary(1, '2023-01');
      
      // 验证奖惩金额
      expect(result.rewardPunishment).toBe(800); // 1000 - 200
      
      // 验证实发工资包含奖惩金额
      const expectedNetSalary = result.totalSalary - result.socialInsurance - result.tax + 800;
      expect(result.netSalary).toBeCloseTo(expectedNetSalary, 2);
    });
  });
  
  describe('evaluateFormula', () => {
    it('应正确计算简单数学公式', async () => {
      const context = { baseSalary: 8000, workYears: 3 };
      const formula = 'workYears * 100';
      
      const result = (payrollService as any).evaluateFormula(formula, context);
      
      expect(result).toBe(300);
    });
    
    it('应正确计算IF条件公式', async () => {
      const context = { attendanceExceptions: 0 };
      const formula = 'IF(attendanceExceptions == 0, 500, 0)';
      
      const result = (payrollService as any).evaluateFormula(formula, context);
      
      expect(result).toBe(500);
      
      // 修改条件测试false分支
      context.attendanceExceptions = 2;
      const result2 = (payrollService as any).evaluateFormula(formula, context);
      
      expect(result2).toBe(0);
    });
  });
});