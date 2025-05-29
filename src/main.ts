console.log('main.ts loaded');
import * as path from 'path';
import { ipcMain } from 'electron'; // Added for IPC
import { Database, DatabaseConfig } from './db/database';
import { PayrollServiceImpl } from './services/payrollService.impl';
import { PayrollResult } from './services/payrollService'; // Added for type hint
import { ImportService } from './services/importService';
import { ExportService } from './services/exportService';
import { SocialInsuranceService } from './services/socialInsuranceService';
import { TaxService } from './services/taxService';
import { AttendanceRepositoryImpl } from './db/attendanceRepository';
import { AttendanceServiceImpl } from './services/attendanceService';
import { EmployeeServiceImpl } from './services/employeeService';
import { OrganizationServiceImpl } from './services/organizationService.impl';
import { ExcelService, excelService } from './services/excelService';
import * as ExcelJS from 'exceljs';

// Import necessary services and repositories
import { SalaryGroupServiceImpl } from './services/salaryGroupService.impl';
import { SalaryItemServiceImpl } from './services/salaryItemService.impl';
import { getDatabaseConfig } from './config/database.config';

// 环境检测
const isElectron = process.versions && process.versions.electron;
let electronApp: any;
let BrowserWindow: any;

// 仅在Electron环境中导入electron模块
if (isElectron) {
  // 设置控制台编码为UTF-8，解决中文乱码问题
  process.env.LANG = 'zh_CN.UTF-8';
  
  const electron = require('electron');
  electronApp = electron.app;
  BrowserWindow = electron.BrowserWindow;
  


}

/**
 * 初始化数据库连接
 */
async function initDatabase() {
  // 使用统一的数据库配置
  const dbConfig = getDatabaseConfig(process.env.NODE_ENV === 'development');
  
  try {
    const db = Database.getInstance();
    await db.initialize(dbConfig);
    console.log('数据库初始化成功');
    return true;
  } catch (error: any) { // Add type annotation for error
    console.error('数据库初始化失败:', error);
    return false;
  }
}





/**
 * 创建主窗口
 */
function createMainWindow() {
  console.log('进入 createMainWindow 函数');
  // 确保在Electron环境中运行
  if (!isElectron || !BrowserWindow) {
    console.log('非Electron环境，跳过窗口创建');
    return null;
  }
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Best practice: disable nodeIntegration in renderer
      contextIsolation: true,  // Best practice: enable contextIsolation
      preload: path.join(__dirname, '../build/preload.js'), // Specify the preload script
      // 增加 Content-Security-Policy 配置
      // 允许加载同源资源，样式允许内联（如果需要）
      // 生产环境中应进一步限制 'unsafe-inline'
      webSecurity: true,
      allowRunningInsecureContent: false,
      contentSecurityPolicy: "default-src 'self' file:; script-src 'self' file:; style-src 'self' file:"
    },
    autoHideMenuBar: true, // 自动隐藏菜单栏
    frame: true // 保留窗口框架但隐藏菜单
  });
  
  // 设置应用菜单为null，移除默认菜单
  if (electronApp && electronApp.Menu) {
    electronApp.Menu.setApplicationMenu(null);
  }
  
  // 加载主HTML文件
  const htmlPath = path.join(__dirname, '../build/index.html');
  console.log('加载HTML路径:', htmlPath);
  console.log('检查文件是否存在:', require('fs').existsSync(htmlPath));
  mainWindow.loadFile(htmlPath);

  // 开发环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  return mainWindow;
}





/**
 * 应用初始化函数
 */
async function initializeApp() {
  console.log('薪酬管理系统初始化中...');
  
  // 初始化数据库连接
  const dbInitialized = await initDatabase();
  if (!dbInitialized) {
    throw new Error('数据库初始化失败');
  }
  
  // 初始化预置数据
  const taxService = new TaxService();
  await taxService.initDefaultFormulas();
  
  console.log('薪酬管理系统初始化完成');
}



/**
 * 应用启动函数
 */
