/**
 * 薪酬组数据库仓库
 * 负责薪酬组的数据库访问操作
 */

import { Database } from './database';
import { SalaryGroup } from '../services/payrollService';
import { BaseRepository } from './baseRepository';
import { AppError, ErrorHandler, ErrorType } from '../utils/errorHandler';
import { Logger } from '../utils/logger';
import { checkTableExists, checkColumnExists } from './utils/dbUtils';

export class SalaryGroupRepository extends BaseRepository {
  constructor() {
    super('salary_groups');
  }
  
  /**
   * 将数据库行映射为实体对象
   * @param row 数据库行
   * @returns 实体对象
   */
  protected mapToEntity<SalaryGroup>(row: any): SalaryGroup {
    return this.mapToSalaryGroup(row) as unknown as SalaryGroup;
  }

  /**
   * 获取所有薪酬组
   * @returns 薪酬组列表
   */
  public async getAllSalaryGroups(): Promise<SalaryGroup[]> {
    const errorMsg = '获取所有薪酬组失败';
    
    return this.safeExecute<SalaryGroup[]>(
      async () => {
        // 首先验证表是否存在
        const tableExists = await this.checkTableExists();
        if (!tableExists) {
          this.logger.warn(`表 ${this.tableName} 不存在`);
          throw new AppError(`表 ${this.tableName} 不存在`, ErrorType.DB_SCHEMA_ERROR);
        }
        
        // 查询所有薪酬组
        const rows = await this.db.all(`SELECT * FROM ${this.tableName} ORDER BY id`);
        const salaryGroups: SalaryGroup[] = [];
        
        // 遍历获取每个薪酬组的项目
        for (const row of rows) {
          const group = this.mapToSalaryGroup(row);
          const items = await this.getSalaryGroupItems(group.id);
          group.items = items;
          salaryGroups.push(group);
        }
        
        this.logger.dbOperation('SELECT', this.tableName, `成功获取 ${salaryGroups.length} 个薪酬组`);
        return salaryGroups;
      },
      errorMsg,
      []
    );
  }

  /**
   * 根据ID获取薪酬组
   * @param id 薪酬组ID
   * @returns 薪酬组
   */
  public async getSalaryGroupById(id: number): Promise<SalaryGroup | null> {
    const errorMsg = `获取薪酬组 ID ${id} 失败`;
    
    return this.safeExecute<SalaryGroup | null>(
      async () => {
        // 验证表是否存在
        const tableExists = await this.checkTableExists();
        if (!tableExists) {
          this.logger.warn(`表 ${this.tableName} 不存在`);
          throw new AppError(`表 ${this.tableName} 不存在`, ErrorType.DB_SCHEMA_ERROR);
        }
        
        // 查询指定薪酬组
        const row = await this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        
        if (!row) {
          this.logger.info(`未找到 ID 为 ${id} 的薪酬组`);
          return null;
        }
        
        // 获取薪酬组项目
        const group = this.mapToSalaryGroup(row);
        const items = await this.getSalaryGroupItems(group.id);
        group.items = items;
        
        this.logger.dbOperation('SELECT', this.tableName, `成功获取薪酬组 ID ${id}`);
        return group;
      },
      errorMsg,
      null
    );
  }

