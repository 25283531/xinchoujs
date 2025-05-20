/**
 * 组织架构服务实现
 * 提供组织架构相关操作的具体实现
 */

import { OrganizationService } from './organizationService';
import { Department, OrganizationRepository, Position } from '../db/organizationRepository';
import { Database } from '../db/database';

export class OrganizationServiceImpl implements OrganizationService {
  private repository: OrganizationRepository;
  
  constructor() {
    this.repository = new OrganizationRepository('departments');
  }
  
  /**
   * 获取所有部门
   * @returns 部门列表
   */
  async getAllDepartments(): Promise<Department[]> {
    return this.repository.getAllDepartments();
  }
  
  /**
   * 获取部门详情
   * @param id 部门ID
   * @returns 部门信息
   */
  async getDepartmentById(id: number): Promise<Department | null> {
    return this.repository.getDepartmentById(id);
  }
  
  /**
   * 创建部门
   * @param department 部门信息
   * @returns 创建的部门ID
   */
  async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return this.repository.createDepartment(department);
  }
  
  /**
   * 更新部门
   * @param id 部门ID
   * @param department 部门信息
   * @returns 更新是否成功
   */
  async updateDepartment(id: number, department: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    return this.repository.updateDepartment(id, department);
  }
  
  /**
   * 删除部门
   * @param id 部门ID
   * @returns 删除是否成功
   */
  async deleteDepartment(id: number): Promise<boolean> {
    return this.repository.deleteDepartment(id);
  }
  
  /**
   * 获取所有职位
   * @returns 职位列表
   */
  async getAllPositions(): Promise<Position[]> {
    return this.repository.getAllPositions();
  }
  
  /**
   * 根据部门获取职位
   * @param departmentId 部门ID
   * @returns 职位列表
   */
  async getPositionsByDepartment(departmentId: number): Promise<Position[]> {
    return this.repository.getPositionsByDepartment(departmentId);
  }
  
  /**
   * 获取职位详情
   * @param id 职位ID
   * @returns 职位信息
   */
  async getPositionById(id: number): Promise<Position | null> {
    return this.repository.getPositionById(id);
  }
  
  /**
   * 创建职位
   * @param position 职位信息
   * @returns 创建的职位ID
   */
  async createPosition(position: Omit<Position, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return this.repository.createPosition(position);
  }
  
  /**
   * 更新职位
   * @param id 职位ID
   * @param position 职位信息
   * @returns 更新是否成功
   */
  async updatePosition(id: number, position: Partial<Omit<Position, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    return this.repository.updatePosition(id, position);
  }
  
  /**
   * 删除职位
   * @param id 职位ID
   * @returns 删除是否成功
   */
  async deletePosition(id: number): Promise<boolean> {
    return this.repository.deletePosition(id);
  }
}
