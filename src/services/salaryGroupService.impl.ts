/**
 * 薪酬组服务实现类
 * 实现薪酬组的管理功能，包括薪酬组的CRUD操作和与薪酬项的关联
 */

import { SalaryGroupService } from './salaryGroupService';
import { SalaryGroupRepository } from '../db/salaryGroupRepository';
import { SalaryItemServiceImpl } from './salaryItemService.impl';
import type { SalaryItemService } from './salaryItemService';
import { SalaryGroup, SalaryItem } from './payrollService';
import { Database } from '../db/database';

export class SalaryGroupServiceImpl extends SalaryGroupService {
  private repository: SalaryGroupRepository;
  private salaryItemService: SalaryItemServiceImpl;
  private db: Database;

  constructor() {
    super();
    this.repository = new SalaryGroupRepository();
    this.salaryItemService = new SalaryItemServiceImpl();
    this.db = Database.getInstance();
  }

  /**
   * 获取所有薪酬组
   * @returns 薪酬组列表
   */
  public async getAllSalaryGroups(): Promise<SalaryGroup[]> {
    return this.repository.getAllSalaryGroups();
  }

  /**
   * 根据ID获取薪酬组
   * @param id 薪酬组ID
   * @returns 薪酬组
   */
  public async getSalaryGroupById(id: number): Promise<SalaryGroup | null> {
    return this.repository.getSalaryGroupById(id);
  }

  /**
   * 创建薪酬组
   * @param salaryGroup 薪酬组数据
   * @returns 创建的薪酬组ID
   */
  public async createSalaryGroup(salaryGroup: Omit<SalaryGroup, 'id'>): Promise<number> {
    // 验证薪酬组公式
    const validationResult = await this.validateSalaryGroupFormulas(salaryGroup as SalaryGroup);
    if (!validationResult.isValid) {
      throw new Error(`薪酬组公式验证失败: ${validationResult.errors.join(', ')}`);
    }
    
    return this.repository.createSalaryGroup(salaryGroup);
  }

  /**
   * 更新薪酬组
   * @param id 薪酬组ID
   * @param salaryGroup 薪酬组数据
   */
  public async updateSalaryGroup(id: number, salaryGroup: Omit<SalaryGroup, 'id'>): Promise<void> {
    // 验证薪酬组公式
    const validationResult = await this.validateSalaryGroupFormulas({...salaryGroup, id} as SalaryGroup);
    if (!validationResult.isValid) {
      throw new Error(`薪酬组公式验证失败: ${validationResult.errors.join(', ')}`);
    }
    
    await this.repository.updateSalaryGroup(id, salaryGroup);
  }

  /**
   * 删除薪酬组
   * @param id 薪酬组ID
   */
  public async deleteSalaryGroup(id: number): Promise<void> {
    // 检查是否有员工使用此薪酬组
    const connection = this.db.getConnection();
    const employees: Array<{id: number; name: string}> = await connection.all('SELECT id, name FROM employees WHERE salary_group_id = ?', [id]);
    
    if (employees.length > 0) {
      const employeeNames = employees.map(e => e.name).join(', ');
      throw new Error(`无法删除薪酬组，以下员工正在使用: ${employeeNames}`);
    }
    
    await this.repository.deleteSalaryGroup(id);
  }

  /**
   * 分配薪酬组给员工
   * @param employeeId 员工ID
   * @param salaryGroupId 薪酬组ID
   */
  public async assignSalaryGroupToEmployee(employeeId: number, salaryGroupId: number): Promise<void> {
    const connection = this.db.getConnection();
    
    // 检查薪酬组是否存在
    const salaryGroup = await this.getSalaryGroupById(salaryGroupId);
    if (!salaryGroup) {
      throw new Error(`薪酬组不存在: ID ${salaryGroupId}`);
    }
    
    // 检查员工是否存在
    const employee = await connection.get('SELECT id FROM employees WHERE id = ?', [employeeId]);
    if (!employee) {
      throw new Error(`员工不存在: ID ${employeeId}`);
    }
    
    // 更新员工的薪酬组
    await connection.run(
      'UPDATE employees SET salary_group_id = ? WHERE id = ?',
      [salaryGroupId, employeeId]
    );
  }

  /**
   * 分配薪酬组给部门
   * @param department 部门名称
   * @param salaryGroupId 薪酬组ID
   */
  public async assignSalaryGroupToDepartment(department: string, salaryGroupId: number): Promise<void> {
    const connection = this.db.getConnection();
    
    // 检查薪酬组是否存在
    const salaryGroup = await this.getSalaryGroupById(salaryGroupId);
    if (!salaryGroup) {
      throw new Error(`薪酬组不存在: ID ${salaryGroupId}`);
    }
    
    // 检查部门是否存在
    const departmentExists = await connection.get('SELECT COUNT(*) as count FROM employees WHERE department = ?', [department]);
    if (departmentExists.count === 0) {
      throw new Error(`部门不存在: ${department}`);
    }
    
    // 更新部门员工的薪酬组（仅更新没有单独设置薪酬组的员工）
    await connection.run(
      'UPDATE employees SET salary_group_id = ? WHERE department = ? AND salary_group_id IS NULL',
      [salaryGroupId, department]
    );
  }

