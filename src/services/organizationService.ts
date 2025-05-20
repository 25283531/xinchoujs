/**
 * 组织架构服务接口
 * 定义组织架构相关操作
 */

import { Department, Position } from '../db/organizationRepository';

export interface OrganizationService {
  // 部门相关操作
  getAllDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | null>;
  createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  updateDepartment(id: number, department: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // 职位相关操作
  getAllPositions(): Promise<Position[]>;
  getPositionsByDepartment(departmentId: number): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | null>;
  createPosition(position: Omit<Position, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  updatePosition(id: number, position: Partial<Omit<Position, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean>;
  deletePosition(id: number): Promise<boolean>;
}
