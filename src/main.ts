/**
 * 薪酬管理系统主入口文件
 */

// 导入核心服务
import * as path from 'path';
import { ipcMain } from 'electron'; // Added for IPC
import { Database, DatabaseConfig } from './db/database';
import { PayrollServiceImpl } from './services/payrollService.impl';
import { PayrollResult } from './services/payrollService'; // Added for type hint
import { ImportService } from './services/importService';
import { ExportService } from './services/exportService';
import { SocialInsuranceService } from './services/socialInsuranceService';
import { TaxService } from './services/taxService';

// 环境检测
const isElectron = process.versions && process.versions.electron;
let electronApp: any;
let BrowserWindow: any;

// 仅在Electron环境中导入electron模块
if (isElectron) {
  const electron = require('electron');
  electronApp = electron.app;
  BrowserWindow = electron.BrowserWindow;
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
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

/**
 * 创建主窗口
 */
function createMainWindow() {
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
  try {
    // 初始化应用
    await initializeApp();
    
    // 判断运行环境
    if (isElectron && electronApp) {
      // Electron环境 - 启动UI界面
      electronApp.whenReady().then(() => {
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

// 启动应用
startApp();

// IPC Handlers for PayrollService
// Ensure services are initialized before setting up handlers if they depend on async init
// For now, assuming PayrollServiceImpl can be instantiated directly
const payrollService = new PayrollServiceImpl();

ipcMain.handle('payroll:calculateEmployeeSalary', async (event, employeeId: number, yearMonth: string): Promise<PayrollResult> => {
  try {
    console.log(`[IPC Main] Received payroll:calculateEmployeeSalary for ${employeeId}, ${yearMonth}`);
    const result = await payrollService.calculateEmployeeSalary(employeeId, yearMonth);
    console.log(`[IPC Main] Sending result for payroll:calculateEmployeeSalary:`, result);
    return result;
  } catch (error) {
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
  } catch (error) {
    console.error('[IPC Main] Error in payroll:batchCalculateSalary:', error);
    throw error; // Propagate error to the renderer process
  }
});

// Add other IPC handlers for other services if needed
// e.g., for ImportService, ExportService, etc.

// IPC Handlers for SalaryGroupService and SalaryItemService
import { SalaryGroupServiceImpl } from './services/salaryGroupService.impl';
import { SalaryItemServiceImpl } from './services/salaryItemService.impl';

const salaryGroupService = new SalaryGroupServiceImpl();
const salaryItemService = new SalaryItemServiceImpl();

ipcMain.handle('salaryGroup:getAllSalaryGroups', async () => {
  try {
    console.log('[IPC Main] Received salaryGroup:getAllSalaryGroups');
    const groups = await salaryGroupService.getAllSalaryGroups();
    console.log('[IPC Main] Sending result for salaryGroup:getAllSalaryGroups:', groups.length);
    return groups;
  } catch (error) {
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
  } catch (error) {
    console.error('[IPC Main] Error in salaryItem:getAllSalaryItems:', error);
    throw error; // Propagate error to the renderer process
  }
});

ipcMain.handle('salaryGroup:createSalaryGroup', async (event, salaryGroupData) => {
  try {
    console.log('[IPC Main] Received salaryGroup:createSalaryGroup', salaryGroupData);
    const result = await salaryGroupService.createSalaryGroup(salaryGroupData);
    console.log('[IPC Main] Sending result for salaryGroup:createSalaryGroup:', result);
    return result;
  } catch (error) {
    console.error('[IPC Main] Error in salaryGroup:createSalaryGroup:', error);
    throw error; // Propagate error to the renderer process
  }
});

ipcMain.handle('salaryGroup:updateSalaryGroup', async (event, id, salaryGroupData) => {
  try {
    console.log('[IPC Main] Received salaryGroup:updateSalaryGroup', id, salaryGroupData);
    const result = await salaryGroupService.updateSalaryGroup(id, salaryGroupData);
    console.log('[IPC Main] Sending result for salaryGroup:updateSalaryGroup:', result);
    return result;
  } catch (error) {
    console.error('[IPC Main] Error in salaryGroup:updateSalaryGroup:', error);
    throw error; // Propagate error to the renderer process
  }
});

ipcMain.handle('salaryGroup:deleteSalaryGroup', async (event, id) => {
  try {
    console.log('[IPC Main] Received salaryGroup:deleteSalaryGroup', id);
    const result = await salaryGroupService.deleteSalaryGroup(id);
    console.log('[IPC Main] Sending result for salaryGroup:deleteSalaryGroup:', result);
    return result;
  } catch (error) {
    console.error('[IPC Main] Error in salaryGroup:deleteSalaryGroup:', error);
    throw error; // Propagate error to the renderer process
  }
});

ipcMain.handle('salaryGroup:assignSalaryGroupToEmployees', async (event, groupId, records) => {
  try {
    console.log('[IPC Main] Received salaryGroup:assignSalaryGroupToEmployees', groupId, records);
    const result = await salaryGroupService.assignSalaryGroupToEmployee(groupId, records);
    console.log('[IPC Main] Sending result for salaryGroup:assignSalaryGroupToEmployees:', result);
    return result;
  } catch (error) {
    console.error('[IPC Main] Error in salaryGroup:assignSalaryGroupToEmployees:', error);
    throw error; // Propagate error to the renderer process
  }
});