  /**
   * 分配薪酬组给职位
   * @param position 职位名称
   * @param salaryGroupId 薪酬组ID
   */
  public async assignSalaryGroupToPosition(position: string, salaryGroupId: number): Promise<void> {
    const connection = this.db.getConnection();
    
    // 检查薪酬组是否存在
    const salaryGroup = await this.getSalaryGroupById(salaryGroupId);
    if (!salaryGroup) {
      throw new Error(`薪酬组不存在: ID ${salaryGroupId}`);
    }
    
    // 检查职位是否存在
    const positionExists = await connection.get('SELECT COUNT(*) as count FROM employees WHERE position = ?', [position]);
    if (positionExists.count === 0) {
      throw new Error(`职位不存在: ${position}`);
    }
    
    // 更新职位员工的薪酬组（仅更新没有单独设置薪酬组的员工）
    await connection.run(
      'UPDATE employees SET salary_group_id = ? WHERE position = ? AND salary_group_id IS NULL',
      [salaryGroupId, position]
    );
  }

  /**
   * 验证薪酬组公式
   * 检查薪酬组中的公式是否有效，包括变量引用和计算顺序
   * @param salaryGroup 薪酬组数据
   * @returns 验证结果，包含是否有效和错误信息
   */
  public async validateSalaryGroupFormulas(salaryGroup: SalaryGroup): Promise<{isValid: boolean; errors: string[]}> {
    const errors: string[] = [];
    
    // 获取薪酬组中的所有薪酬项
    const salaryItemIds = salaryGroup.items.map(item => item.salaryItemId);
    const salaryItems: Record<number, SalaryItem> = {};
    
    for (const itemId of salaryItemIds) {
      const item = await this.salaryItemService.getSalaryItemById(itemId);
      if (!item) {
        errors.push(`薪酬项不存在: ID ${itemId}`);
        continue;
      }
      salaryItems[itemId] = item;
    }
    
    // 检查计算顺序是否合理
    const calculationOrder = new Map<number, number>();
    for (const item of salaryGroup.items) {
      calculationOrder.set(item.salaryItemId, item.calculationOrder);
    }
    
    // 检查公式类型的薪酬项
    for (const item of salaryGroup.items) {
      const salaryItem = salaryItems[item.salaryItemId];
      if (!salaryItem) continue;
      
      if (salaryItem.type === 'formula') {
        // 解析公式中的变量引用
        const formula = String(salaryItem.value);
        const variablePattern = /\$\{([^}]+)\}/g;
        let match;
        
        while ((match = variablePattern.exec(formula)) !== null) {
          const variableName = match[1];
          
          // 查找变量对应的薪酬项
          let found = false;
          let referencedItemId = -1;
          
          for (const [id, item] of Object.entries(salaryItems)) {
            if (item.name === variableName) {
              found = true;
              referencedItemId = Number(id);
              break;
            }
          }
          
          if (!found) {
            errors.push(`薪酬项 "${salaryItem.name}" 的公式引用了不存在的变量: ${variableName}`);
            continue;
          }
          
          // 检查引用的薪酬项是否在当前项之前计算
          const currentOrder = calculationOrder.get(item.salaryItemId) || 0;
          const referencedOrder = calculationOrder.get(referencedItemId) || 0;
          
          if (referencedOrder >= currentOrder) {
            errors.push(`薪酬项 "${salaryItem.name}" 引用了计算顺序在其后的薪酬项 "${variableName}"，可能导致计算错误`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 解析薪酬项公式
   * 将公式中的变量替换为实际值
   * @param formula 公式字符串
   * @param variables 变量值映射
   * @returns 解析后的公式
   */
  public parseFormula(formula: string, variables: Record<string, number>): string {
    return formula.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
      if (variables[variableName] !== undefined) {
        return variables[variableName].toString();
      }
      return '0'; // 默认值
    });
  }

  /**
   * 计算公式结果
   * @param formula 公式字符串
   * @param variables 变量值映射
   * @returns 计算结果
   */
  public calculateFormula(formula: string, variables: Record<string, number>): number {
    try {
      const parsedFormula = this.parseFormula(formula, variables);
      // 使用 Function 构造函数安全地计算公式
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${parsedFormula}`)();
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error('公式计算错误:', error);
      return 0;
    }
  }
}