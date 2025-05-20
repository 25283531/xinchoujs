/**
 * 员工数据库仓库
 * 负责员工的数据库访问操作
 */

import { BaseRepository } from './baseRepository';
import { ErrorType, AppError } from '../utils/errorHandler';
import { checkTableExists, checkColumnExists } from './utils/dbUtils';

export interface Employee {
  id: number;
  employee_no: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  id_card?: string;
  phone?: string;
  email?: string;
  address?: string;
  department_id: number; // 存储时对应数据库中的department字段
  department_name?: string; // 非数据库字段，用于显示
  position_id: number; // 存储时对应数据库中的position字段
  position_name?: string; // 非数据库字段，用于显示
  entry_date: string;
  leave_date?: string;
  base_salary: number;
  salary_group_id?: number;
  social_insurance_group_id?: number;
  status: 'active' | 'inactive';
  remark?: string;
}

export class EmployeeRepository extends BaseRepository {
  constructor() {
    super('employees');
  }
  
  /**
   * 将数据库行映射为员工对象
   * @param row 数据库行
   * @returns 员工对象
   */
  protected mapToEntity(row: any): Employee {
    return {
      id: row.id,
      employee_no: row.employee_no,
      name: row.name,
      gender: row.gender as 'male' | 'female' | 'other',
      birth_date: row.birth_date,
      id_card: row.id_card,
      phone: row.phone,
      email: row.email,
      address: row.address,
      department_id: row.department, // 从数据库中的department字段映射到department_id
      department_name: row.department_name,
      position_id: row.position, // 从数据库中的position字段映射到position_id
      position_name: row.position_name,
      entry_date: row.entry_date,
      leave_date: row.leave_date,
      base_salary: row.base_salary,
      salary_group_id: row.salary_group_id,
      social_insurance_group_id: row.social_insurance_group_id,
      status: row.status === 1 || row.status === '1' ? 'active' : 'inactive',
      remark: row.remark
    };
  }

  /**
   * 获取所有员工
   * @returns 员工列表
   */
  public async getAllEmployees(): Promise<Employee[]> {
    const errorMsg = '获取所有员工列表失败';
    
    return this.safeExecute<Employee[]>(
      async () => {
        // 检查departments和positions表是否存在
        const departmentsExist = await checkTableExists(this.db, 'departments');
        const positionsExist = await checkTableExists(this.db, 'positions');
        
        let sql;
        if (departmentsExist && positionsExist) {
          // 如果两个表都存在，使用JOIN查询
          sql = `
            SELECT e.*, d.name as department_name, p.name as position_name 
            FROM ${this.tableName} e
            LEFT JOIN departments d ON e.department = d.id
            LEFT JOIN positions p ON e.position = p.id
            ORDER BY e.id
          `;
        } else {
          // 否则只查询员工表
          this.logger.warn('不存在departments或positions表，只查询基本员工信息');
          sql = `SELECT * FROM ${this.tableName} ORDER BY id`;
        }
        
        const rows = await this.db.all(sql);
        this.logger.dbOperation('QUERY', this.tableName, `成功查询 ${rows.length} 条员工记录`);
        return rows.map((row: any) => this.mapToEntity(row));
      },
      errorMsg,
      []
    );
  }

  /**
   * 根据部门ID获取员工
   * @param departmentId 部门ID
   * @returns 员工列表
   */
  public async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    const errorMsg = `根据部门ID ${departmentId} 获取员工失败`;
    