async function startApp() {
  console.log('startApp 函数开始执行');
  console.log('进入 startApp 函数');
  try {
    // 初始化应用
    console.log('开始初始化应用...');
    await initializeApp();
    console.log('应用初始化完成');

    // 初始化服务并设置IPC处理器
    console.log('开始初始化服务和IPC...');
    await initializeServicesAndIPC();
    console.log('服务和IPC初始化完成');
    
    // 判断运行环境
    if (isElectron && electronApp) {
      // Electron环境 - 启动UI界面
      electronApp.whenReady().then(() => {
        console.log('electronApp 已准备就绪');
        console.log('Electron 应用已准备就绪');
        createMainWindow();
        
        // macOS应用激活时重新创建窗口
        electronApp.on('activate', () => {
          if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
          }
        });
      });

      
      // 所有窗口关闭时退出应用（Windows/Linux）
      electronApp.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
          electronApp.quit();
        }
      });

      
      // 应用退出前关闭数据库连接
      electronApp.on('will-quit', async () => {
        try {
          const db = Database.getInstance();
          await db.close();
          console.log('数据库连接已关闭');
        } catch (error) {
          console.error('关闭数据库连接失败:', error);
        }
      });

    } else {
      // 非Electron环境 - 仅初始化服务
      console.log('在非Electron环境中运行，仅初始化服务');
      
      // 注册进程退出事件，确保关闭数据库连接
      process.on('SIGINT', async () => {
        try {
          const db = Database.getInstance();
          await db.close();
          console.log('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          console.error('关闭数据库连接失败:', error);
          process.exit(1);
        }
      });

    }
    
    console.log('薪酬管理系统启动成功');
  } catch (error) {
    console.error('薪酬管理系统启动失败:', error);
    
    // 根据环境选择退出方式
    if (isElectron && electronApp) {
      electronApp.quit();
    } else if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
}





// Declare service variables outside to be accessible by handlers
// 惰性加载全局服务实例
let payrollService: PayrollServiceImpl;
let attendanceService: AttendanceServiceImpl;
let salaryGroupService: SalaryGroupServiceImpl;
let salaryItemService: SalaryItemServiceImpl;
let employeeService: EmployeeServiceImpl;
let organizationService: OrganizationServiceImpl;
let socialInsuranceService: SocialInsuranceService; // 社保服务变量声明

