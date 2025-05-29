/**
 * 员工服务
 * 负责员工的业务逻辑处理
 */

import { Employee, EmployeeRepository } from '../db/employeeRepository';

export interface IEmployeeService {
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(departmentId: number): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | null>;
  createEmployee(employee: Omit<Employee, 'id' | 'department_name' | 'position_name'>): Promise<number>;
  updateEmployee(id: number, employee: Partial<Omit<Employee, 'id' | 'department_name' | 'position_name'>>): Promise<void>;
  deleteEmployee(id: number): Promise<void>;
  batchImportEmployees(employees: Omit<Employee, 'id' | 'department_name' | 'position_name'>[]): Promise<{success: number, failures: number}>;
}

export class EmployeeServiceImpl implements IEmployeeService {
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * 获取所有员工
   * @returns 员工列表
   */
  public async getAllEmployees(): Promise<Employee[]> {
    return this.employeeRepository.getAllEmployees();
  }

  /**
   * 根据部门ID获取员工
   * @param departmentId 部门ID
   * @returns 员工列表
   */
  public async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return this.employeeRepository.getEmployeesByDepartment(departmentId);
  }

  /**
   * 根据ID获取员工
   * @param id 员工ID
   * @returns 员工
   */
  public async getEmployeeById(id: number): Promise<Employee | null> {
    return this.employeeRepository.getEmployeeById(id);
  }

  /**
   * 创建员工
   * @param employee 员工信息
   * @returns 创建的员工ID
   */
  public async createEmployee(employee: Omit<Employee, 'id' | 'department_name' | 'position_name'>): Promise<number> {
    return this.employeeRepository.createEmployee(employee);
  }

  /**
   * 更新员工
   * @param id 员工ID
   * @param employee 员工信息
   */
  public async updateEmployee(id: number, employee: Partial<Omit<Employee, 'id' | 'department_name' | 'position_name'>>): Promise<void> {
    await this.employeeRepository.updateEmployee(id, employee);
  }

  /**
   * 删除员工
   * @param id 员工ID
   */
  public async deleteEmployee(id: number): Promise<void> {
    await this.employeeRepository.deleteEmployee(id);
  }
  
  /**
   * 批量导入员工
   * @param employees 员工信息数组
   * @returns 成功和失败的数量
   */
  public async batchImportEmployees(employees: Omit<Employee, 'id' | 'department_name' | 'position_name'>[]): Promise<{success: number, failures: number}> {
    console.log(`[EmployeeService] 开始批量导入 ${employees.length} 名员工`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // 预先获取所有员工工号，用于检查是否已存在
    const allEmployees = await this.getAllEmployees();
    const existingEmployeeNos = new Map<string, number>();
    
    // 创建工号到ID的映射，用于更新已存在的员工
    allEmployees.forEach(emp => {
      if (emp.employee_no) {
        existingEmployeeNos.set(emp.employee_no.toString(), emp.id);
      }
    });
    
    console.log(`[EmployeeService] 当前系统中有 ${existingEmployeeNos.size} 名员工记录`);
    
    // 逐个处理每个员工记录
    for (const employee of employees) {
      try {
        // 验证必要字段
        if (!employee.name || !employee.employee_no) {
          console.warn('[EmployeeService] 跳过无效员工记录:', employee);
          failureCount++;
          continue;
        }
        
        // 检查员工是否已存在（基于工号）
        const employeeNo = employee.employee_no.toString();
        if (existingEmployeeNos.has(employeeNo)) {
          // 员工已存在，执行更新操作
          const existingId = existingEmployeeNos.get(employeeNo)!;
          await this.updateEmployee(existingId, employee);
          successCount++;
          console.log(`[EmployeeService] 更新已存在员工: ${employee.name} (ID: ${existingId})`);
        } else {
          // 员工不存在，执行创建操作
          const newId = await this.createEmployee(employee);
          // 更新映射，以防后续有重复工号
          existingEmployeeNos.set(employeeNo, newId);
          successCount++;
          console.log(`[EmployeeService] 成功导入新员工: ${employee.name} (ID: ${newId})`);
        }
      } catch (error: any) {
        failureCount++;
        // 输出更详细的错误信息
        console.error(`[EmployeeService] 导入员工失败: ${employee.name || '未知姓名'}, 工号: ${employee.employee_no || '未知工号'}`, error);
      }
    }
    
    console.log(`[EmployeeService] 批量导入完成，成功: ${successCount}, 失败: ${failureCount}`);
    return { success: successCount, failures: failureCount };
  }
}