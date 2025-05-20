/**
 * 数据库仓库基类
 * 提供通用的数据库操作方法和错误处理
 */

import { Database } from './database';
import { Logger } from '../utils/logger';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { checkTableExists, checkColumnExists } from './utils/dbUtils';

/**
 * 仓库基类，所有数据库仓库类都应继承此类
 */
export abstract class BaseRepository {
  protected db: any;
  protected logger: Logger;
  protected errorHandler: ErrorHandler;
  protected tableName: string;

  /**
   * 构造函数
   * @param tableName 表名
   */
  constructor(tableName: string) {
    this.db = Database.getInstance().getConnection();
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.tableName = tableName;
  }

  /**
   * 检查表是否存在
   * @returns 表是否存在
   */
  protected async checkTableExists(): Promise<boolean> {
    return checkTableExists(this.db, this.tableName);
  }

  /**
   * 检查列是否存在
   * @param columnName 列名
   * @returns 列是否存在
   */
  protected async checkColumnExists(columnName: string): Promise<boolean> {
    return checkColumnExists(this.db, this.tableName, columnName);
  }

  /**
   * 执行安全的数据库查询（带错误处理）
   * @param operation 查询操作函数
   * @param errorMessage 错误消息
   * @param defaultValue 查询失败时的默认返回值
   * @returns 查询结果或默认值
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    defaultValue: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.dbError('QUERY', this.tableName, errorMessage, error);
      return defaultValue;
    }
  }

  /**
   * 执行安全的数据库事务（带错误处理）
   * @param operations 事务操作函数
   * @param errorMessage 错误消息
   * @returns 是否成功
   */
  protected async safeTransaction(
    operations: () => Promise<void>,
    errorMessage: string
  ): Promise<boolean> {
    try {
      await this.db.exec('BEGIN TRANSACTION');
      await operations();
      await this.db.exec('COMMIT');
      this.logger.dbOperation('TRANSACTION', this.tableName, '事务执行成功');
      return true;
    } catch (error) {
      this.logger.dbError('TRANSACTION', this.tableName, errorMessage, error);
      await this.db.exec('ROLLBACK');
      return false;
    }
  }

  /**
   * 安全地获取单个实体
   * @param sql SQL语句
   * @param params 查询参数
   * @param errorMessage 错误消息
   * @returns 实体对象或null
   */
  protected async safeGetOne<T>(
    sql: string,
    params: any[],
    errorMessage: string
  ): Promise<T | null> {
    return this.safeExecute(
      async () => {
        const row = await this.db.get(sql, params);
        return row ? (this.mapToEntity(row) as T) : null;
      },
      errorMessage,
      null as any
    );
  }

  /**
   * 安全地获取多个实体
   * @param sql SQL语句
   * @param params 查询参数
   * @param errorMessage 错误消息
   * @returns 实体对象数组
   */
  protected async safeGetAll<T>(
    sql: string,
    params: any[],
    errorMessage: string
  ): Promise<T[]> {
    return this.safeExecute(
      async () => {
        const rows = await this.db.all(sql, params);
        return rows.map((row: any) => this.mapToEntity(row) as T);
      },
      errorMessage,
      [] as any
    );
  }

  /**
   * 安全地执行修改操作
   * @param sql SQL语句
   * @param params 查询参数
   * @param errorMessage 错误消息
   * @returns 是否成功
   */
  protected async safeRun(
    sql: string,
    params: any[],
    errorMessage: string
  ): Promise<boolean> {
    return this.safeExecute(
      async () => {
        await this.db.run(sql, params);
        return true;
      },
      errorMessage,
      false
    );
  }

  /**
   * 获取指定表的所有列名
   * @param tableName 表名
   * @returns 列名数组
   */
  protected async getColumnNames(tableName = this.tableName): Promise<string[]> {
    try {
      const tableInfo = await this.db.all(`PRAGMA table_info(${tableName})`);
      return tableInfo.map((column: any) => column.name);
    } catch (error) {
      this.logger.dbError('SCHEMA', tableName, '获取表结构失败', error);
      return [];
    }
  }

  /**
   * 根据表结构过滤有效的更新字段
   * @param fields 字段对象
   * @returns 过滤后的字段对象
   */
  protected async filterValidColumns(fields: Record<string, any>): Promise<Record<string, any>> {
    const columnNames = await this.getColumnNames();
    const validFields: Record<string, any> = {};
    
    for (const key in fields) {
      if (columnNames.includes(key)) {
        validFields[key] = fields[key];
      }
    }
    
    return validFields;
  }

  /**
   * 将数据库行映射为实体对象
   * 子类应该重写此方法
   * @param row 数据库行
   * @returns 实体对象
   */
  protected abstract mapToEntity(row: any): any;
}
