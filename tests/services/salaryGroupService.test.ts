/**
 * 薪酬组服务测试
 */

import { SalaryGroupServiceImpl } from '../../src/services/salaryGroupService.impl';
import { SalaryItemServiceImpl } from '../../src/services/salaryItemService.impl';
import { SalaryGroup, SalaryItem } from '../../src/services/payrollService';
import { Database } from '../../src/db/database';

describe('SalaryGroupService', () => {
  let service: SalaryGroupServiceImpl;
  let salaryItemService: SalaryItemServiceImpl;
  let db: Database;
  
  // 测试数据
  const testSalaryItems: Omit<SalaryItem, 'id'>[] = [
    {
      name: '基本工资',
      type: 'fixed',
      value: 5000,
      subsidyCycle: 1,
      isPreset: false,
      description: '基本工资'
    },
    {
      name: '绩效工资',
      type: 'percentage',
      value: 20, // 20%
      subsidyCycle: 1,
      isPreset: false,
      description: '绩效工资'
    },
    {
      name: '岗位津贴',
      type: 'fixed',
      value: 1000,
      subsidyCycle: 1,
      isPreset: false,
      description: '岗位津贴'
    },
    {
      name: '综合工资',
      type: 'formula',
      value: '${基本工资} + ${绩效工资} + ${岗位津贴}',
      subsidyCycle: 1,
      isPreset: false,
      description: '综合工资'
    }
  ];
  
  const testSalaryGroup: Omit<SalaryGroup, 'id'> = {
    name: '测试薪酬组',
    description: '测试用薪酬组',
    items: [] // 将在测试中填充
  };
  
  beforeAll(async () => {
    // 初始化数据库
    db = Database.getInstance();
    await db.initialize({ filename: ':memory:', memory: true });
    
    // 初始化服务
    service = new SalaryGroupServiceImpl();
    salaryItemService = new SalaryItemServiceImpl();
    
    // 创建测试薪酬项
    for (const item of testSalaryItems) {
      await salaryItemService.createSalaryItem(item);
    }
    
    // 获取创建的薪酬项
    const items = await salaryItemService.getAllSalaryItems();
    
    // 设置薪酬组项目
    testSalaryGroup.items = [
      { salaryItemId: items[0].id, calculationOrder: 1 }, // 基本工资
      { salaryItemId: items[1].id, calculationOrder: 2 }, // 绩效工资
      { salaryItemId: items[2].id, calculationOrder: 3 }, // 岗位津贴
      { salaryItemId: items[3].id, calculationOrder: 4 }  // 综合工资
    ];
  });
  
  afterAll(async () => {
    // 关闭数据库连接
    await db.close();
  });
  
  it('应该能创建薪酬组', async () => {
    const id = await service.createSalaryGroup(testSalaryGroup);
    expect(id).toBeGreaterThan(0);
    
    const group = await service.getSalaryGroupById(id);
    expect(group).not.toBeNull();
    expect(group?.name).toBe(testSalaryGroup.name);
    expect(group?.items.length).toBe(testSalaryGroup.items.length);
  });
  
  it('应该能获取所有薪酬组', async () => {
    const groups = await service.getAllSalaryGroups();
    expect(groups.length).toBeGreaterThan(0);
  });
  
  it('应该能更新薪酬组', async () => {
    const groups = await service.getAllSalaryGroups();
    const group = groups[0];
    
    const updatedGroup: Omit<SalaryGroup, 'id'> = {
      name: '更新后的薪酬组',
      description: '更新后的描述',
      items: group.items
    };
    
    await service.updateSalaryGroup(group.id, updatedGroup);
    
    const result = await service.getSalaryGroupById(group.id);
    expect(result?.name).toBe(updatedGroup.name);
    expect(result?.description).toBe(updatedGroup.description);
  });
  
  it('应该能验证薪酬组公式', async () => {
    const groups = await service.getAllSalaryGroups();
    const group = groups[0];
    
    const result = await service.validateSalaryGroupFormulas(group);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  it('应该能解析和计算公式', () => {
    const serviceImpl = service as SalaryGroupServiceImpl;
    
    // 测试解析公式
    const formula = '${基本工资} + ${绩效工资} * 2';
    const variables = {
      '基本工资': 5000,
      '绩效工资': 1000
    };
    
    const parsedFormula = serviceImpl.parseFormula(formula, variables);
    expect(parsedFormula).toBe('5000 + 1000 * 2');
    
    // 测试计算公式
    const result = serviceImpl.calculateFormula(formula, variables);
    expect(result).toBe(7000);
  });
  
  it('应该能检测到无效的公式引用', async () => {
    // 创建一个包含无效引用的薪酬项
    const invalidItem: Omit<SalaryItem, 'id'> = {
      name: '无效公式',
      type: 'formula',
      value: '${不存在的薪酬项} + 100',
      subsidyCycle: 1,
      isPreset: false,
      description: '包含无效引用的公式'
    };
    
    const itemId = await salaryItemService.createSalaryItem(invalidItem);
    
    // 创建包含无效公式的薪酬组
    const groups = await service.getAllSalaryGroups();
    const group = groups[0];
    
    const invalidGroup: SalaryGroup = {
      ...group,
      items: [...group.items, { salaryItemId: itemId, calculationOrder: 5 }]
    };
    
    const result = await service.validateSalaryGroupFormulas(invalidGroup);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  it('应该能检测到计算顺序问题', async () => {
    // 创建一个引用后面计算项的薪酬项
    const items = await salaryItemService.getAllSalaryItems();
    const basicSalaryItem = items.find(item => item.name === '基本工资');
    const performanceSalaryItem = items.find(item => item.name === '绩效工资');
    
    if (!basicSalaryItem || !performanceSalaryItem) {
      fail('测试薪酬项未找到');
      return;
    }
    
    // 创建包含计算顺序问题的薪酬组
    const invalidOrderGroup: SalaryGroup = {
      id: 999,
      name: '计算顺序问题组',
      description: '包含计算顺序问题的薪酬组',
      items: [
        { salaryItemId: performanceSalaryItem.id, calculationOrder: 2 },
        { salaryItemId: basicSalaryItem.id, calculationOrder: 1 }
      ]
    };
    
    // 修改绩效工资为引用基本工资的公式
    await salaryItemService.updateSalaryItem(performanceSalaryItem.id, {
      ...performanceSalaryItem,
      type: 'formula',
      value: '${基本工资} * 0.2'
    });
    
    const result = await service.validateSalaryGroupFormulas(invalidOrderGroup);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});