  /**
   * 创建薪酬组
   * @param salaryGroup 薪酬组数据
   * @returns 创建的薪酬组ID
   */
  public async createSalaryGroup(salaryGroup: Omit<SalaryGroup, 'id'>): Promise<number> {
    const errorMsg = `创建薪酬组 ${salaryGroup.name} 失败`;
    
    return this.safeExecute<number>(
      async () => {
        // 验证表是否存在
        const tableExists = await this.checkTableExists();
        if (!tableExists) {
          this.logger.warn(`表 ${this.tableName} 不存在`);
          throw new AppError(`表 ${this.tableName} 不存在`, ErrorType.DB_SCHEMA_ERROR);
        }

        // 验证关键字段是否存在
        const nameExists = await this.checkColumnExists('name');
        if (!nameExists) {
          throw new AppError(`表 ${this.tableName} 缺少 name 字段`, ErrorType.DB_SCHEMA_ERROR);
        }
        
        // 获取数据库连接
        const connection = this.db.getConnection();
        
        // 开始事务
        await connection.exec('BEGIN TRANSACTION');
        
        try {
          // 插入薪酬组
          const result = await connection.run(
            `INSERT INTO ${this.tableName} (name, description) VALUES (?, ?)`,
            [salaryGroup.name, salaryGroup.description || null]
          );
          
          const salaryGroupId = result.lastID;
          this.logger.dbOperation('INSERT', this.tableName, `创建薪酬组 ID ${salaryGroupId}`);
          
          // 检查salary_group_items表是否存在
          const itemsTableExists = await checkTableExists(this.db, 'salary_group_items');
          if (!itemsTableExists) {
            throw new AppError(`表 salary_group_items 不存在`, ErrorType.DB_SCHEMA_ERROR);
          }
          
          // 检查是否有calculation_order字段
          const columnExists = await checkColumnExists(this.db, 'salary_group_items', 'calculation_order');
          
          // 插入薪酬组项目
          for (const item of salaryGroup.items) {
            if (columnExists) {
              await connection.run(
                'INSERT INTO salary_group_items (salary_group_id, salary_item_id, calculation_order) VALUES (?, ?, ?)',
                [salaryGroupId, item.salaryItemId, item.calculationOrder]
              );
            } else {
              // 如果没有calculation_order字段，则不包含该字段
              await connection.run(
                'INSERT INTO salary_group_items (salary_group_id, salary_item_id) VALUES (?, ?)',
                [salaryGroupId, item.salaryItemId]
              );
            }
            this.logger.dbOperation('INSERT', 'salary_group_items', `关联薪酬项目 ID ${item.salaryItemId} 到薪酬组 ID ${salaryGroupId}`);
          }
          
          // 提交事务
          await connection.exec('COMMIT');
          
          return salaryGroupId;
        } catch (error) {
          // 回滚事务
          await connection.exec('ROLLBACK');
          if (error instanceof AppError) {
            throw error;
          } else {
            this.logger.error(`创建薪酬组错误: ${error instanceof Error ? error.message : String(error)}`);
            throw new AppError(`创建薪酬组失败`, ErrorType.DB_TRANSACTION_ERROR, error);
          }
        }
      },
      errorMsg,
      0
    );
  }

