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
import * as ExcelJS from 'exceljs';

// Import necessary services and repositories
import { SalaryGroupServiceImpl } from './services/salaryGroupService.impl';
import { SalaryItemServiceImpl } from './services/salaryItemService.impl';

// 环境检测
const isElectron = process.versions && process.versions.electron;
let electronApp: any;
let BrowserWindow: any;

// 仅在Electron环境中导入electron模块
if (isElectron) {
  const electron = require('electron');
  electronApp = electron.app;
  BrowserWindow = electron.BrowserWindow;
  
  // 设置控制台编码为UTF-8，解决中文乱码问题
  process.env.LANG = 'zh_CN.UTF-8';
  process.env.LC_ALL = 'zh_CN.UTF-8';
  
  // 设置控制台输出编码
  if (process.platform === 'win32') {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
  }
}

/**
 * 初始化数据库连接
 */
async function initDatabase() {
  // 根据环境确定数据库文件路径
  let dbPath: string;
  if (isElectron && electronApp) {
    // Electron环境 - 使用app.getPath
    dbPath = path.join(electronApp.getPath('userData'), 'payroll.db');
  } else {
    // 非Electron环境 - 使用相对路径
    dbPath = path.join(__dirname, '../data/payroll.db');
  }
  
  const dbConfig: DatabaseConfig = {
    filename: dbPath,
    verbose: process.env.NODE_ENV === 'development'
  };
  
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
let payrollService: PayrollServiceImpl;
let attendanceService: AttendanceServiceImpl;
let salaryGroupService: SalaryGroupServiceImpl;
let salaryItemService: SalaryItemServiceImpl;

// Function to initialize services and setup IPC handlers after database is ready
async function initializeServicesAndIPC() {
  const dbInstance = Database.getInstance();
  const dbConnection = dbInstance.getConnection();

  // Instantiate services and repositories, passing the database connection
  payrollService = new PayrollServiceImpl(); // PayrollServiceImpl does not seem to require connection in constructor based on current code
  const attendanceRepository = new AttendanceRepositoryImpl(dbConnection);
  attendanceService = new AttendanceServiceImpl(attendanceRepository);
  salaryGroupService = new SalaryGroupServiceImpl(); // SalaryGroupServiceImpl does not seem to require connection in constructor
  salaryItemService = new SalaryItemServiceImpl(); // SalaryItemServiceImpl does not seem to require connection in constructor

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
      return items;
    } catch (error: any) {
      console.error('[IPC Main] Error in attendance:getExceptionItems:', error);
      throw error; // 将错误传递给渲染进程
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