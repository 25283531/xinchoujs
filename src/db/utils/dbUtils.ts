/**
 * 数据库工具类
 * 提供通用的数据库操作工具函数
 */

import { Database } from '../database';

/**
 * 检查表是否存在
 * @param db 数据库连接
 * @param tableName 表名
 * @returns 表是否存在
 */
export async function checkTableExists(
  db: any,
  tableName: string
): Promise<boolean> {
  try {
    const result = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return !!result;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在时出错:`, error);
    return false;
  }
}

/**
 * 检查表中是否存在指定列
 * @param db 数据库连接
 * @param tableName 表名
 * @param columnName 列名
 * @returns 列是否存在
 */
export async function checkColumnExists(
  db: any,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
    return tableInfo.some((column: { name: string }) => column.name === columnName);
  } catch (error) {
    console.error(`检查表 ${tableName} 中列 ${columnName} 是否存在时出错:`, error);
    return false;
  }
}

/**
 * 构建动态SQL更新语句，根据表中存在的列进行更新
 * @param db 数据库连接
 * @param tableName 表名
 * @param columns 列名数组
 * @param values 对应的值数组
 * @param whereClause WHERE子句
 * @param whereParams WHERE子句参数
 * @returns 构建的SQL语句和参数数组
 */
export async function buildDynamicUpdateSql(
  db: any,
  tableName: string,
  columns: string[],
  values: any[],
  whereClause: string,
  whereParams: any[]
): Promise<{ sql: string; params: any[] }> {
  // 检查表是否存在
  const tableExists = await checkTableExists(db, tableName);
  if (!tableExists) {
    throw new Error(`表 ${tableName} 不存在`);
  }

  // 过滤出存在的列
  const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
  const existingColumns: string[] = tableInfo.map((col: any) => col.name);

  const updateColumns: string[] = [];
  const updateParams: any[] = [];

  for (let i = 0; i < columns.length; i++) {
    if (existingColumns.includes(columns[i])) {
      updateColumns.push(`${columns[i]} = ?`);
      updateParams.push(values[i]);
    }
  }

  if (updateColumns.length === 0) {
    throw new Error(`表 ${tableName} 中没有可更新的有效列`);
  }

  // 构建SQL更新语句
  const sql = `UPDATE ${tableName} SET ${updateColumns.join(', ')} WHERE ${whereClause}`;
  return { sql, params: [...updateParams, ...whereParams] };
}

/**
 * 构建动态SQL插入语句，根据表中存在的列进行插入
 * @param db 数据库连接
 * @param tableName 表名
 * @param columns 列名数组
 * @param values 对应的值数组
 * @returns 构建的SQL语句和参数数组
 */
export async function buildDynamicInsertSql(
  db: any,
  tableName: string,
  columns: string[],
  values: any[]
): Promise<{ sql: string; params: any[] }> {
  // 检查表是否存在
  const tableExists = await checkTableExists(db, tableName);
  if (!tableExists) {
    throw new Error(`表 ${tableName} 不存在`);
  }

  // 过滤出存在的列
  const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
  const existingColumns: string[] = tableInfo.map((col: any) => col.name);

  const insertColumns: string[] = [];
  const insertParams: any[] = [];
  const placeholders: string[] = [];

  for (let i = 0; i < columns.length; i++) {
    if (existingColumns.includes(columns[i])) {
      insertColumns.push(columns[i]);
      insertParams.push(values[i]);
      placeholders.push('?');
    }
  }

  if (insertColumns.length === 0) {
    throw new Error(`表 ${tableName} 中没有可插入的有效列`);
  }

  // 构建SQL插入语句
  const sql = `INSERT INTO ${tableName} (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, params: insertParams };
}

/**
 * 执行数据库操作并处理异常
 * @param operation 操作函数
 * @param errorMessage 错误消息
 * @param defaultValue 默认返回值（出错时）
 * @returns 操作结果或默认值
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  defaultValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    return defaultValue;
  }
}

/**
 * 执行数据库事务操作并处理异常
 * @param db 数据库连接
 * @param operations 事务内的操作函数
 * @param errorMessage 错误消息
 * @returns 是否成功
 */
export async function executeTransactionOperation(
  db: any,
  operations: () => Promise<void>,
  errorMessage: string
): Promise<boolean> {
  try {
    await db.exec('BEGIN TRANSACTION');
    await operations();
    await db.exec('COMMIT');
    return true;
  } catch (error) {
    console.error(errorMessage, error);
    await db.exec('ROLLBACK');
    return false;
  }
}
