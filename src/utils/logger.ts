/**
 * 日志工具类
 * 提供统一的日志记录功能
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * 日志记录器类
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logFilePath: string = './logs/app.log';
  
  /**
   * 获取日志记录器实例（单例模式）
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * 配置日志记录器
   * @param level 日志级别
   * @param logFilePath 日志文件路径
   */
  public configure(level: LogLevel, logFilePath?: string): void {
    this.logLevel = level;
    if (logFilePath) {
      this.logFilePath = logFilePath;
    }
    
    // 确保日志目录存在
    this.ensureLogDirectory();
  }
  
  /**
   * 记录调试日志
   * @param message 日志消息
   * @param data 附加数据
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * 记录信息日志
   * @param message 日志消息
   * @param data 附加数据
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * 记录警告日志
   * @param message 日志消息
   * @param data 附加数据
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * 记录错误日志
   * @param message 日志消息
   * @param error 错误对象
   * @param data 附加数据
   */
  public error(message: string, error?: any, data?: any): void {
    this.log(LogLevel.ERROR, message, { error, data });
  }
  
  /**
   * 记录致命错误日志
   * @param message 日志消息
   * @param error 错误对象
   * @param data 附加数据
   */
  public fatal(message: string, error?: any, data?: any): void {
    this.log(LogLevel.FATAL, message, { error, data });
  }
  
  /**
   * 记录数据库操作日志
   * @param operation 操作类型
   * @param entity 实体类型
   * @param message 日志消息
   * @param data 附加数据
   */
  public dbOperation(operation: string, entity: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, `[DB:${operation}:${entity}] ${message}`, data);
  }
  
  /**
   * 记录数据库错误日志
   * @param operation 操作类型
   * @param entity 实体类型
   * @param message 错误消息
   * @param error 错误对象
   * @param data 附加数据
   */
  public dbError(operation: string, entity: string, message: string, error: any, data?: any): void {
    this.log(LogLevel.ERROR, `[DB:${operation}:${entity}] ${message}`, { error, data });
  }
  
  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 检查日志级别
    if (this.shouldLog(level)) {
      const logEntry = this.formatLogEntry(level, message, data);
      
      // 输出到控制台
      this.consoleLog(level, logEntry);
      
      // 写入日志文件
      this.writeToFile(logEntry);
    }
  }
  
  /**
   * 检查是否应该记录该级别的日志
   * @param level 日志级别
   * @returns 是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
  
  /**
   * 格式化日志条目
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   * @returns 格式化后的日志条目
   */
  private formatLogEntry(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataString = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataString}`;
  }
  
  /**
   * 输出到控制台
   * @param level 日志级别
   * @param logEntry 日志条目
   */
  private consoleLog(level: LogLevel, logEntry: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logEntry);
        break;
      case LogLevel.INFO:
        console.info(logEntry);
        break;
      case LogLevel.WARN:
        console.warn(logEntry);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logEntry);
        break;
    }
  }
  
  /**
   * 写入日志文件
   * @param logEntry 日志条目
   */
  private writeToFile(logEntry: string): void {
    // 实际应用中，这里需要异步写入日志文件
    // 简化版本，只在控制台显示
    // const fs = require('fs');
    // fs.appendFileSync(this.logFilePath, logEntry + '\n');
  }
  
  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    // 实际应用中，这里需要创建日志目录
    // const fs = require('fs');
    // const path = require('path');
    // const dir = path.dirname(this.logFilePath);
    // 
    // if (!fs.existsSync(dir)) {
    //   fs.mkdirSync(dir, { recursive: true });
    // }
  }
}
