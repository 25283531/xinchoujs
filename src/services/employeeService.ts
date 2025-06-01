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
   * 验证员工数据
   * @param employee 员工数据
   * @returns 验证结果
   */
  private validateEmployeeData(employee: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];
    
    // 检查必填字段
    if (!employee.name) {
      errors.push('姓名不能为空');
    }
    
    if (!employee.employee_no) {
      errors.push('工号不能为空');
    }
    // 工号标准化处理（去除空格并大写）
    if (employee.employee_no && typeof employee.employee_no === 'string') {
      employee.employee_no = employee.employee_no.trim().toUpperCase();
    }
    // 检查工号格式（只允许字母和数字的组合）
    if (employee.employee_no && !/^[A-Za-z0-9]+$/.test(employee.employee_no)) {
      errors.push('工号格式不正确，只能包含字母和数字');
    }
    
    // 处理入职日期格式
    if (employee.entry_date) {
      let dateValue = employee.entry_date.toString().trim();
      
      // 检查是否为yyyy-mm格式
      if (/^\d{4}-\d{2}$/.test(dateValue)) {
        // 自动转换为yyyy-mm-01格式
        employee.entry_date = `${dateValue}-01`;
        console.log(`[EmployeeService] 自动转换入职日期格式(yyyy-mm): ${employee.entry_date}`);
      }
      // 检查是否为yyyy/mm/dd格式
      else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateValue)) {
        const parts = dateValue.split('/');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        employee.entry_date = `${year}-${month}-${day}`;
        console.log(`[EmployeeService] 自动转换入职日期格式(yyyy/mm/dd): ${employee.entry_date}`);
      }
      // 检查是否为yyyy.mm.dd格式
      else if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateValue)) {
        const parts = dateValue.split('.');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        employee.entry_date = `${year}-${month}-${day}`;
        console.log(`[EmployeeService] 自动转换入职日期格式(yyyy.mm.dd): ${employee.entry_date}`);
      }
      // 检查是否为xx/xx/yyyy格式（可能是dd/mm/yyyy或mm/dd/yyyy）
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
        const parts = dateValue.split('/');
        const firstPart = parseInt(parts[0]);
        const secondPart = parseInt(parts[1]);
        const year = parts[2];
        
        // 智能判断日期格式
        // 如果第一部分>12，那么肯定是日，否则假设是月（中国习惯）
        let month, day;
        if (firstPart > 12) {
          // 肯定是dd/mm/yyyy格式
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          console.log(`[EmployeeService] 检测到dd/mm/yyyy格式`);
        } else if (secondPart > 12) {
          // 肯定是mm/dd/yyyy格式
          month = parts[0].padStart(2, '0');
          day = parts[1].padStart(2, '0');
          console.log(`[EmployeeService] 检测到mm/dd/yyyy格式`);
        } else {
          // 两者都可能，默认使用中国习惯的日/月/年格式
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          console.log(`[EmployeeService] 无法确定日期格式，默认使用dd/mm/yyyy格式`);
        }
        
        employee.entry_date = `${year}-${month}-${day}`;
        console.log(`[EmployeeService] 自动转换入职日期格式(xx/xx/yyyy): ${employee.entry_date}`);
      }
      // 检查是否为Excel序列号格式（数字）
      else if (/^\d+(\.\d+)?$/.test(dateValue)) {
        try {
          // Excel日期是从1900-01-01开始的天数
          // 将Excel序列号转换为JavaScript日期
          const excelEpoch = new Date(1899, 11, 30); // Excel的起始日期是1900-01-01，但有一个1900年不是闰年的bug
          const daysSinceEpoch = parseInt(dateValue);
          const millisecondsPerDay = 24 * 60 * 60 * 1000;
          const date = new Date(excelEpoch.getTime() + daysSinceEpoch * millisecondsPerDay);
          
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          
          employee.entry_date = `${year}-${month}-${day}`;
          console.log(`[EmployeeService] 自动转换入职日期格式(Excel序列号): ${employee.entry_date}`);
        } catch (e) {
          errors.push('入职日期格式不正确，无法解析数字格式');
        }
      }
      // 检查转换后的日期格式是否正确
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.entry_date)) {
        errors.push('入职日期格式不正确，系统已尝试自动转换多种格式但失败');
      }
    }
    
    // 检查薪资格式
    if (employee.base_salary && isNaN(Number(employee.base_salary))) {
      errors.push('基本工资必须是数字');
    }
    
    // 检查电话号码格式
    if (employee.phone && !/^1[3-9]\d{9}$/.test(employee.phone)) {
      errors.push('手机号格式不正确');
    }
    
    // 检查邮箱格式
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push('邮箱格式不正确');
    }
    
    // 检查身份证号格式
    if (employee.id_card && !/^\d{17}[\dXx]$/.test(employee.id_card)) {
      errors.push('身份证号格式不正确');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * 批量导入员工
   * @param employees 员工信息数组
   * @returns 成功和失败的数量以及失败记录
   */
  public async batchImportEmployees(employees: Omit<Employee, 'id' | 'department_name' | 'position_name'>[]): Promise<{success: number, failures: number, failedRecords: any[]}> {
    console.log(`[EmployeeService] 开始批量导入 ${employees.length} 名员工`);
    
    let successCount = 0;
    let failureCount = 0;
    const failedRecords: any[] = [];
    
    // 获取所有现有员工，用于检查工号是否已存在
    const allEmployees = await this.getAllEmployees();
    const existingEmployeeNoSet = new Set<string>(
      allEmployees.map(e => e.employee_no)
    );
    
    // 1. 工号标准化和唯一性检查
    const employeeNoMap = new Map<string, number>();
    const duplicateNos: string[] = [];
    
    employees.forEach((emp, idx) => {
      if (emp.employee_no && typeof emp.employee_no === 'string') {
        emp.employee_no = emp.employee_no.trim().toUpperCase();
      }
      if (emp.employee_no) {
        if (employeeNoMap.has(emp.employee_no)) {
          duplicateNos.push(emp.employee_no);
        } else {
          employeeNoMap.set(emp.employee_no, idx);
        }
      }
    });
    
    if (duplicateNos.length > 0) {
      console.warn(`[EmployeeService] 导入数据中存在重复工号: ${[...new Set(duplicateNos)].join(', ')}`);
    }
    
    // 检查数据库表结构
    try {
      const db = this.employeeRepository['db'];
      const tableInfo = await db.all("PRAGMA table_info(employees)");
      console.log(`[EmployeeService] 数据库employees表结构检查: ${tableInfo.length} 列`);
      
      // 检查是否有重复列
      const columnNames = tableInfo.map((col: any) => col.name);
      const uniqueColumnNames = new Set(columnNames);
      if (columnNames.length !== uniqueColumnNames.size) {
        console.warn(`[EmployeeService] 警告: employees表存在重复列定义!`);
        const duplicateColumns = columnNames.filter((name: string, index: number) => {
          return columnNames.indexOf(name) !== index;
        });
        console.warn(`[EmployeeService] 重复的列: ${duplicateColumns.join(', ')}`);
      }
    } catch (error) {
      console.error(`[EmployeeService] 检查数据库表结构时出错:`, error);
    }
    
    // 逐个处理每个员工记录
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const rowIndex = i + 2; // Excel行号（假设第1行是表头）
      
      try {
        // 跳过导入数据内工号重复的记录
        if (duplicateNos.includes(employee.employee_no)) {
          failedRecords.push({ 
            ...employee, 
            rowIndex, 
            errorType: '工号重复', 
            errorMessage: `导入数据中工号重复: ${employee.employee_no}` 
          });
          failureCount++;
          continue;
        }
        
        // 数据验证
        const validation = this.validateEmployeeData(employee);
        if (!validation.isValid) {
          failedRecords.push({
            ...employee,
            rowIndex,
            errorType: '数据验证失败',
            errorMessage: validation.errors.join('; ')
          });
          failureCount++;
          console.warn(`[EmployeeService] 员工数据验证失败 (行 ${rowIndex}):`, validation.errors);
          continue;
        }
        
        // 检查工号是否已存在
        if (existingEmployeeNoSet.has(employee.employee_no)) {
          failedRecords.push({
            ...employee,
            rowIndex,
            errorType: '工号冲突',
            errorMessage: `工号 ${employee.employee_no} 已存在于数据库中`
          });
          failureCount++;
          continue;
        }
        
        // 创建员工
        console.log(`[EmployeeService] 尝试创建员工: ${employee.name}, 工号: ${employee.employee_no}`);
        try {
          const newId = await this.createEmployee(employee);
          if (newId > 0) {
            existingEmployeeNoSet.add(employee.employee_no); // 更新缓存
            successCount++;
            console.log(`[EmployeeService] 成功创建员工: ${employee.name} (ID: ${newId})`);
          } else {
            // 尝试直接使用数据库操作创建员工
            console.log(`[EmployeeService] 常规创建失败，尝试直接使用数据库操作创建员工...`);
            try {
              const db = this.employeeRepository['db'];
              const columns = [
                'employee_no', 'name', 'gender', 'department', 'position', 
                'entry_date', 'status', 'base_salary'
              ];
              const placeholders = columns.map(() => '?').join(', ');
              const values = [
                employee.employee_no,
                employee.name,
                employee.gender || 'male',
                employee.department_id,
                employee.position_id,
                employee.entry_date,
                employee.status === 'active' ? 1 : 0,
                employee.base_salary || 0
              ];
              
              const result = await db.run(
                `INSERT INTO employees (${columns.join(', ')}) VALUES (${placeholders})`,
                values
              );
              
              if (result && result.lastID > 0) {
                existingEmployeeNoSet.add(employee.employee_no); // 更新缓存
                successCount++;
                console.log(`[EmployeeService] 使用直接数据库操作成功创建员工: ${employee.name} (ID: ${result.lastID})`);
              } else {
                throw new Error('直接数据库操作创建员工失败');
              }
            } catch (dbError: any) {
              console.error(`[EmployeeService] 直接数据库操作创建员工失败:`, dbError);
              failedRecords.push({
                ...employee,
                rowIndex,
                errorType: '创建失败',
                errorMessage: `创建员工记录失败: ${employee.name}, 工号: ${employee.employee_no}, 错误: ${dbError.message || '未知错误'}`
              });
              failureCount++;
            }
          }
        } catch (createError: any) {
          console.error(`[EmployeeService] 创建员工时发生异常:`, createError);
          const errorMessage = createError && createError.message && createError.message.includes('UNIQUE constraint failed')
            ? `工号唯一性冲突（数据库已存在相同工号）: ${employee.employee_no}`
            : `创建员工时发生异常: ${createError.message || '未知错误'}`;
            
          failedRecords.push({
            ...employee,
            rowIndex,
            errorType: '创建异常',
            errorMessage
          });
          failureCount++;
        }
      } catch (error: any) {
        console.error(`[EmployeeService] 处理员工记录时发生未捕获异常:`, error);
        failedRecords.push({
          ...employee,
          rowIndex,
          errorType: '处理异常',
          errorMessage: `处理员工记录时发生异常: ${error.message || '未知错误'}`
        });
        failureCount++;
      }
    }
    
    console.log(`[EmployeeService] 批量导入完成，成功: ${successCount}, 失败: ${failureCount}`);
    if (failedRecords.length > 0) {
      console.log(`[EmployeeService] 失败记录数量: ${failedRecords.length}`);
    }
    
    return { success: successCount, failures: failureCount, failedRecords };
  }
}