/**
 * 组织架构数据访问层
 * 提供部门和职位的数据库操作
 */

import { BaseRepository } from './baseRepository';
import { AppError, ErrorType } from '../utils/errorHandler';

// 部门接口
export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// 职位接口
export interface Position {
  id: number;
  name: string;
  department_id: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export class OrganizationRepository extends BaseRepository {
  protected tableName = 'departments'; // 默认表名为部门表
  
  /**
   * 将数据库行映射为实体对象
   * @param row 数据库行
   * @returns 实体对象
   */
  protected mapToEntity(row: any): any {
    if (!row) return null;
    
    if (row.department_name) {
      // 这是带有部门名称的职位行
      return {
        id: row.id,
        name: row.name,
        department_id: row.department_id,
        department_name: row.department_name,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } else if (row.department_id) {
      // 这是普通职位行
      return {
        id: row.id,
        name: row.name,
        department_id: row.department_id,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } else {
      // 这是部门行
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }
  }
  
  /**
   * 获取所有部门
   * @returns 部门列表
   */
  public async getAllDepartments(): Promise<Department[]> {
    const errorMsg = '获取部门列表失败';
    
    return this.safeExecute<Department[]>(
      async () => {
        const sql = `SELECT * FROM departments ORDER BY id`;
        const rows = await this.db.all(sql);
        this.logger.dbOperation('QUERY', 'departments', `成功查询 ${rows.length} 个部门`);
        return rows;
      },
      errorMsg,
      []
    );
  }
  
  /**
   * 获取部门详情
   * @param id 部门ID
   * @returns 部门信息
   */
  public async getDepartmentById(id: number): Promise<Department | null> {
    const errorMsg = `获取部门 ID ${id} 详情失败`;
    
    return this.safeExecute<Department | null>(
      async () => {
        const sql = `SELECT * FROM departments WHERE id = ?`;
        const row = await this.db.get(sql, [id]);
        if (row) {
          this.logger.dbOperation('QUERY', 'departments', `成功查询部门 ID ${id}`);
        }
        return row || null;
      },
      errorMsg,
      null
    );
  }
  
  /**
   * 创建部门
   * @param department 部门信息
   * @returns 创建的部门ID
   */
  public async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const errorMsg = `创建部门 ${department.name} 失败`;
    
    return this.safeExecute<number>(
      async () => {
        // 检查同名部门是否存在
        const existingDept = await this.db.get('SELECT * FROM departments WHERE name = ?', [department.name]);
        if (existingDept) {
          throw new AppError(`部门 ${department.name} 已存在`, ErrorType.VALIDATION_ERROR);
        }
        
        const sql = `
          INSERT INTO departments (name, description)
          VALUES (?, ?)
        `;
        const result = await this.db.run(sql, [
          department.name,
          department.description || null
        ]);
        
        this.logger.dbOperation('INSERT', 'departments', `成功创建部门 ${department.name}`);
        return result.lastID;
      },
      errorMsg,
      0
    );
  }
  
  /**
   * 更新部门
   * @param id 部门ID
   * @param department 部门信息
   * @returns 更新是否成功
   */
  public async updateDepartment(id: number, department: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const errorMsg = `更新部门 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 获取要更新的部门
        const existingDept = await this.getDepartmentById(id);
        if (!existingDept) {
          throw new AppError(`部门 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 如果更新名称，检查是否与其他部门重名
        if (department.name && department.name !== existingDept.name) {
          const nameExists = await this.db.get('SELECT id FROM departments WHERE name = ? AND id != ?', [department.name, id]);
          if (nameExists) {
            throw new AppError(`部门名称 ${department.name} 已存在`, ErrorType.VALIDATION_ERROR);
          }
        }
        
        const updateFields = [];
        const params = [];
        
        if (department.name !== undefined) {
          updateFields.push('name = ?');
          params.push(department.name);
        }
        
        if (department.description !== undefined) {
          updateFields.push('description = ?');
          params.push(department.description);
        }
        
        // 更新时间
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        
        if (updateFields.length === 0) {
          return true; // 没有字段需要更新
        }
        
        params.push(id);
        
        const sql = `
          UPDATE departments
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        
        await this.db.run(sql, params);
        this.logger.dbOperation('UPDATE', 'departments', `成功更新部门 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }
  
  /**
   * 删除部门
   * @param id 部门ID
   * @returns 删除是否成功
   */
  public async deleteDepartment(id: number): Promise<boolean> {
    const errorMsg = `删除部门 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 检查部门是否存在
        const dept = await this.getDepartmentById(id);
        if (!dept) {
          throw new AppError(`部门 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 检查部门是否有职位
        const positions = await this.getPositionsByDepartment(id);
        if (positions.length > 0) {
          throw new AppError(`部门"${dept.name}"下有 ${positions.length} 个职位，无法删除`, ErrorType.VALIDATION_ERROR);
        }
        
        // 检查部门是否有关联员工
        const employees = await this.db.all('SELECT id FROM employees WHERE department = ?', [id]);
        if (employees.length > 0) {
          throw new AppError(`部门"${dept.name}"下有 ${employees.length} 名员工，无法删除`, ErrorType.VALIDATION_ERROR);
        }
        
        await this.db.run('DELETE FROM departments WHERE id = ?', [id]);
        this.logger.dbOperation('DELETE', 'departments', `成功删除部门 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }
  
  /**
   * 获取所有职位
   * @returns 职位列表
   */
  public async getAllPositions(): Promise<Position[]> {
    const errorMsg = '获取职位列表失败';
    
    return this.safeExecute<Position[]>(
      async () => {
        const sql = `
          SELECT p.*, d.name as department_name
          FROM positions p
          LEFT JOIN departments d ON p.department_id = d.id
          ORDER BY p.department_id, p.id
        `;
        const rows = await this.db.all(sql);
        this.logger.dbOperation('QUERY', 'positions', `成功查询 ${rows.length} 个职位`);
        return rows;
      },
      errorMsg,
      []
    );
  }
  
  /**
   * 根据部门获取职位
   * @param departmentId 部门ID
   * @returns 职位列表
   */
  public async getPositionsByDepartment(departmentId: number): Promise<Position[]> {
    const errorMsg = `获取部门 ID ${departmentId} 的职位列表失败`;
    
    return this.safeExecute<Position[]>(
      async () => {
        const sql = `
          SELECT * FROM positions
          WHERE department_id = ?
          ORDER BY id
        `;
        const rows = await this.db.all(sql, [departmentId]);
        this.logger.dbOperation('QUERY', 'positions', `成功查询部门 ID ${departmentId} 的 ${rows.length} 个职位`);
        return rows;
      },
      errorMsg,
      []
    );
  }
  
  /**
   * 获取职位详情
   * @param id 职位ID
   * @returns 职位信息
   */
  public async getPositionById(id: number): Promise<Position | null> {
    const errorMsg = `获取职位 ID ${id} 详情失败`;
    
    return this.safeExecute<Position | null>(
      async () => {
        const sql = `
          SELECT p.*, d.name as department_name
          FROM positions p
          LEFT JOIN departments d ON p.department_id = d.id
          WHERE p.id = ?
        `;
        const row = await this.db.get(sql, [id]);
        if (row) {
          this.logger.dbOperation('QUERY', 'positions', `成功查询职位 ID ${id}`);
        }
        return row || null;
      },
      errorMsg,
      null
    );
  }
  
  /**
   * 创建职位
   * @param position 职位信息
   * @returns 创建的职位ID
   */
  public async createPosition(position: Omit<Position, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const errorMsg = `创建职位 ${position.name} 失败`;
    
    return this.safeExecute<number>(
      async () => {
        // 检查部门是否存在
        const dept = await this.getDepartmentById(position.department_id);
        if (!dept) {
          throw new AppError(`部门 ID ${position.department_id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 检查同部门下是否有同名职位
        const existingPos = await this.db.get(
          'SELECT * FROM positions WHERE name = ? AND department_id = ?', 
          [position.name, position.department_id]
        );
        if (existingPos) {
          throw new AppError(`部门"${dept.name}"下已存在职位"${position.name}"`, ErrorType.VALIDATION_ERROR);
        }
        
        const sql = `
          INSERT INTO positions (name, department_id, description)
          VALUES (?, ?, ?)
        `;
        const result = await this.db.run(sql, [
          position.name,
          position.department_id,
          position.description || null
        ]);
        
        this.logger.dbOperation('INSERT', 'positions', `成功创建职位 ${position.name}`);
        return result.lastID;
      },
      errorMsg,
      0
    );
  }
  
  /**
   * 更新职位
   * @param id 职位ID
   * @param position 职位信息
   * @returns 更新是否成功
   */
  public async updatePosition(id: number, position: Partial<Omit<Position, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const errorMsg = `更新职位 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 获取要更新的职位
        const existingPos = await this.getPositionById(id);
        if (!existingPos) {
          throw new AppError(`职位 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 如果更新部门，检查部门是否存在
        if (position.department_id && position.department_id !== existingPos.department_id) {
          const dept = await this.getDepartmentById(position.department_id);
          if (!dept) {
            throw new AppError(`部门 ID ${position.department_id} 不存在`, ErrorType.VALIDATION_ERROR);
          }
        }
        
        // 如果更新名称或部门，检查是否与其他职位冲突
        if ((position.name && position.name !== existingPos.name) || 
            (position.department_id && position.department_id !== existingPos.department_id)) {
          const deptId = position.department_id || existingPos.department_id;
          const posName = position.name || existingPos.name;
          
          const nameExists = await this.db.get(
            'SELECT id FROM positions WHERE name = ? AND department_id = ? AND id != ?', 
            [posName, deptId, id]
          );
          if (nameExists) {
            throw new AppError(`该部门下已存在职位"${posName}"`, ErrorType.VALIDATION_ERROR);
          }
        }
        
        const updateFields = [];
        const params = [];
        
        if (position.name !== undefined) {
          updateFields.push('name = ?');
          params.push(position.name);
        }
        
        if (position.department_id !== undefined) {
          updateFields.push('department_id = ?');
          params.push(position.department_id);
        }
        
        if (position.description !== undefined) {
          updateFields.push('description = ?');
          params.push(position.description);
        }
        
        // 更新时间
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        
        if (updateFields.length === 0) {
          return true; // 没有字段需要更新
        }
        
        params.push(id);
        
        const sql = `
          UPDATE positions
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        
        await this.db.run(sql, params);
        this.logger.dbOperation('UPDATE', 'positions', `成功更新职位 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }
  
  /**
   * 删除职位
   * @param id 职位ID
   * @returns 删除是否成功
   */
  public async deletePosition(id: number): Promise<boolean> {
    const errorMsg = `删除职位 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 检查职位是否存在
        const pos = await this.getPositionById(id);
        if (!pos) {
          throw new AppError(`职位 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 检查职位是否有关联员工
        const employees = await this.db.all('SELECT id FROM employees WHERE position = ?', [id]);
        if (employees.length > 0) {
          throw new AppError(`职位"${pos.name}"下有 ${employees.length} 名员工，无法删除`, ErrorType.VALIDATION_ERROR);
        }
        
        await this.db.run('DELETE FROM positions WHERE id = ?', [id]);
        this.logger.dbOperation('DELETE', 'positions', `成功删除职位 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }
}
