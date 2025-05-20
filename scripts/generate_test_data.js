/**
 * 测试数据生成脚本
 * 为payroll.db生成测试数据，用于验证前端是否能获取数据
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/payroll.db');

console.log('测试数据生成脚本启动');
console.log('数据库路径:', dbPath);

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.error('payroll.db 文件不存在，请先确保数据库文件已创建');
  process.exit(1);
}

// 打开数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库:', dbPath);
});

// 关闭数据库连接函数
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
  });
}

// 运行SQL查询的工具函数
async function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

// 开始事务
db.run('BEGIN TRANSACTION', async (err) => {
  if (err) {
    console.error('开始事务失败:', err.message);
    closeDb();
    return;
  }

  try {
    // 依次生成测试数据
    await generateDepartments();
    await generateSocialInsuranceGroups();
    await generateSalaryGroups();
    await generateSalaryItems();
    await generateSalaryGroupItems();
    await generateAttendanceExceptionSettings();
    await generateEmployees();
    await generateAttendanceRecords();
    // 暂时注释掉税款公式生成，因为函数尚未实现
    // await generateTaxFormulas();

    // 提交事务
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('提交事务失败:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log('测试数据生成完成，事务已提交');
      }
      closeDb();
    });
  } catch (error) {
    console.error('生成测试数据时出错:', error);
    db.run('ROLLBACK', () => {
      console.log('事务已回滚');
      closeDb();
    });
  }
});

// 生成部门数据
async function generateDepartments() {
  console.log('开始生成部门数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM departments');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "departments"');
  
  // 部门测试数据
  const departments = [
    { name: '行政部', description: '负责公司日常行政事务管理' },
    { name: '人力资源部', description: '负责公司人员招聘、培训和绩效管理' },
    { name: '财务部', description: '负责公司财务和会计工作' },
    { name: '技术部', description: '负责产品研发和技术支持' },
    { name: '销售部', description: '负责产品销售和客户维护' },
    { name: '市场部', description: '负责市场分析和品牌推广' },
    { name: '客服部', description: '负责客户服务和售后支持' }
  ];
  
  for (const dept of departments) {
    await runQuery(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [dept.name, dept.description]
    );
  }
  
  console.log(`已生成 ${departments.length} 条部门数据`);
}

// 生成社保组数据
async function generateSocialInsuranceGroups() {
  console.log('开始生成社保组数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM social_insurance_groups');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "social_insurance_groups"');
  
  // 社保组测试数据
  const groups = [
    {
      name: '标准社保组',
      description: '适用于大多数员工的标准社保配置',
      pension_base: 10000,
      medical_base: 10000,
      unemployment_base: 10000,
      injury_base: 10000,
      maternity_base: 10000,
      housing_fund_base: 10000,
      pension_rate_company: 0.16,
      pension_rate_personal: 0.08,
      medical_rate_company: 0.1,
      medical_rate_personal: 0.02,
      unemployment_rate_company: 0.005,
      unemployment_rate_personal: 0.005,
      injury_rate_company: 0.005,
      maternity_rate_company: 0.01,
      housing_fund_rate_company: 0.07,
      housing_fund_rate_personal: 0.07
    },
    {
      name: '高级社保组',
      description: '适用于高级管理人员的社保配置',
      pension_base: 15000,
      medical_base: 15000,
      unemployment_base: 15000,
      injury_base: 15000,
      maternity_base: 15000,
      housing_fund_base: 15000,
      pension_rate_company: 0.16,
      pension_rate_personal: 0.08,
      medical_rate_company: 0.1,
      medical_rate_personal: 0.02,
      unemployment_rate_company: 0.005,
      unemployment_rate_personal: 0.005,
      injury_rate_company: 0.005,
      maternity_rate_company: 0.01,
      housing_fund_rate_company: 0.12,
      housing_fund_rate_personal: 0.12
    }
  ];
  
  for (const group of groups) {
    await runQuery(
      `INSERT INTO social_insurance_groups (
        name, description, 
        pension_base, medical_base, unemployment_base, injury_base, maternity_base, housing_fund_base,
        pension_rate_company, pension_rate_personal, 
        medical_rate_company, medical_rate_personal,
        unemployment_rate_company, unemployment_rate_personal,
        injury_rate_company, maternity_rate_company,
        housing_fund_rate_company, housing_fund_rate_personal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        group.name, group.description,
        group.pension_base, group.medical_base, group.unemployment_base,
        group.injury_base, group.maternity_base, group.housing_fund_base,
        group.pension_rate_company, group.pension_rate_personal,
        group.medical_rate_company, group.medical_rate_personal,
        group.unemployment_rate_company, group.unemployment_rate_personal,
        group.injury_rate_company, group.maternity_rate_company,
        group.housing_fund_rate_company, group.housing_fund_rate_personal
      ]
    );
  }
  
  console.log(`已生成 ${groups.length} 条社保组数据`);
}

// 生成薪资组数据
async function generateSalaryGroups() {
  console.log('开始生成薪资组数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM salary_groups');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "salary_groups"');
  
  // 薪资组测试数据
  const groups = [
    { name: '普通员工薪资组', description: '适用于普通员工的标准薪资配置' },
    { name: '中级管理薪资组', description: '适用于中级管理人员的薪资配置' },
    { name: '高级管理薪资组', description: '适用于高级管理人员的薪资配置' },
    { name: '技术人员薪资组', description: '适用于技术人员的薪资配置' },
    { name: '销售人员薪资组', description: '适用于销售人员的薪资配置，包含提成项' },
  ];
  
  for (const group of groups) {
    await runQuery(
      'INSERT INTO salary_groups (name, description) VALUES (?, ?)',
      [group.name, group.description]
    );
  }
  
  console.log(`已生成 ${groups.length} 条薪资组数据`);
}

// 生成薪资项目数据
async function generateSalaryItems() {
  console.log('开始生成薪资项目数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM salary_items');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "salary_items"');
  
  // 薪资项目测试数据
  const items = [
    {
      code: 'BASE_SALARY',
      name: '基本工资',
      description: '员工基本工资项目',
      type: 'base',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 1,
      is_displayed: 1,
      display_order: 1,
      is_preset: 1
    },
    {
      code: 'POSITION_ALLOWANCE',
      name: '岗位津贴',
      description: '根据岗位等级发放的津贴',
      type: 'base',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 1,
      is_displayed: 1,
      display_order: 2
    },
    {
      code: 'PERFORMANCE_BONUS',
      name: '绩效奖金',
      description: '根据员工绩效评估结果发放的奖金',
      type: 'bonus',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 1,
      is_displayed: 1,
      display_order: 3
    },
    {
      code: 'OVERTIME_PAY',
      name: '加班费',
      description: '加班工资补贴',
      type: 'bonus',
      calculation_type: 'formula',
      calculation_value: 'BASE_SALARY / 21.75 / 8 * 1.5 * OVERTIME_HOURS',
      is_taxable: 1,
      is_displayed: 1,
      display_order: 4
    },
    {
      code: 'MEAL_ALLOWANCE',
      name: '餐饮补贴',
      description: '每月餐饮补贴',
      type: 'other',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 5
    },
    {
      code: 'TRANSPORTATION_ALLOWANCE',
      name: '交通补贴',
      description: '每月交通补贴',
      type: 'other',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 6
    },
    {
      code: 'HOUSING_ALLOWANCE',
      name: '住房补贴',
      description: '每月住房补贴',
      type: 'other',
      calculation_type: 'fixed',
      calculation_value: '',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 7
    },
    {
      code: 'PENSION',
      name: '养老保险',
      description: '个人缴纳的养老保险',
      type: 'insurance',
      calculation_type: 'formula',
      calculation_value: 'SOCIAL_INSURANCE_BASE * PENSION_RATE_PERSONAL',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 8
    },
    {
      code: 'MEDICAL',
      name: '医疗保险',
      description: '个人缴纳的医疗保险',
      type: 'insurance',
      calculation_type: 'formula',
      calculation_value: 'SOCIAL_INSURANCE_BASE * MEDICAL_RATE_PERSONAL',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 9
    },
    {
      code: 'UNEMPLOYMENT',
      name: '失业保险',
      description: '个人缴纳的失业保险',
      type: 'insurance',
      calculation_type: 'formula',
      calculation_value: 'SOCIAL_INSURANCE_BASE * UNEMPLOYMENT_RATE_PERSONAL',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 10
    },
    {
      code: 'HOUSING_FUND',
      name: '住房公积金',
      description: '个人缴纳的住房公积金',
      type: 'insurance',
      calculation_type: 'formula',
      calculation_value: 'HOUSING_FUND_BASE * HOUSING_FUND_RATE_PERSONAL',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 11
    },
    {
      code: 'INDIVIDUAL_INCOME_TAX',
      name: '个人所得税',
      description: '个人所得税',
      type: 'tax',
      calculation_type: 'formula',
      calculation_value: 'TAX_FORMULA',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 12
    },
    {
      code: 'ATTENDENCE_DEDUCTION',
      name: '考勤扣款',
      description: '根据考勤异常记录计算的扣款',
      type: 'deduction',
      calculation_type: 'attendance_based',
      calculation_value: '',
      is_taxable: 0,
      is_displayed: 1,
      display_order: 13
    },
    {
      code: 'SALES_COMMISSION',
      name: '销售提成',
      description: '销售人员业绩提成',
      type: 'bonus',
      calculation_type: 'percentage',
      calculation_value: '',
      is_taxable: 1,
      is_displayed: 1,
      display_order: 14
    }
  ];
  
  for (const item of items) {
    await runQuery(
      `INSERT INTO salary_items (
        code, name, description, type, calculation_type, calculation_value,
        is_taxable, is_displayed, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.code, item.name, item.description, item.type, item.calculation_type,
        item.calculation_value, item.is_taxable, item.is_displayed, item.display_order
      ]
    );
  }
  
  console.log(`已生成 ${items.length} 条薪资项目数据`);
}

// 生成薪资组项目关联数据
async function generateSalaryGroupItems() {
  console.log('开始生成薪资组项目关联数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM salary_group_items');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "salary_group_items"');
  
  // 获取所有薪资组
  const salaryGroups = await getAllSalaryGroups();
  
  // 获取所有薪资项
  const salaryItems = await getAllSalaryItems();
  
  // 普通员工薪资组项目关联数据
  const normalGroupId = salaryGroups.find(g => g.name === '普通员工薪资组')?.id;
  if (normalGroupId) {
    // 基本工资
    await addSalaryGroupItem(normalGroupId, 'BASE_SALARY', 5000);
    // 岗位津贴
    await addSalaryGroupItem(normalGroupId, 'POSITION_ALLOWANCE', 500);
    // 餐饮补贴
    await addSalaryGroupItem(normalGroupId, 'MEAL_ALLOWANCE', 300);
    // 交通补贴
    await addSalaryGroupItem(normalGroupId, 'TRANSPORTATION_ALLOWANCE', 300);
    // 其他薪资项(不设默认值的项目)
    await addSalaryGroupItem(normalGroupId, 'PERFORMANCE_BONUS');
    await addSalaryGroupItem(normalGroupId, 'OVERTIME_PAY');
    await addSalaryGroupItem(normalGroupId, 'PENSION');
    await addSalaryGroupItem(normalGroupId, 'MEDICAL');
    await addSalaryGroupItem(normalGroupId, 'UNEMPLOYMENT');
    await addSalaryGroupItem(normalGroupId, 'HOUSING_FUND');
    await addSalaryGroupItem(normalGroupId, 'INDIVIDUAL_INCOME_TAX');
    await addSalaryGroupItem(normalGroupId, 'ATTENDENCE_DEDUCTION');
  }
  
  // 中级管理薪资组
  const middleManagerGroupId = salaryGroups.find(g => g.name === '中级管理薪资组')?.id;
  if (middleManagerGroupId) {
    // 基本工资
    await addSalaryGroupItem(middleManagerGroupId, 'BASE_SALARY', 8000);
    // 岗位津贴
    await addSalaryGroupItem(middleManagerGroupId, 'POSITION_ALLOWANCE', 1000);
    // 餐饮补贴
    await addSalaryGroupItem(middleManagerGroupId, 'MEAL_ALLOWANCE', 500);
    // 交通补贴
    await addSalaryGroupItem(middleManagerGroupId, 'TRANSPORTATION_ALLOWANCE', 500);
    // 住房补贴
    await addSalaryGroupItem(middleManagerGroupId, 'HOUSING_ALLOWANCE', 1000);
    // 其他薪资项(不设默认值的项目)
    await addSalaryGroupItem(middleManagerGroupId, 'PERFORMANCE_BONUS');
    await addSalaryGroupItem(middleManagerGroupId, 'OVERTIME_PAY');
    await addSalaryGroupItem(middleManagerGroupId, 'PENSION');
    await addSalaryGroupItem(middleManagerGroupId, 'MEDICAL');
    await addSalaryGroupItem(middleManagerGroupId, 'UNEMPLOYMENT');
    await addSalaryGroupItem(middleManagerGroupId, 'HOUSING_FUND');
    await addSalaryGroupItem(middleManagerGroupId, 'INDIVIDUAL_INCOME_TAX');
    await addSalaryGroupItem(middleManagerGroupId, 'ATTENDENCE_DEDUCTION');
  }
  
  // 高级管理薪资组
  const seniorManagerGroupId = salaryGroups.find(g => g.name === '高级管理薪资组')?.id;
  if (seniorManagerGroupId) {
    // 基本工资
    await addSalaryGroupItem(seniorManagerGroupId, 'BASE_SALARY', 15000);
    // 岗位津贴
    await addSalaryGroupItem(seniorManagerGroupId, 'POSITION_ALLOWANCE', 3000);
    // 餐饮补贴
    await addSalaryGroupItem(seniorManagerGroupId, 'MEAL_ALLOWANCE', 1000);
    // 交通补贴
    await addSalaryGroupItem(seniorManagerGroupId, 'TRANSPORTATION_ALLOWANCE', 1000);
    // 住房补贴
    await addSalaryGroupItem(seniorManagerGroupId, 'HOUSING_ALLOWANCE', 3000);
    // 其他薪资项
    await addSalaryGroupItem(seniorManagerGroupId, 'PERFORMANCE_BONUS');
    await addSalaryGroupItem(seniorManagerGroupId, 'PENSION');
    await addSalaryGroupItem(seniorManagerGroupId, 'MEDICAL');
    await addSalaryGroupItem(seniorManagerGroupId, 'UNEMPLOYMENT');
    await addSalaryGroupItem(seniorManagerGroupId, 'HOUSING_FUND');
    await addSalaryGroupItem(seniorManagerGroupId, 'INDIVIDUAL_INCOME_TAX');
  }
  
  // 技术人员薪资组
  const techGroupId = salaryGroups.find(g => g.name === '技术人员薪资组')?.id;
  if (techGroupId) {
    // 基本工资
    await addSalaryGroupItem(techGroupId, 'BASE_SALARY', 10000);
    // 岗位津贴
    await addSalaryGroupItem(techGroupId, 'POSITION_ALLOWANCE', 2000);
    // 餐饮补贴
    await addSalaryGroupItem(techGroupId, 'MEAL_ALLOWANCE', 500);
    // 交通补贴
    await addSalaryGroupItem(techGroupId, 'TRANSPORTATION_ALLOWANCE', 500);
    // 住房补贴
    await addSalaryGroupItem(techGroupId, 'HOUSING_ALLOWANCE', 2000);
    // 其他薪资项
    await addSalaryGroupItem(techGroupId, 'PERFORMANCE_BONUS');
    await addSalaryGroupItem(techGroupId, 'OVERTIME_PAY');
    await addSalaryGroupItem(techGroupId, 'PENSION');
    await addSalaryGroupItem(techGroupId, 'MEDICAL');
    await addSalaryGroupItem(techGroupId, 'UNEMPLOYMENT');
    await addSalaryGroupItem(techGroupId, 'HOUSING_FUND');
    await addSalaryGroupItem(techGroupId, 'INDIVIDUAL_INCOME_TAX');
    await addSalaryGroupItem(techGroupId, 'ATTENDENCE_DEDUCTION');
  }
  
  // 销售人员薪资组
  const salesGroupId = salaryGroups.find(g => g.name === '销售人员薪资组')?.id;
  if (salesGroupId) {
    // 基本工资
    await addSalaryGroupItem(salesGroupId, 'BASE_SALARY', 6000);
    // 岗位津贴
    await addSalaryGroupItem(salesGroupId, 'POSITION_ALLOWANCE', 500);
    // 餐饮补贴
    await addSalaryGroupItem(salesGroupId, 'MEAL_ALLOWANCE', 300);
    // 交通补贴
    await addSalaryGroupItem(salesGroupId, 'TRANSPORTATION_ALLOWANCE', 800);
    // 销售提成
    await addSalaryGroupItem(salesGroupId, 'SALES_COMMISSION');
    // 其他薪资项
    await addSalaryGroupItem(salesGroupId, 'PERFORMANCE_BONUS');
    await addSalaryGroupItem(salesGroupId, 'PENSION');
    await addSalaryGroupItem(salesGroupId, 'MEDICAL');
    await addSalaryGroupItem(salesGroupId, 'UNEMPLOYMENT');
    await addSalaryGroupItem(salesGroupId, 'HOUSING_FUND');
    await addSalaryGroupItem(salesGroupId, 'INDIVIDUAL_INCOME_TAX');
    await addSalaryGroupItem(salesGroupId, 'ATTENDENCE_DEDUCTION');
  }
  
  console.log('薪资组项目关联数据生成完成');
}

// 获取所有薪资组
async function getAllSalaryGroups() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM salary_groups', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 获取所有薪资项
async function getAllSalaryItems() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, code FROM salary_items', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 添加薪资组项目关联
async function addSalaryGroupItem(salaryGroupId, itemCode, defaultValue = null) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM salary_items WHERE code = ?', [itemCode], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        console.error(`薪资项 ${itemCode} 不存在`);
        resolve();
        return;
      }
      
      const salaryItemId = row.id;
      
      db.run(
        'INSERT INTO salary_group_items (salary_group_id, salary_item_id, default_value) VALUES (?, ?, ?)',
        [salaryGroupId, salaryItemId, defaultValue],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  });
}

// 生成考勤异常设置数据
async function generateAttendanceExceptionSettings() {
  console.log('开始生成考勤异常设置数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM attendance_exception_settings');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "attendance_exception_settings"');
  
  // 考勤异常设置测试数据
  const settings = [
    {
      name: '迟到',
      deduction_rule_type: 'tiered_count',
      deduction_rule_value: 50,
      deduction_rule_threshold: 3,
      notes: '每月累计3次以上，从第4次起每次扣款50元'
    },
    {
      name: '早退',
      deduction_rule_type: 'tiered_count',
      deduction_rule_value: 50,
      deduction_rule_threshold: 3,
      notes: '每月累计3次以上，从第4次起每次扣款50元'
    },
    {
      name: '旷工',
      deduction_rule_type: 'per_day_salary',
      deduction_rule_value: 3,
      deduction_rule_threshold: 0,
      notes: '每次旷工扣除日工资的3倍'
    },
    {
      name: '事假',
      deduction_rule_type: 'per_day_salary',
      deduction_rule_value: 1,
      deduction_rule_threshold: 0,
      notes: '事假不带薪，按日扣除当日工资'
    },
    {
      name: '病假',
      deduction_rule_type: 'per_day_salary',
      deduction_rule_value: 0.4,
      deduction_rule_threshold: 0,
      notes: '病假按日扣除当日工资的40%'
    }
  ];
  
  for (const setting of settings) {
    await runQuery(
      `INSERT INTO attendance_exception_settings (
        name, deduction_rule_type, deduction_rule_value, deduction_rule_threshold, notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        setting.name,
        setting.deduction_rule_type,
        setting.deduction_rule_value,
        setting.deduction_rule_threshold,
        setting.notes
      ]
    );
  }
  
  console.log(`已生成 ${settings.length} 条考勤异常设置数据`);
}

// 生成员工数据
async function generateEmployees() {
  console.log('开始生成员工数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM employees');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "employees"');
  
  // 获取部门数据
  const departments = await getAllDepartments();
  
  // 获取薪资组数据
  const salaryGroups = await getAllSalaryGroups();
  
  // 获取社保组数据
  const socialInsuranceGroups = await getAllSocialInsuranceGroups();
  
  // 标准社保组
  const standardSocialGroupId = socialInsuranceGroups.find(g => g.name === '标准社保组')?.id;
  
  // 高级社保组
  const seniorSocialGroupId = socialInsuranceGroups.find(g => g.name === '高级社保组')?.id;
  
  // 薪资组映射
  const salaryGroupMap = {
    '普通员工': salaryGroups.find(g => g.name === '普通员工薪资组')?.id,
    '中级管理': salaryGroups.find(g => g.name === '中级管理薪资组')?.id,
    '高级管理': salaryGroups.find(g => g.name === '高级管理薪资组')?.id,
    '技术人员': salaryGroups.find(g => g.name === '技术人员薪资组')?.id,
    '销售人员': salaryGroups.find(g => g.name === '销售人员薪资组')?.id
  };
  
  // 员工测试数据
  const employees = [
    // 行政部
    {
      employee_no: 'XZ001',
      name: '张经理',
      department: '行政部',
      position: '行政经理',
      entry_date: '2021-01-01',
      status: 1,
      salary_group_type: '中级管理',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'XZ002',
      name: '李行政',
      department: '行政部',
      position: '行政专员',
      entry_date: '2022-03-15',
      status: 1,
      salary_group_type: '普通员工',
      social_insurance_type: '标准'
    },
    
    // 人力资源部
    {
      employee_no: 'HR001',
      name: '王人力',
      department: '人力资源部',
      position: 'HR经理',
      entry_date: '2020-05-01',
      status: 1,
      salary_group_type: '中级管理',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'HR002',
      name: '陈招聘',
      department: '人力资源部',
      position: '招聘专员',
      entry_date: '2022-07-01',
      status: 1,
      salary_group_type: '普通员工',
      social_insurance_type: '标准'
    },
    
    // 财务部
    {
      employee_no: 'CW001',
      name: '刘财务',
      department: '财务部',
      position: '财务经理',
      entry_date: '2019-08-01',
      status: 1,
      salary_group_type: '中级管理',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'CW002',
      name: '孙会计',
      department: '财务部',
      position: '会计',
      entry_date: '2021-09-01',
      status: 1,
      salary_group_type: '普通员工',
      social_insurance_type: '标准'
    },
    
    // 技术部
    {
      employee_no: 'IT001',
      name: '黄技术',
      department: '技术部',
      position: '技术总监',
      entry_date: '2018-03-01',
      status: 1,
      salary_group_type: '高级管理',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'IT002',
      name: '田开发',
      department: '技术部',
      position: '高级开发工程师',
      entry_date: '2020-04-15',
      status: 1,
      salary_group_type: '技术人员',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'IT003',
      name: '郭测试',
      department: '技术部',
      position: '测试工程师',
      entry_date: '2021-06-01',
      status: 1,
      salary_group_type: '技术人员',
      social_insurance_type: '标准'
    },
    
    // 销售部
    {
      employee_no: 'XS001',
      name: '吴销售',
      department: '销售部',
      position: '销售总监',
      entry_date: '2019-02-01',
      status: 1,
      salary_group_type: '高级管理',
      social_insurance_type: '高级'
    },
    {
      employee_no: 'XS002',
      name: '郑客户',
      department: '销售部',
      position: '客户经理',
      entry_date: '2020-08-15',
      status: 1,
      salary_group_type: '销售人员',
      social_insurance_type: '标准'
    },
    {
      employee_no: 'XS003',
      name: '赵销售',
      department: '销售部',
      position: '销售代表',
      entry_date: '2022-01-10',
      status: 1,
      salary_group_type: '销售人员',
      social_insurance_type: '标准'
    },
    
    // 市场部
    {
      employee_no: 'MK001',
      name: '孙市场',
      department: '市场部',
      position: '市场经理',
      entry_date: '2020-07-01',
      status: 1,
      salary_group_type: '中级管理',
      social_insurance_type: '标准'
    },
    {
      employee_no: 'MK002',
      name: '胡媒体',
      department: '市场部',
      position: '媒体专员',
      entry_date: '2022-02-15',
      status: 1,
      salary_group_type: '普通员工',
      social_insurance_type: '标准'
    },
    
    // 客服部
    {
      employee_no: 'KF001',
      name: '刘客服',
      department: '客服部',
      position: '客服经理',
      entry_date: '2021-03-01',
      status: 1,
      salary_group_type: '中级管理',
      social_insurance_type: '标准'
    },
    {
      employee_no: 'KF002',
      name: '马客服',
      department: '客服部',
      position: '客服专员',
      entry_date: '2022-05-01',
      status: 1,
      salary_group_type: '普通员工',
      social_insurance_type: '标准'
    }
  ];
  
  // 添加员工数据
  for (const emp of employees) {
    // 查找部门ID
    const departmentId = departments.find(d => d.name === emp.department)?.id;
    
    // 获取薪资组ID
    const salaryGroupId = salaryGroupMap[emp.salary_group_type];
    
    // 获取社保组ID
    const socialInsuranceGroupId = emp.social_insurance_type === '高级' 
      ? seniorSocialGroupId 
      : standardSocialGroupId;
    
    await runQuery(
      `INSERT INTO employees (
        employee_no, name, department, position, entry_date, status, 
        social_insurance_group_id, salary_group_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.employee_no,
        emp.name,
        emp.department,
        emp.position,
        emp.entry_date,
        emp.status,
        socialInsuranceGroupId,
        salaryGroupId
      ]
    );
  }
  
  console.log(`已生成 ${employees.length} 条员工数据`);
}

// 获取所有部门
async function getAllDepartments() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM departments', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 获取所有社保组
async function getAllSocialInsuranceGroups() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM social_insurance_groups', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 生成考勤记录数据
async function generateAttendanceRecords() {
  console.log('开始生成考勤记录数据...');
  
  // 清空现有数据
  await runQuery('DELETE FROM attendance_records');
  
  // 重置自增ID
  await runQuery('DELETE FROM sqlite_sequence WHERE name = "attendance_records"');
  
  // 获取员工数据
  const employees = await new Promise((resolve, reject) => {
    db.all('SELECT id, employee_no, name FROM employees', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
  
  // 获取考勤异常设置
  const exceptionSettings = await new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM attendance_exception_settings', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
  
  // 异常类型映射
  const exceptionTypeMap = {};
  exceptionSettings.forEach(setting => {
    exceptionTypeMap[setting.name] = setting.id;
  });
  
  // 当前月份
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // 生成每个员工的考勤数据
  for (const employee of employees) {
    // 随机生成 0-3 条考勤异常记录
    const exceptionCount = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < exceptionCount; i++) {
      // 随机选择异常类型
      const exceptionTypes = ['迟到', '早退', '事假', '病假', '旷工'];
      const randomIndex = Math.floor(Math.random() * exceptionTypes.length);
      const exceptionType = exceptionTypes[randomIndex];
      const exceptionTypeId = exceptionTypeMap[exceptionType];
      
      // 随机生成日期 (本月内)
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 随机生成小时数 (0-8 小时)
      const hours = exceptionType === '事假' || exceptionType === '病假' || exceptionType === '旷工' 
        ? Math.floor(Math.random() * 8) + 1 
        : 0;
      
      await runQuery(
        `INSERT INTO attendance_records (
          employee_id, record_date, exception_type_id, exception_count, remark
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          employee.id,
          date,
          exceptionTypeId,
          hours,
          `${employee.name} ${date} ${exceptionType}${hours > 0 ? ' ' + hours + '小时' : ''}`
        ]
      );
    }
  }
  
  // 查询生成的记录数
  const countResult = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM attendance_records', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
  
  console.log(`已生成 ${countResult.count} 条考勤记录数据`);
}