// Function to initialize services and setup IPC handlers after database is ready
async function initializeServicesAndIPC() {
  const dbInstance = Database.getInstance();
  const dbConnection = dbInstance.getConnection();

  // 实例化服务和仓库，传递数据库实例或连接
  payrollService = new PayrollServiceImpl(); // PayrollServiceImpl已内部正确初始化AttendanceRepository
  const attendanceRepository = new AttendanceRepositoryImpl(dbInstance); // 传递数据库实例而非连接
  attendanceService = new AttendanceServiceImpl(attendanceRepository);
  salaryGroupService = new SalaryGroupServiceImpl(); // SalaryGroupServiceImpl does not seem to require connection in constructor
  salaryItemService = new SalaryItemServiceImpl(); // SalaryItemServiceImpl does not seem to require connection in constructor
  employeeService = new EmployeeServiceImpl(); // 初始化员工服务
  organizationService = new OrganizationServiceImpl(); // 初始化组织架构服务
  socialInsuranceService = new SocialInsuranceService(); // 初始化社保服务

  // IPC Handlers for PayrollService
  ipcMain.handle('payroll:calculateEmployeeSalary', async (event, employeeId: number, yearMonth: string): Promise<PayrollResult> => {
    try {
      console.log(`[IPC Main] Received payroll:calculateEmployeeSalary for ${employeeId}, ${yearMonth}`);
      const result = await payrollService.calculateEmployeeSalary(employeeId, yearMonth);
      console.log(`[IPC Main] Sending result for payroll:calculateEmployeeSalary:`, result);
      return result;
    } catch (error: any) { // Add type annotation for error
      console.error('[IPC Main] Error in payroll:calculateEmployeeSalary:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  ipcMain.handle('payroll:batchCalculateSalary', async (event, yearMonth: string, departmentId?: number): Promise<PayrollResult[]> => {
    try {
      console.log(`[IPC Main] Received payroll:batchCalculateSalary for ${yearMonth}, dept: ${departmentId}`);
      const results = await payrollService.batchCalculateSalary(yearMonth, departmentId);
      console.log(`[IPC Main] Sending results for payroll:batchCalculateSalary:`, results.length);
      return results;
    } catch (error: any) { // Add type annotation for error
      console.error('[IPC Main] Error in payroll:batchCalculateSalary:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  // Add other IPC handlers for other services if needed
  // e.g., for ImportService, ExportService, etc.

  // IPC Handlers for AttendanceService
  ipcMain.handle('attendance:getExceptionItems', async () => {
    try {
      console.log('[IPC Main] Received attendance:getExceptionItems');
      const items = await attendanceService.getExceptionItems();
      console.log('[IPC Main] Sending result for attendance:getExceptionItems:', items.length);
      return { success: true, data: items };
    } catch (error: any) {
      console.error('[IPC Main] Error in attendance:getExceptionItems:', error);
      return { success: false, error: error.message || '获取考勤异常项目失败' };
    }
  });

  ipcMain.handle('attendance:defineExceptionItem', async (event, item) => {
    try {
      console.log('[IPC Main] Received attendance:defineExceptionItem:', item);
      await attendanceService.defineExceptionItem(item);
      console.log('[IPC Main] Exception item defined successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in attendance:defineExceptionItem:', error);
      return { success: false, error: error.message || '创建考勤异常项目失败' };
    }
  });

  ipcMain.handle('attendance:updateExceptionItem', async (event, item) => {
    try {
      console.log('[IPC Main] Received attendance:updateExceptionItem:', item);
      await attendanceService.updateExceptionItem(item);
      console.log('[IPC Main] Exception item updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in attendance:updateExceptionItem:', error);
      return { success: false, error: error.message || '更新考勤异常项目失败' };
    }
  });

  ipcMain.handle('attendance:deleteExceptionItem', async (event, id) => {
    try {
      console.log('[IPC Main] Received attendance:deleteExceptionItem:', id);
      await attendanceService.deleteExceptionItem(id);
      console.log('[IPC Main] Exception item deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in attendance:deleteExceptionItem:', error);
      return { success: false, error: error.message || '删除考勤异常项目失败' };
    }
  });

  // IPC Handlers for SalaryGroupService and SalaryItemService
  ipcMain.handle('salaryGroup:getAllSalaryGroups', async () => {
    try {
      console.log('[IPC Main] Received salaryGroup:getAllSalaryGroups');
      const groups = await salaryGroupService.getAllSalaryGroups();
      console.log('[IPC Main] Sending result for salaryGroup:getAllSalaryGroups:', groups.length);
      return groups;
    } catch (error: any) { // Add type annotation for error
      console.error('[IPC Main] Error in salaryGroup:getAllSalaryGroups:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  // 添加薪酬组更新的IPC处理程序
  ipcMain.handle('salaryGroup:updateSalaryGroup', async (event, id: number, salaryGroup: any) => {
    try {
      console.log('[IPC Main] Received salaryGroup:updateSalaryGroup:', id, salaryGroup);
      await salaryGroupService.updateSalaryGroup(id, salaryGroup);
      console.log('[IPC Main] Salary group updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in salaryGroup:updateSalaryGroup:', error);
      return { success: false, error: error.message || '更新薪酬组失败' };
    }
  });

  // 添加薪酬组分配给部门的IPC处理程序
  ipcMain.handle('salaryGroup:assignSalaryGroupToDepartment', async (event, department: string, salaryGroupId: number) => {
    try {
      console.log('[IPC Main] Received salaryGroup:assignSalaryGroupToDepartment:', department, salaryGroupId);
      await salaryGroupService.assignSalaryGroupToDepartment(department, salaryGroupId);
      console.log('[IPC Main] Salary group assigned to department successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in salaryGroup:assignSalaryGroupToDepartment:', error);
      return { success: false, error: error.message || '分配薪酬组到部门失败' };
    }
  });

  ipcMain.handle('salaryItem:getAllSalaryItems', async () => {
    try {
      console.log('[IPC Main] Received salaryItem:getAllSalaryItems');
      const items = await salaryItemService.getAllSalaryItems();
      console.log('[IPC Main] Sending result for salaryItem:getAllSalaryItems:', items.length);
      return items;
    } catch (error: any) {
      console.error('[IPC Main] Error in salaryItem:getAllSalaryItems:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  // 添加薪酬项更新的IPC处理程序
  ipcMain.handle('salaryItem:updateSalaryItem', async (event, id: number, item: any) => {
    try {
      console.log('[IPC Main] Received salaryItem:updateSalaryItem:', id, item);
      await salaryItemService.updateSalaryItem(id, item);
      console.log('[IPC Main] Salary item updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in salaryItem:updateSalaryItem:', error);
      return { success: false, error: error.message || '更新薪酬项失败' };
    }
  });

  // IPC Handler for creating a salary item
  ipcMain.handle('salaryItem:createSalaryItem', async (event, item) => {
    try {
      console.log('[IPC Main] Received salaryItem:createSalaryItem:', item);
      await salaryItemService.createSalaryItem(item);
      console.log('[IPC Main] Salary item created successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in salaryItem:createSalaryItem:', error);
      return { success: false, error: error.message || '创建薪酬项失败' };
    }
  });

  // IPC Handlers for EmployeeService
  ipcMain.handle('employee:getAllEmployees', async () => {
    try {
      console.log('[IPC Main] Received employee:getAllEmployees');
      const employees = await employeeService.getAllEmployees();
      console.log('[IPC Main] Sending result for employee:getAllEmployees:', employees.length);
      return employees;
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:getAllEmployees:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  ipcMain.handle('employee:getEmployeesByDepartment', async (event, departmentId) => {
    try {
      console.log('[IPC Main] Received employee:getEmployeesByDepartment:', departmentId);
      const employees = await employeeService.getEmployeesByDepartment(departmentId);
      console.log('[IPC Main] Sending result for employee:getEmployeesByDepartment:', employees.length);
      return employees;
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:getEmployeesByDepartment:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  ipcMain.handle('employee:getEmployeeById', async (event, id) => {
    try {
      console.log('[IPC Main] Received employee:getEmployeeById:', id);
      const employee = await employeeService.getEmployeeById(id);
      console.log('[IPC Main] Sending result for employee:getEmployeeById:', employee);
      return employee;
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:getEmployeeById:', error);
      throw error; // Propagate error to the renderer process
    }
  });

  ipcMain.handle('employee:createEmployee', async (event, employee) => {
    try {
      console.log('[IPC Main] Received employee:createEmployee:', employee);
      
      // 检查数据有效性
      if (!employee.employee_no || !employee.name) {
        throw new Error('工号和姓名不能为空');
      }
      
      // 确保数值字段是有效的数字
      employee.department_id = Number(employee.department_id) || 0;
      employee.position_id = Number(employee.position_id) || 0;
      employee.base_salary = Number(employee.base_salary) || 0;
      employee.salary_group_id = Number(employee.salary_group_id) || 0;
      employee.social_insurance_group_id = Number(employee.social_insurance_group_id) || 0;
      
      const id = await employeeService.createEmployee(employee);
      
      if (!id || id === 0) {
        throw new Error('创建员工失败');
      }
      
      console.log('[IPC Main] Employee created successfully with id:', id);
      return id;
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:createEmployee:', error);
      throw new Error(`创建员工失败: ${error.message || '未知错误'}`);
    }
  });

  ipcMain.handle('employee:updateEmployee', async (event, id, employee) => {
    try {
      console.log('[IPC Main] Received employee:updateEmployee:', id, employee);
      
      // 检查ID有效性
      if (!id || isNaN(Number(id))) {
        throw new Error('无效的员工ID');
      }
      
      // 确保数值字段是有效的数字
      if (employee.department_id !== undefined) {
        employee.department_id = Number(employee.department_id) || 0;
      }
      
      if (employee.position_id !== undefined) {
        employee.position_id = Number(employee.position_id) || 0;
      }
      
      if (employee.base_salary !== undefined) {
        employee.base_salary = Number(employee.base_salary) || 0;
      }
      
      if (employee.salary_group_id !== undefined) {
        employee.salary_group_id = Number(employee.salary_group_id) || 0;
      }
      
      if (employee.social_insurance_group_id !== undefined) {
        employee.social_insurance_group_id = Number(employee.social_insurance_group_id) || 0;
      }
      
      // 执行更新操作并假设成功
      await employeeService.updateEmployee(id, employee);
      // 运行到这里说明没有抛出异常，进而说明更新成功
      
      console.log('[IPC Main] Employee updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:updateEmployee:', error);
      throw new Error(`更新员工失败: ${error.message || '未知错误'}`);
    }
  });

  ipcMain.handle('employee:deleteEmployee', async (event, id) => {
    try {
      console.log('[IPC Main] Received employee:deleteEmployee:', id);
      await employeeService.deleteEmployee(id);
      console.log('[IPC Main] Employee deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Main] Error in employee:deleteEmployee:', error);
      throw error; // Propagate error to the renderer process
    }
  });
  
  // 批量导入员工IPC处理程序
  ipcMain.handle('employee:batchImportEmployees', async (event, employees) => {
    try {
      console.log(`[IPC Main] 收到employee:batchImportEmployees请求，${employees.length}条记录`);
      
      // 调用服务进行批量导入
      const result = await employeeService.batchImportEmployees(employees);
      
      console.log(`[IPC Main] 批量导入员工完成，成功: ${result.success}，失败: ${result.failures}`);
      return { 
        success: true, 
        data: result 
      };
    } catch (error: any) {
      console.error('[IPC Main] employee:batchImportEmployees 错误:', error);
      return { 
        success: false, 
        message: error.message || '批量导入员工失败' 
      };
    }
  });
  
  // 组织架构服务IPC处理器
  // 部门相关处理器
  ipcMain.handle('organization:getAllDepartments', async () => {
    try {
      console.log('[IPC Main] Received organization:getAllDepartments');
      const departments = await organizationService.getAllDepartments();
      console.log('[IPC Main] Departments retrieved successfully:', departments.length);
      return { success: true, data: departments };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:getAllDepartments:', error);
      return { success: false, message: error.message || '获取部门列表失败' };
    }
  });
  
  ipcMain.handle('organization:getDepartmentById', async (event, id) => {
    try {
      console.log('[IPC Main] Received organization:getDepartmentById:', id);
      const department = await organizationService.getDepartmentById(id);
      console.log('[IPC Main] Department retrieved successfully:', department);
      return { success: true, data: department };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:getDepartmentById:', error);
      return { success: false, message: error.message || '获取部门详情失败' };
    }
  });
  
  ipcMain.handle('organization:createDepartment', async (event, departmentData) => {
    try {
      console.log('[IPC Main] Received organization:createDepartment:', departmentData);
      const id = await organizationService.createDepartment(departmentData);
      console.log('[IPC Main] Department created successfully with ID:', id);
      return { success: true, data: id };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:createDepartment:', error);
      return { success: false, message: error.message || '创建部门失败' };
    }
  });
  
  ipcMain.handle('organization:updateDepartment', async (event, id, departmentData) => {
    try {
      console.log('[IPC Main] Received organization:updateDepartment:', id, departmentData);
      const result = await organizationService.updateDepartment(id, departmentData);
      console.log('[IPC Main] Department updated successfully:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:updateDepartment:', error);
      return { success: false, message: error.message || '更新部门失败' };
    }
  });
  
  ipcMain.handle('organization:deleteDepartment', async (event, id) => {
    try {
      console.log('[IPC Main] Received organization:deleteDepartment:', id);
      const result = await organizationService.deleteDepartment(id);
      console.log('[IPC Main] Department deleted successfully:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:deleteDepartment:', error);
      return { success: false, message: error.message || '删除部门失败' };
    }
  });
  
  // 职位相关处理器
  ipcMain.handle('organization:getAllPositions', async () => {
    try {
      console.log('[IPC Main] Received organization:getAllPositions');
      const positions = await organizationService.getAllPositions();
      console.log('[IPC Main] Positions retrieved successfully:', positions.length);
      return { success: true, data: positions };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:getAllPositions:', error);
      return { success: false, message: error.message || '获取职位列表失败' };
    }
  });
  
  ipcMain.handle('organization:getPositionsByDepartment', async (event, departmentId) => {
    try {
      console.log('[IPC Main] Received organization:getPositionsByDepartment:', departmentId);
      const positions = await organizationService.getPositionsByDepartment(departmentId);
      console.log('[IPC Main] Positions retrieved successfully:', positions.length);
      return { success: true, data: positions };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:getPositionsByDepartment:', error);
      return { success: false, message: error.message || '获取部门职位失败' };
    }
  });
  
  ipcMain.handle('organization:getPositionById', async (event, id) => {
    try {
      console.log('[IPC Main] Received organization:getPositionById:', id);
      const position = await organizationService.getPositionById(id);
      console.log('[IPC Main] Position retrieved successfully:', position);
      return { success: true, data: position };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:getPositionById:', error);
      return { success: false, message: error.message || '获取职位详情失败' };
    }
  });
  
  ipcMain.handle('organization:createPosition', async (event, positionData) => {
    try {
      console.log('[IPC Main] Received organization:createPosition:', positionData);
      const id = await organizationService.createPosition(positionData);
      console.log('[IPC Main] Position created successfully with ID:', id);
      return { success: true, data: id };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:createPosition:', error);
      return { success: false, message: error.message || '创建职位失败' };
    }
  });
  
  ipcMain.handle('organization:updatePosition', async (event, id, positionData) => {
    try {
      console.log('[IPC Main] Received organization:updatePosition:', id, positionData);
      const result = await organizationService.updatePosition(id, positionData);
      console.log('[IPC Main] Position updated successfully:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:updatePosition:', error);
      return { success: false, message: error.message || '更新职位失败' };
    }
  });
  
  ipcMain.handle('organization:deletePosition', async (event, id) => {
    try {
      console.log('[IPC Main] Received organization:deletePosition:', id);
      const result = await organizationService.deletePosition(id);
      console.log('[IPC Main] Position deleted successfully:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[IPC Main] Error in organization:deletePosition:', error);
      return { success: false, message: error.message || '删除职位失败' };
    }
  });

  // Excel处理相关的IPC处理程序 - 使用ExcelService服务
  ipcMain.handle('excel:getSheets', async (event, filePath: string) => {
    try {
      console.log('[IPC Main] 收到excel:getSheets请求:', filePath);
      
      // 使用ExcelService获取Excel工作表
      const sheetNames = await excelService.getSheets(filePath);
      console.log('[IPC Main] Excel工作表获取成功:', sheetNames.length, '个工作表');
      
      return { success: true, data: sheetNames };
    } catch (error: any) {
      console.error('[IPC Main] excel:getSheets 错误:', error);
      return { success: false, message: error.message || '读取Excel工作表失败' };
    }
  });
  
  ipcMain.handle('excel:readSheet', async (event, filePath: string, sheetName: string) => {
    try {
      console.log('[IPC Main] 收到excel:readSheet请求:', filePath, sheetName);
      
      // 使用ExcelService读取工作表数据
      const { headers, rows } = await excelService.readSheet(filePath, sheetName);
      console.log(`[IPC Main] Excel工作表数据读取成功: ${headers.length} 列, ${rows.length} 行`);
      
      return { success: true, data: { headers, rows } };
    } catch (error: any) {
      console.error('[IPC Main] excel:readSheet 错误:', error);
      return { success: false, message: error.message || '读取Excel数据失败' };
    }
  });

  ipcMain.handle('excel:exportData', async (event, options: { sheetName: string; data: any[] }) => {
    try {
      console.log('[IPC Main] Received excel:exportData');
      
      if (!options || !options.data || !Array.isArray(options.data)) {
        throw new Error('无效的导出数据');
      }
      
      const { sheetName, data } = options;
      
      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName || '数据导出');
      
      // 添加表头
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        
        // 添加数据行
        data.forEach(item => {
          const rowData = headers.map(header => item[header]);
          worksheet.addRow(rowData);
        });
      }
      
      // 让用户选择保存路径
      const { dialog } = require('electron');
      const savePath = await dialog.showSaveDialog({
        filters: [{ name: 'Excel文件', extensions: ['xlsx'] }],
        defaultPath: `${sheetName || '导出数据'}.xlsx`
      });
      
      if (savePath.canceled) {
        return { success: false, message: '用户取消导出' };
      }
      
      // 保存文件
      await workbook.xlsx.writeFile(savePath.filePath);
      console.log('[IPC Main] Excel data exported successfully to:', savePath.filePath);
      
      return { success: true, filePath: savePath.filePath };
    } catch (error: any) {
      console.error('[IPC Main] Error in excel:exportData:', error);
      return { success: false, message: error.message || '导出Excel数据失败' };
    }
  });
  
  // 社保组API的IPC处理程序
  ipcMain.handle('socialInsurance:getSocialInsuranceGroups', async () => {
    try {
      console.log('[IPC Main] Received socialInsurance:getSocialInsuranceGroups');
      const groups = await socialInsuranceService.getSocialInsuranceGroups();
      
      // 如果没有数据，生成默认的社保组数据
      if (!groups || groups.length === 0) {
        console.log('[IPC Main] No social insurance groups found, returning default groups');
        return [{
          id: 1,
          name: '默认社保组',
          description: '基本社保配置',
          pensionPersonal: 0.08,
          pensionCompany: 0.16,
          medicalPersonal: 0.02,
          medicalCompany: 0.08,
          unemploymentPersonal: 0.005,
          unemploymentCompany: 0.005,
          injuryCompany: 0.002,
          maternityCompany: 0.01,
          housingPersonal: 0.07,
          housingCompany: 0.07
        }];
      }
      
      console.log('[IPC Main] Sending result for socialInsurance:getSocialInsuranceGroups:', groups.length);
      return groups;
    } catch (error: any) {
      console.error('[IPC Main] Error in socialInsurance:getSocialInsuranceGroups:', error);
      // 出错时返回默认组
      return [{
        id: 1,
        name: '默认社保组',
        description: '基本社保配置',
        pensionPersonal: 0.08,
        pensionCompany: 0.16,
        medicalPersonal: 0.02,
        medicalCompany: 0.08,
        unemploymentPersonal: 0.005,
        unemploymentCompany: 0.005,
        injuryCompany: 0.002,
        maternityCompany: 0.01,
        housingPersonal: 0.07,
        housingCompany: 0.07
      }];
    }
  });
  
  ipcMain.handle('socialInsurance:getSocialInsuranceGroup', async (event, id: number) => {
    try {
      console.log('[IPC Main] Received socialInsurance:getSocialInsuranceGroup:', id);
      const group = await socialInsuranceService.getSocialInsuranceGroup(id);
      
      // 如果没有找到指定的社保组，返回错误信息
      if (!group) {
        return {
          success: false, 
          message: '没有找到指定的社保组'
        };
      }
      
      console.log('[IPC Main] Social insurance group retrieved successfully:', group);
      return { success: true, data: group };
    } catch (error: any) {
      console.error('[IPC Main] Error in socialInsurance:getSocialInsuranceGroup:', error);
      return { success: false, message: error.message || '获取社保组详情失败' };
    }
  });

  // IPC Handlers for AttendanceService (Import, Process, Calculate)
  ipcMain.handle('attendance:importAttendanceData', async (event, filePath: string, matchingKeyword: 'name' | 'name+id' | 'name+idcard') => {
    try {
      console.log('[IPC Main] Received attendance:importAttendanceData:', filePath, matchingKeyword);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet
      if (!worksheet) {
        throw new Error('未找到工作表');
      }

      const headerRow = worksheet.getRow(1);
      if (!headerRow) {
        throw new Error('未找到表头行');
      }

      const headers = headerRow.values as string[];
      const rawData: any[] = [];

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => { // Add type annotations
        if (rowNumber > 1) { // Skip header row
          const rowData: any = {};
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => { // Add type annotations
            // Use header text as key, handle potential null/undefined values
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value;
            } else {
              // Handle cases where header is null or undefined, maybe assign a default key or skip
              // For now, let's just log a warning or skip this cell
              console.warn(`Skipping cell at row ${rowNumber}, col ${colNumber} due to missing header.`);
            }
          });
          rawData.push(rowData);
        }
      });

      console.log(`Read ${rawData.length} data rows.`);

      // Call attendanceService to import raw data and get the imported data ID
      const importedDataId = await attendanceService.importAttendanceData(filePath, matchingKeyword);

      console.log('[IPC Main] Attendance data import process completed, data ID:', importedDataId);
      return { success: true, data: { dataId: importedDataId }, message: '数据读取并导入成功，等待进一步处理' };
    } catch (error: any) { // Add type annotation for error
      console.error('[IPC Main] Error in attendance:importAttendanceData:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('attendance:processAttendanceData', async (event, dataId: number) => {
    try {
      console.log('[IPC Main] Received attendance:processAttendanceData:', dataId);
      await attendanceService.processAttendanceData(dataId);
      console.log('[IPC Main] Attendance data processing initiated for ID:', dataId);
      return { success: true };
    } catch (error: any) { // Add type annotation for error
      console.error('[IPC Main] Error in attendance:processAttendanceData:', error);
      return { success: false, error: error.message };
    }
  });
}

// 启动应用
startApp();