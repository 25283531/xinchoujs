/**
 * 薪酬项数据库仓库
 * 负责薪酬项的数据库访问操作
 */

import { BaseRepository } from './baseRepository';
import { SalaryItem } from '../services/payrollService';
import { ErrorType, AppError } from '../utils/errorHandler';

export class SalaryItemRepository extends BaseRepository {
  constructor() {
    super('salary_items');
  }
  
  /**
   * 将数据库行映射为薪酬项对象
   * @param row 数据库行
   * @returns 薪酬项对象
   */
  protected mapToEntity(row: any): SalaryItem {
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'fixed' | 'percentage' | 'formula',
      value: parseFloat(row.calculation_value),
      subsidyCycle: row.subsidy_cycle || null, // 处理可能不存在的subsidy_cycle字段
      isPreset: row.is_preset === 1,
      description: row.description,
      isDisplayed: row.is_displayed === 1
    };
  }

  /**
   * 获取所有薪酬项
   * @returns 薪酬项列表
   */
  public async getAllSalaryItems(): Promise<SalaryItem[]> {
    return this.safeGetAll<SalaryItem>(
      'SELECT * FROM salary_items WHERE is_displayed = 1 ORDER BY id',
      [],
      '获取所有薪酬项失败'
    );
  }

  /**
   * 获取预置薪酬项
   * @returns 预置薪酬项列表
   */
  public async getPresetSalaryItems(): Promise<SalaryItem[]> {
    return this.safeGetAll<SalaryItem>(
      'SELECT * FROM salary_items WHERE is_preset = 1 ORDER BY id',
      [],
      '获取预置薪酬项失败'
    );
  }

  /**
   * 获取自定义薪酬项
   * @returns 自定义薪酬项列表
   */
  public async getCustomSalaryItems(): Promise<SalaryItem[]> {
    return this.safeGetAll<SalaryItem>(
      'SELECT * FROM salary_items WHERE is_preset = 0 ORDER BY id',
      [],
      '获取自定义薪酬项失败'
    );
  }

  /**
   * 根据ID获取薪酬项
   * @param id 薪酬项ID
   * @returns 薪酬项
   */
  public async getSalaryItemById(id: number): Promise<SalaryItem | null> {
    return this.safeGetOne<SalaryItem>(
      'SELECT * FROM salary_items WHERE id = ?',
      [id],
      `根据ID ${id} 获取薪酬项失败`
    );
  }

  /**
   * 创建薪酬项
   * @param item 薪酬项信息
   * @returns 创建的薪酬项ID
   */
  public async createSalaryItem(item: Omit<SalaryItem, 'id'>): Promise<number> {
    const errorMsg = `创建薪酬项 ${item.name} 失败`;
    
    // 检查表结构是否有subsidy_cycle字段
    const hasSubsidyCycle = await this.checkColumnExists('subsidy_cycle');
    
    return this.safeExecute<number>(
      async () => {
        // 准备插入字段和值
        const columns: string[] = ['name', 'type', 'calculation_value', 'is_preset', 'description', 'code', 'is_displayed'];
        const values: any[] = [
          item.name,
          item.type,
          item.value.toString(),
          item.isPreset ? 1 : 0,
          item.description || '',
          item.name, // 使用名称作为代码
          1 // 设置is_displayed为1，确保显示
        ];
        
        // 如果表有subsidy_cycle字段，添加到插入字段中
        if (hasSubsidyCycle) {
          columns.push('subsidy_cycle');
          values.push(item.subsidyCycle);
        }
        
        // 构建动态SQL插入语句
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        // 执行插入操作
        const result = await this.db.run(sql, values);
        this.logger.dbOperation('INSERT', this.tableName, `创建薪酬项 ${item.name} 成功`);
        return result.lastID;
      },
      errorMsg,
      0
    );
  }

  /**
   * 更新薪酬项
   * @param id 薪酬项ID
   * @param item 薪酬项信息
   */
  public async updateSalaryItem(id: number, item: Partial<Omit<SalaryItem, 'id'>>): Promise<boolean> {
    const errorMsg = `更新薪酬项 ID ${id} 失败`;
    
    // 检查表结构是否有subsidy_cycle字段
    const hasSubsidyCycle = await this.checkColumnExists('subsidy_cycle');
    
    return this.safeExecute<boolean>(
      async () => {
        // 准备更新字段和值
        const updateFields: string[] = [];
        const params: any[] = [];
        
        if (item.name !== undefined) {
          updateFields.push('name = ?');
          params.push(item.name);
        }
        
        if (item.type !== undefined) {
          updateFields.push('type = ?');
          params.push(item.type);
        }
        
        if (item.value !== undefined) {
          updateFields.push('calculation_value = ?');
          params.push(item.value.toString());
        }
        
        if (hasSubsidyCycle && item.subsidyCycle !== undefined) {
          updateFields.push('subsidy_cycle = ?');
          params.push(item.subsidyCycle);
        }
        
        if (item.isPreset !== undefined) {
          updateFields.push('is_preset = ?');
          params.push(item.isPreset ? 1 : 0);
        }
        
        if (item.description !== undefined) {
          updateFields.push('description = ?');
          params.push(item.description);
        }
        
        if (item.isDisplayed !== undefined) {
          updateFields.push('is_displayed = ?');
          params.push(item.isDisplayed ? 1 : 0);
        }
        
        if (updateFields.length === 0) {
          this.logger.info(`没有需要更新的字段，薪酬项ID: ${id}`);
          return true; // 没有需要更新的字段，但不是错误
        }
        
        // 添加ID参数
        params.push(id);
        
        // 执行更新操作
        await this.db.run(
          `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`,
          params
        );
        
        this.logger.dbOperation('UPDATE', this.tableName, `更新薪酬项 ID ${id} 成功`);
        return true;
      },
      errorMsg,
      false
    );
  }

  /**
   * 删除薪酬项
   * @param id 薪酬项ID
   * @returns 是否成功删除
   */
  public async deleteSalaryItem(id: number): Promise<boolean> {
    const errorMsg = `删除薪酬项 ID ${id} 失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        // 检查薪酬项是否被引用
        const isReferenced = await this.isSalaryItemReferenced(id);
        if (isReferenced) {
          this.logger.warn(`薪酬项 ID ${id} 被薪酬组引用，无法删除`);
          throw new AppError(`薪酬项被薪酬组引用，无法删除`, ErrorType.VALIDATION_ERROR);
        }
        
        // 执行删除操作
        await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        
        this.logger.dbOperation('DELETE', this.tableName, `删除薪酬项 ID ${id} 成功`);
        return true;
      },
      errorMsg,
      false
    );
  }

  /**
   * 检查薪酬项是否被薪酬组引用
   * @param id 薪酬项ID
   * @returns 是否被引用
   */
  public async isSalaryItemReferenced(id: number): Promise<boolean> {
    const errorMsg = `检查薪酬项 ID ${id} 引用状态失败`;
    
    return this.safeExecute<boolean>(
      async () => {
        const result = await this.db.get(
          'SELECT COUNT(*) as count FROM salary_group_items WHERE salary_item_id = ?',
          [id]
        );
        return result && result.count > 0;
      },
      errorMsg,
      false // 出错时返回false，安全起见
    );
  }

  /**
   * 统计预置薪酬项数量
   * @returns 预置薪酬项数量
   */
  public async countPresetSalaryItems(): Promise<number> {
    const errorMsg = '统计预置薪酬项数量失败';
    
    return this.safeExecute<number>(
      async () => {
        const result = await this.db.get(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_preset = 1`);
        return result ? result.count : 0;
      },
      errorMsg,
      0 // 默认返回0
    );
  }

  /**
   * 将数据库行映射为薪酬项对象
   * @param row 数据库行
   * @returns 薪酬项对象
   */
  private mapToSalaryItem(row: any): SalaryItem {
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'fixed' | 'percentage' | 'formula',
      value: parseFloat(row.calculation_value),
      subsidyCycle: row.subsidy_cycle || null, // 处理可能不存在的subsidy_cycle字段
      isPreset: row.is_preset === 1,
      description: row.description,
      // 确保只返回is_displayed为1的薪酬项
      isDisplayed: row.is_displayed === 1
    };
  }
}