  /**
   * 更新薪酬组
   * @param id 薪酬组ID
   * @param salaryGroup 薪酬组数据
   * @returns 是否成功更新
   */
  public async updateSalaryGroup(id: number, salaryGroup: Omit<SalaryGroup, 'id'>): Promise<boolean> {
    const errorMsg = `更新薪酬组 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 验证薪酬组是否存在
        const existingGroup = await this.getSalaryGroupById(id);
        if (!existingGroup) {
          this.logger.warn(`要更新的薪酬组 ID ${id} 不存在`);
          throw new AppError(`薪酬组 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 获取数据库连接
        const connection = this.db.getConnection();
        
        // 开始事务
        await connection.exec('BEGIN TRANSACTION');
        
        try {
          // 更新薪酬组
          await connection.run(
            `UPDATE ${this.tableName} SET name = ?, description = ? WHERE id = ?`,
            [salaryGroup.name, salaryGroup.description || null, id]
          );
          
          this.logger.dbOperation('UPDATE', this.tableName, `更新薪酬组 ID ${id}`);
          
          // 检查salary_group_items表是否存在
          const itemsTableExists = await checkTableExists(this.db, 'salary_group_items');
          if (!itemsTableExists) {
            throw new AppError(`表 salary_group_items 不存在`, ErrorType.DB_SCHEMA_ERROR);
          }
          
          // 删除原有薪酬组项目
          await connection.run('DELETE FROM salary_group_items WHERE salary_group_id = ?', [id]);
          this.logger.dbOperation('DELETE', 'salary_group_items', `删除薪酬组 ID ${id} 的所有项目`);
          
          // 检查是否有calculation_order字段
          const columnExists = await checkColumnExists(this.db, 'salary_group_items', 'calculation_order');
          
          // 插入新的薪酬组项目
          for (const item of salaryGroup.items) {
            if (columnExists) {
              await connection.run(
                'INSERT INTO salary_group_items (salary_group_id, salary_item_id, calculation_order) VALUES (?, ?, ?)',
                [id, item.salaryItemId, item.calculationOrder]
              );
            } else {
              // 如果没有calculation_order字段，则不包含该字段
              await connection.run(
                'INSERT INTO salary_group_items (salary_group_id, salary_item_id) VALUES (?, ?)',
                [id, item.salaryItemId]
              );
            }
            this.logger.dbOperation('INSERT', 'salary_group_items', `关联薪酬项目 ID ${item.salaryItemId} 到薪酬组 ID ${id}`);
          }
          
          // 提交事务
          await connection.exec('COMMIT');
          return true;
        } catch (error) {
          // 回滚事务
          await connection.exec('ROLLBACK');
          if (error instanceof AppError) {
            throw error;
          } else {
            this.logger.error(`更新薪酬组错误: ${error instanceof Error ? error.message : String(error)}`);
            throw new AppError(`更新薪酬组失败`, ErrorType.DB_TRANSACTION_ERROR, error);
          }
        }
      },
      errorMsg,
      false
    );
  }

  /**
   * 删除薪酬组
   * @param id 薪酬组ID
   * @returns 是否成功删除
   */
  public async deleteSalaryGroup(id: number): Promise<boolean> {
    const errorMsg = `删除薪酬组 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 验证薪酬组是否存在
        const existingGroup = await this.getSalaryGroupById(id);
        if (!existingGroup) {
          this.logger.warn(`要删除的薪酬组 ID ${id} 不存在`);
          throw new AppError(`薪酬组 ID ${id} 不存在`, ErrorType.VALIDATION_ERROR);
        }
        
        // 获取数据库连接
        const connection = this.db.getConnection();
        
        // 开始事务
        await connection.exec('BEGIN TRANSACTION');
        
        try {
          // 检查salary_group_items表是否存在
          const itemsTableExists = await checkTableExists(this.db, 'salary_group_items');
          
          // 删除薪酬组项目
          if (itemsTableExists) {
            await connection.run('DELETE FROM salary_group_items WHERE salary_group_id = ?', [id]);
            this.logger.dbOperation('DELETE', 'salary_group_items', `删除薪酬组 ID ${id} 的所有项目`);
          }
          
          // 删除薪酬组
          await connection.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
          this.logger.dbOperation('DELETE', this.tableName, `删除薪酬组 ID ${id}`);
          
          // 提交事务
          await connection.exec('COMMIT');
          return true;
        } catch (error) {
          // 回滚事务
          await connection.exec('ROLLBACK');
          if (error instanceof AppError) {
            throw error;
          } else {
            this.logger.error(`删除薪酬组错误: ${error instanceof Error ? error.message : String(error)}`);
            throw new AppError(`删除薪酬组失败`, ErrorType.DB_TRANSACTION_ERROR, error);
          }
        }
      },
      errorMsg,
      false
    );
  }

  /**
   * 获取薪酬组项目
   * @param salaryGroupId 薪酬组ID
   * @returns 薪酬组项目列表
   */
  private async getSalaryGroupItems(salaryGroupId: number): Promise<Array<{salaryItemId: number; calculationOrder: number}>> {
    const errorMsg = `获取薪酬组 ID ${salaryGroupId} 的项目失败`;
    
    return this.safeExecute<Array<{salaryItemId: number; calculationOrder: number}>>(
      async () => {
        // 验证表是否存在
        const tableExists = await checkTableExists(this.db, 'salary_group_items');
        if (!tableExists) {
          // 如果表不存在，返回空数组而不是抛出异常
          this.logger.warn(`表 salary_group_items 不存在，无法获取薪酬组项目`);
          return [];
        }
        
        // 检查是否有calculation_order字段
        const hasCalculationOrder = await checkColumnExists(this.db, 'salary_group_items', 'calculation_order');
        
        // 根据字段存在与否构建不同的SQL
        let sql = '';
        if (hasCalculationOrder) {
          sql = 'SELECT salary_item_id, calculation_order FROM salary_group_items WHERE salary_group_id = ? ORDER BY calculation_order';
        } else {
          sql = 'SELECT salary_item_id, 0 as calculation_order FROM salary_group_items WHERE salary_group_id = ?';
        }
        
        const rows = await this.db.all(sql, [salaryGroupId]);
        
        // 映射行数据为项目对象
        const items = rows.map((row: {salary_item_id: number; calculation_order: number}) => ({
          salaryItemId: row.salary_item_id,
          calculationOrder: row.calculation_order || 0
        }));
        
        this.logger.dbOperation('SELECT', 'salary_group_items', `获取薪酬组 ID ${salaryGroupId} 的 ${items.length} 个项目`);
        return items;
      },
      errorMsg,
      [] // 默认返回空数组
    );
  }

  /**
   * 将数据库行映射为薪酬组对象
   * @param row 数据库行
   * @returns 薪酬组对象
   */
  private mapToSalaryGroup(row: {id: number; name: string; description: string | null}): SalaryGroup {
    if (!row) {
      this.logger.warn('尝试将null映射为薪酬组对象');
      throw new AppError('无法将空行映射为薪酬组对象', ErrorType.VALIDATION_ERROR);
    }
    
    if (row.id === undefined || row.name === undefined) {
      this.logger.warn('薪酬组行数据缺少必要字段', { row });
      throw new AppError('薪酬组缺少必要字段（id或name）', ErrorType.VALIDATION_ERROR);
    }
    
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      items: []
    };
  }
}