    return this.safeExecute<Employee[]>(
      async () => {
        // 检查departments和positions表是否存在
        const departmentsExist = await checkTableExists(this.db, 'departments');
        const positionsExist = await checkTableExists(this.db, 'positions');
        
        let sql;
        const params = [departmentId];
        
        if (departmentsExist && positionsExist) {
          // 如果两个表都存在，使用JOIN查询
          sql = `
            SELECT e.*, d.name as department_name, p.name as position_name 
            FROM ${this.tableName} e
            LEFT JOIN departments d ON e.department = d.id
            LEFT JOIN positions p ON e.position = p.id
            WHERE e.department = ?
            ORDER BY e.id
          `;
        } else {
          // 否则只查询员工表
          this.logger.warn('不存在departments或positions表，只查询基本员工信息');
          sql = `SELECT * FROM ${this.tableName} WHERE department = ? ORDER BY id`;
        }
        
        const rows = await this.db.all(sql, params);
        this.logger.dbOperation('QUERY', this.tableName, `根据部门ID ${departmentId} 成功查询 ${rows.length} 条员工记录`);
        return rows.map((row: any) => this.mapToEntity(row));
      },
      errorMsg,
      []
    );
  }

  /**
   * 根据ID获取员工
   * @param id 员工ID
   * @returns 员工
   */
  public async getEmployeeById(id: number): Promise<Employee | null> {
    const errorMsg = `根据ID ${id} 获取员工失败`;
    
    return this.safeExecute<Employee | null>(
      async () => {
        // 检查departments和positions表是否存在
        const departmentsExist = await checkTableExists(this.db, 'departments');
        const positionsExist = await checkTableExists(this.db, 'positions');
        
        let sql;
        const params = [id];
        
        if (departmentsExist && positionsExist) {
          // 如果两个表都存在，使用JOIN查询
          sql = `
            SELECT e.*, d.name as department_name, p.name as position_name 
            FROM ${this.tableName} e
            LEFT JOIN departments d ON e.department = d.id
            LEFT JOIN positions p ON e.position = p.id
            WHERE e.id = ?
          `;
        } else {
          // 否则只查询员工表
          this.logger.warn('不存在departments或positions表，只查询基本员工信息');
          sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        }
        
        const row = await this.db.get(sql, params);
        
        if (!row) {
          this.logger.info(`没有找到ID为 ${id} 的员工`);
          return null;
        }
        
        this.logger.dbOperation('QUERY', this.tableName, `成功查询员工 ID ${id}`);
        return this.mapToEntity(row);
      },
      errorMsg,
      null
    );
  }

  /**
   * 创建员工
   * @param employee 员工信息
   * @returns 创建的员工ID
   */
  public async createEmployee(employee: Omit<Employee, 'id' | 'department_name' | 'position_name'>): Promise<number> {
    const errorMsg = `创建员工 ${employee.name} 失败`;
    
    return this.safeExecute<number>(
      async () => {
        // 检查字段映射 - 在数据库中需要将department_id映射为department，将position_id映射为position
        
        // 准备插入数据
        const columnMapping: Record<string, string> = {
          'department_id': 'department',  // 映射到数据库中的实际字段名
          'position_id': 'position'      // 映射到数据库中的实际字段名
        };
        
        const columns: string[] = [
          'employee_no', 'name', 'gender', 'birth_date', 'id_card', 'phone', 'email', 'address',
          'department', 'position', 'entry_date', 'leave_date', 'base_salary',
          'salary_group_id', 'social_insurance_group_id', 'status', 'remark'
        ];
        
        const values: any[] = [
          employee.employee_no,
          employee.name,
          employee.gender,
          employee.birth_date || null,
          employee.id_card || null,
          employee.phone || null,
          employee.email || null,
          employee.address || null,
          employee.department_id,  // 映射到department字段
          employee.position_id,    // 映射到position字段
          employee.entry_date,
          employee.leave_date || null,
          employee.base_salary,
          employee.salary_group_id || null,
          employee.social_insurance_group_id || null,
          employee.status,
          employee.remark || null
        ];
        
        // 构建插入SQL
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        // 执行插入操作
        const result = await this.db.run(sql, values);
        this.logger.dbOperation('INSERT', this.tableName, `成功创建员工 ${employee.name}`);
        return result.lastID;
      },
      errorMsg,
      0 // 默认为0，表示创建失败
    );
  }

  /**
   * 更新员工
   * @param id 员工ID
   * @param employee 员工信息
   * @returns 更新是否成功
   */
  public async updateEmployee(id: number, employee: Partial<Omit<Employee, 'id' | 'department_name' | 'position_name'>>): Promise<boolean> {
    const errorMsg = `更新员工 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 先查找员工是否存在
        const existingEmployee = await this.getEmployeeById(id);
        if (!existingEmployee) {
          this.logger.warn(`要更新的员工 ID ${id} 不存在`);
          throw new AppError(`员工 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 构建更新语句
        const updateFields: string[] = [];
        const params: any[] = [];
        
        if (employee.employee_no !== undefined) {
          updateFields.push('employee_no = ?');
          params.push(employee.employee_no);
        }
        
        if (employee.name !== undefined) {
          updateFields.push('name = ?');
          params.push(employee.name);
        }
        
        if (employee.gender !== undefined) {
          updateFields.push('gender = ?');
          params.push(employee.gender);
        }
        
        if (employee.birth_date !== undefined) {
          updateFields.push('birth_date = ?');
          params.push(employee.birth_date || null);
        }
        
        if (employee.id_card !== undefined) {
          updateFields.push('id_card = ?');
          params.push(employee.id_card || null);
        }
        
        if (employee.phone !== undefined) {
          updateFields.push('phone = ?');
          params.push(employee.phone || null);
        }
        
        if (employee.email !== undefined) {
          updateFields.push('email = ?');
          params.push(employee.email || null);
        }
        
        if (employee.address !== undefined) {
          updateFields.push('address = ?');
          params.push(employee.address || null);
        }
        
        // 注意这里的字段映射 - department_id存入department字段
        if (employee.department_id !== undefined) {
          updateFields.push('department = ?');
          params.push(employee.department_id);
        }
        
        // 注意这里的字段映射 - position_id存入position字段
        if (employee.position_id !== undefined) {
          updateFields.push('position = ?');
          params.push(employee.position_id);
        }
        
        if (employee.entry_date !== undefined) {
          updateFields.push('entry_date = ?');
          params.push(employee.entry_date);
        }
        
        if (employee.leave_date !== undefined) {
          updateFields.push('leave_date = ?');
          params.push(employee.leave_date || null);
        }
        
        if (employee.base_salary !== undefined) {
          updateFields.push('base_salary = ?');
          params.push(employee.base_salary);
        }
        
        if (employee.salary_group_id !== undefined) {
          updateFields.push('salary_group_id = ?');
          params.push(employee.salary_group_id || null);
        }
        
        if (employee.social_insurance_group_id !== undefined) {
          updateFields.push('social_insurance_group_id = ?');
          params.push(employee.social_insurance_group_id || null);
        }
        
        if (employee.status !== undefined) {
          updateFields.push('status = ?');
          params.push(employee.status);
        }
        
        if (employee.remark !== undefined) {
          updateFields.push('remark = ?');
          params.push(employee.remark || null);
        }
        
        if (updateFields.length === 0) {
          this.logger.info(`没有需要更新的字段，员工ID: ${id}`);
          return true; // 没有需要更新的字段，但不是错误
        }
        
        // 添加ID参数
        params.push(id);
        
        // 执行更新操作
        await this.db.run(
          `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`,
          params
        );
        
        this.logger.dbOperation('UPDATE', this.tableName, `成功更新员工 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }

  /**
   * 删除员工
   * @param id 员工ID
   * @returns 是否成功删除
   */
  public async deleteEmployee(id: number): Promise<boolean> {
    const errorMsg = `删除员工 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 先查找员工是否存在
        const existingEmployee = await this.getEmployeeById(id);
        if (!existingEmployee) {
          this.logger.warn(`要删除的员工 ID ${id} 不存在`);
          throw new AppError(`员工 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 执行删除操作
        await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        
        this.logger.dbOperation('DELETE', this.tableName, `成功删除员工 ID ${id}`);
        return true;
      },
      errorMsg,
      false
    );
  }


}