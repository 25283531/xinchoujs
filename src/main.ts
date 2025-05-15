/**
 * 薪酬管理系统主入口文件
 */

// 导入核心服务
import { PayrollService } from './services/payrollService';
import { ImportService } from './services/importService';
import { ExportService } from './services/exportService';
import { SocialInsuranceService } from './services/socialInsuranceService';
import { TaxService } from './services/taxService';

/**
 * 应用初始化函数
 */
async function initializeApp() {
  console.log('薪酬管理系统初始化中...');
  
  // 初始化数据库连接
  // await initDatabase();
  
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
    
    // 启动UI界面
    // await startUI();
    
    console.log('薪酬管理系统启动成功');
  } catch (error) {
    console.error('薪酬管理系统启动失败:', error);
  }
}

// 启动应用
startApp();