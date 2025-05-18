/**
 * 数据库迁移基础类和接口定义
 * 提供统一的迁移脚本结构和版本控制
 */

import { Database } from '../database';

/**
 * 迁移脚本接口
 */
export interface Migration {
  /**
   * 迁移版本号，格式为YYYYMMDDNN，例如：2023060101
   * YYYYMMDD为日期，NN为当天的序号，从01开始
   */
  version: number;
  
  /**
   * 迁移名称，简短描述迁移的目的
   */
  name: string;
  
  /**
   * 执行迁移
   */
  up(): Promise<void>;
  
  /**
   * 回滚迁移（可选）
   */
  down?(): Promise<void>;
}

/**
 * 抽象迁移基类
 * 所有迁移脚本都应该继承此类
 */
export abstract class BaseMigration implements Migration {
  abstract version: number;
  abstract name: string;
  
  /**
   * 获取数据库连接
   */
  protected getDb() {
    return Database.getInstance().getConnection();
  }
  
  /**
   * 执行迁移
   */
  abstract up(): Promise<void>;
  
  /**
   * 回滚迁移（可选）
   */
  down?(): Promise<void>;
  
  /**
   * 记录迁移日志
   * @param message 日志消息
   */
  protected log(message: string): void {
    console.log(`[迁移 ${this.version}] ${message}`);
  }
  
  /**
   * 记录迁移错误
   * @param message 错误消息
   * @param error 错误对象
   */
  protected logError(message: string, error: any): void {
    console.error(`[迁移 ${this.version}] ${message}:`, error);
  }
}