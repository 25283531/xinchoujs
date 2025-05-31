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
   * @returns 成功和失败的数量，以及失败的记录
   */
  public async batchImportEmployees(employees: Omit<Employee, 'id' | 'department_name' | 'position_name'>[]): Promise<{success: number, failures: number, failedRecords: any[]}> {
    console.log(`[EmployeeService] 开始批量导入 ${employees.length} 名员工`);

    // 1. 工号标准化和唯一性检查
    const employeeNoMap = new Map<string, number>();
    const duplicateNos: string[] = [];
    const duplicateRecords: any[] = [];
    employees.forEach((emp, idx) => {
      if (emp.employee_no && typeof emp.employee_no === 'string') {
        emp.employee_no = emp.employee_no.trim().toUpperCase();
      }
      if (emp.employee_no) {
        if (employeeNoMap.has(emp.employee_no)) {
          duplicateNos.push(emp.employee_no);
          duplicateRecords.push({ ...emp, rowIndex: idx + 2, errorType: '工号重复', errorMessage: `导入数据中工号重复: ${emp.employee_no}` });
        } else {
          employeeNoMap.set(emp.employee_no, idx);
        }
      }
    });
    // 不再抛出异常，后续处理时跳过这些重复工号的数据
    if (duplicateNos.length > 0) {
      console.warn(`[EmployeeService] 导入数据中存在重复工号: ${[...new Set(duplicateNos)].join(', ')}`);
    }
    let successCount = 0;
    let failureCount = 0;
    const failedRecords: any[] = [];
    
    // 获取所有员工，用于检查工号是否已存在
    const allEmployees = await this.getAllEmployees();
    const existingEmployeeNos = new Map<string, number>();
    
    // 创建工号到ID的映射，用于更新已存在的员工
    allEmployees.forEach(emp => {
      if (emp.employee_no) {
        existingEmployeeNos.set(emp.employee_no.toString(), emp.id);
      }
    });
    
    console.log(`[EmployeeService] 当前系统中有 ${existingEmployeeNos.size} 名员工记录`);
    
    // 创建一个临时的EmployeeRepository实例
    const employeeRepository = new EmployeeRepository();
    
    // 逐个处理每个员工记录，不使用事务，允许部分成功
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const rowIndex = i + 2; // Excel行号（假设第1行是表头）
      // 跳过导入数据内工号重复的记录
      if (duplicateNos.includes(employee.employee_no)) {
        failedRecords.push({ ...employee, rowIndex, errorType: '工号重复', errorMessage: `导入数据中工号重复: ${employee.employee_no}` });
        failureCount++;
        continue;
      }
      
      try {
        // 数据验证
        const validation = this.validateEmployeeData(employee);
        if (!validation.isValid) {
          const errorRecord = {
            ...employee,
            rowIndex,
            errorType: '数据验证失败',
            errorMessage: validation.errors.join('; ')
          };
          failedRecords.push(errorRecord);
          failureCount++;
          console.warn(`[EmployeeService] 员工数据验证失败 (行 ${rowIndex}):`, validation.errors);
          continue;
        }
        
        // 检查员工是否已存在（基于工号）
        const employeeNo = employee.employee_no.toString();
        // 再次检查工号是否已存在（可能在本次导入中刚添加）
        if (existingEmployeeNos.has(employeeNo)) {
          // 员工已存在（数据库中或本次导入中），执行更新操作
          const existingId = existingEmployeeNos.get(employeeNo)!;
          console.log(`[EmployeeService] 员工工号 ${employeeNo} 已存在 (ID: ${existingId})，尝试更新...`);
          try {
            const updateResult = await employeeRepository.updateEmployee(existingId, employee);
            if (updateResult) {
              successCount++;
              console.log(`[EmployeeService] 成功更新员工: ${employee.name} (ID: ${existingId})`);
            } else {
              const errorRecord = {
                ...employee,
                rowIndex,
                errorType: '更新失败',
                errorMessage: `更新员工数据失败: ${employee.name}, 工号: ${employeeNo}`
              };
              failedRecords.push(errorRecord);
              failureCount++;
              console.error(`[EmployeeService] 更新员工数据失败: ${employee.name}, 工号: ${employeeNo}`);
            }
          } catch (updateError: any) {
            const errorRecord = {
              ...employee,
              rowIndex,
              errorType: '更新异常',
              errorMessage: updateError && updateError.message && updateError.message.includes('UNIQUE constraint failed')
                ? `工号唯一性冲突（数据库已存在相同工号）: ${employeeNo}`
                : `更新员工时发生异常: ${updateError.message || '未知错误'}`
            };
            failedRecords.push(errorRecord);
            failureCount++;
            console.error(`[EmployeeService] 更新员工时发生异常: ${employee.name}, 工号: ${employeeNo}`, updateError);
          }
        } else {
          // 员工不存在，执行创建操作
          console.log(`[EmployeeService] 员工工号 ${employeeNo} 不存在，尝试创建...`);
          try {
            const newId = await employeeRepository.createEmployee(employee);
            if (newId > 0) {
              // 更新映射，以防后续有重复工号
              existingEmployeeNos.set(employeeNo, newId);
              successCount++;
              console.log(`[EmployeeService] 成功创建员工: ${employee.name} (ID: ${newId})`);
            } else {
              const errorRecord = {
                ...employee,
                rowIndex,
                errorType: '创建失败',
                errorMessage: `创建员工记录返回无效ID: ${employee.name}, 工号: ${employeeNo}`
              };
              failedRecords.push(errorRecord);
              failureCount++;
              console.error(`[EmployeeService] 创建员工记录返回无效ID: ${employee.name}, 工号: ${employeeNo}`);
            }
          } catch (createError: any) {
             // 捕获创建时的SQLITE_CONSTRAINT等错误
            const errorRecord = {
              ...employee,
              rowIndex,
              errorType: '创建异常',
              errorMessage: createError && createError.message && createError.message.includes('UNIQUE constraint failed')
                ? `工号唯一性冲突（数据库已存在相同工号）: ${employeeNo}`
                : `创建员工时发生异常: ${createError.message || '未知错误'}`
            };
            failedRecords.push(errorRecord);
            failureCount++;
            console.error(`[EmployeeService] 创建员工时发生异常: ${employee.name}, 工号: ${employeeNo}`, createError);
          }
        }
      } catch (error: any) {
        const errorRecord = {
          ...employee,
          rowIndex,
          errorType: '处理异常',
          errorMessage: error.message || '未知错误'
        };
        failedRecords.push(errorRecord);
        failureCount++;
        console.error(`[EmployeeService] 处理员工记录异常 (行 ${rowIndex}):`, error);
      }
    }
    
    console.log(`[EmployeeService] 批量导入完成，成功: ${successCount}, 失败: ${failureCount}`);
    return { success: successCount, failures: failureCount, failedRecords };
  }
}