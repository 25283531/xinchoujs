/**
 * 错误处理工具类
 * 提供统一的错误处理功能
 */

import { Logger } from './logger';

/**
 * 自定义错误类型
 */
export enum ErrorType {
  // 数据库错误
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',      // 数据库连接错误
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',               // 数据库查询错误
  DB_TRANSACTION_ERROR = 'DB_TRANSACTION_ERROR',   // 数据库事务错误
  DB_MIGRATION_ERROR = 'DB_MIGRATION_ERROR',       // 数据库迁移错误
  DB_SCHEMA_ERROR = 'DB_SCHEMA_ERROR',             // 数据库结构错误
  
  // 业务逻辑错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // 数据验证错误
  CALCULATION_ERROR = 'CALCULATION_ERROR',         // 计算错误
  IMPORT_ERROR = 'IMPORT_ERROR',                   // 数据导入错误
  EXPORT_ERROR = 'EXPORT_ERROR',                   // 数据导出错误
  
  // 系统错误
  SYSTEM_ERROR = 'SYSTEM_ERROR',                   // 系统错误
  CONFIG_ERROR = 'CONFIG_ERROR',                   // 配置错误
  NETWORK_ERROR = 'NETWORK_ERROR',                 // 网络错误
  
  // 其他错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'                  // 未知错误
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public type: ErrorType;
  public details?: any;
  public timestamp: Date;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN_ERROR, details?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
    
    // 支持堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 创建特定类型的错误
 * @param message 错误消息
 * @param type 错误类型
 * @param details 错误详情
 * @returns 自定义错误对象
 */
export function createError(message: string, type: ErrorType, details?: any): AppError {
  return new AppError(message, type, details);
}

/**
 * 创建数据库错误
 * @param message 错误消息
 * @param details 错误详情
 * @returns 数据库错误对象
 */
export function createDbError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.DB_QUERY_ERROR, details);
}

/**
 * 全局错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  
  private constructor() {
    this.logger = Logger.getInstance();
  }
  
  /**
   * 获取错误处理器实例（单例模式）
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * 处理错误
   * @param error 错误对象
   * @param context 错误上下文
   */
  public handleError(error: Error | AppError, context?: string): void {
    try {
      // 获取错误信息
      const errorMessage = error.message;
      const errorStack = error.stack;
      const errorType = error instanceof AppError ? error.type : ErrorType.UNKNOWN_ERROR;
      const errorDetails = error instanceof AppError ? error.details : undefined;
      const contextInfo = context ? `[${context}] ` : '';
      
      // 记录错误日志
      this.logger.error(
        `${contextInfo}${errorMessage}`,
        {
          type: errorType,
          stack: errorStack,
          details: errorDetails
        }
      );
      
      // 根据错误类型采取不同处理策略
      this.handleByErrorType(errorType, error);
      
    } catch (handlingError) {
      // 处理错误的过程中出现了新错误
      console.error('处理错误时发生异常:', handlingError);
      console.error('原始错误:', error);
    }
  }
  
  /**
   * 根据错误类型处理错误
   * @param errorType 错误类型
   * @param error 错误对象
   */
  private handleByErrorType(errorType: ErrorType, error: Error | AppError): void {
    switch (errorType) {
      case ErrorType.DB_CONNECTION_ERROR:
        // 数据库连接错误处理
        console.error('数据库连接错误，请检查数据库配置或连接。', error.message);
        break;
        
      case ErrorType.DB_QUERY_ERROR:
        // 数据库查询错误处理
        console.error('数据库查询错误，请检查SQL语句或数据结构。', error.message);
        break;
        
      case ErrorType.DB_TRANSACTION_ERROR:
        // 数据库事务错误处理
        console.error('数据库事务错误，事务已回滚。', error.message);
        break;
        
      case ErrorType.DB_MIGRATION_ERROR:
        // 数据库迁移错误处理
        console.error('数据库迁移错误，可能需要手动修复。', error.message);
        break;
        
      case ErrorType.DB_SCHEMA_ERROR:
        // 数据库结构错误处理
        console.error('数据库结构错误，请检查表或列定义。', error.message);
        break;
        
      case ErrorType.VALIDATION_ERROR:
        // 数据验证错误处理
        console.error('数据验证错误，请检查输入数据。', error.message);
        break;
        
      case ErrorType.CALCULATION_ERROR:
        // 计算错误处理
        console.error('计算错误，请检查计算公式或数据。', error.message);
        break;
        
      case ErrorType.IMPORT_ERROR:
        // 数据导入错误处理
        console.error('数据导入错误，请检查导入文件格式或内容。', error.message);
        break;
        
      case ErrorType.EXPORT_ERROR:
        // 数据导出错误处理
        console.error('数据导出错误，请检查导出设置或目标路径。', error.message);
        break;
        
      case ErrorType.SYSTEM_ERROR:
        // 系统错误处理
        console.error('系统错误，请联系系统管理员。', error.message);
        break;
        
      case ErrorType.CONFIG_ERROR:
        // 配置错误处理
        console.error('配置错误，请检查系统配置。', error.message);
        break;
        
      case ErrorType.NETWORK_ERROR:
        // 网络错误处理
        console.error('网络错误，请检查网络连接。', error.message);
        break;
        
      default:
        // 未知错误处理
        console.error('发生未知错误。', error.message);
        break;
    }
  }
  
  /**
   * 捕获异步方法中的错误并处理
   * @param asyncFn 异步函数
   * @param context 错误上下文
   * @returns 包装后的异步函数
   */
  public static catchAsync<T>(
    asyncFn: (...args: any[]) => Promise<T>,
    context?: string
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        ErrorHandler.getInstance().handleError(error as Error, context);
        throw error;
      }
    };
  }
  
  /**
   * 处理数据库操作中的错误
   * @param operation 数据库操作函数
   * @param errorMessage 错误消息
   * @param defaultValue 默认返回值
   * @param context 错误上下文
   * @returns 操作结果或默认值
   */
  public static async handleDbOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    defaultValue: T,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = new AppError(
        errorMessage,
        ErrorType.DB_QUERY_ERROR,
        { originalError: error }
      );
      
      ErrorHandler.getInstance().handleError(appError, context);
      return defaultValue;
    }
  }
}

/**
 * 创建装饰器，用于捕获方法中的错误
 * @param context 错误上下文
 * @returns 方法装饰器
 */
export function CatchError(context?: string): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);
        
        // 检查返回值是否是Promise
        if (result && typeof result.then === 'function') {
          return result.catch((error: Error) => {
            ErrorHandler.getInstance().handleError(error, context || String(propertyKey));
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        ErrorHandler.getInstance().handleError(error as Error, context || String(propertyKey));
        throw error;
      }
    };
    
    return descriptor;
  };
}
