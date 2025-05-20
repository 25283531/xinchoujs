/**
 * 数据库配置文件
 * 集中管理数据库路径和配置
 */

import * as path from 'path';
import { DatabaseConfig } from '../db/database';

/**
 * 获取数据库配置
 * @param isDevelopment 是否为开发环境
 * @returns 数据库配置对象
 */
export function getDatabaseConfig(isDevelopment: boolean = false): DatabaseConfig {
  // 统一使用payroll.db作为数据库名称
  const dbPath = path.join(__dirname, '../../data/payroll.db');
  
  return {
    filename: dbPath,
    verbose: isDevelopment
  };
}

/**
 * 获取数据库文件路径
 * @returns 数据库文件的绝对路径
 */
export function getDatabasePath(): string {
  return path.join(__dirname, '../../data/payroll.db');
}