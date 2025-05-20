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
}