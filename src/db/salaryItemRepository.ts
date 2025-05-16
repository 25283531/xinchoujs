/**
 * 薪酬项数据库仓库
 * 负责薪酬项的数据库访问操作
 */

import { Database } from './database';
import { SalaryItem } from '../services/payrollService';

export class SalaryItemRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * 获取所有薪酬项
   * @returns 薪酬项列表
   */
  public async getAllSalaryItems(): Promise<SalaryItem[]> {
    const connection = this.db.getConnection();
    const rows = await connection.all('SELECT * FROM salary_items ORDER BY id');
    
    return rows.map(this.mapToSalaryItem);
  }

  /**
   * 获取预置薪酬项
   * @returns 预置薪酬项列表
   */
  public async getPresetSalaryItems(): Promise<SalaryItem[]> {
    const connection = this.db.getConnection();
    const rows = await connection.all('SELECT * FROM salary_items WHERE is_preset = 1 ORDER BY id');
    
    return rows.map(this.mapToSalaryItem);
  }

  /**
   * 获取自定义薪酬项
   * @returns 自定义薪酬项列表
   */
  public async getCustomSalaryItems(): Promise<SalaryItem[]> {
    const connection = this.db.getConnection();
    const rows = await connection.all('SELECT * FROM salary_items WHERE is_preset = 0 ORDER BY id');
    
    return rows.map(this.mapToSalaryItem);
  }

  /**
   * 根据ID获取薪酬项
   * @param id 薪酬项ID
   * @returns 薪酬项
   */
  public async getSalaryItemById(id: number): Promise<SalaryItem | null> {
    const connection = this.db.getConnection();
    const row = await connection.get('SELECT * FROM salary_items WHERE id = ?', [id]);
    
    if (!row) {
      return null;
    }
    
    return this.mapToSalaryItem(row);
  }

  /**
   * 创建薪酬项
   * @param item 薪酬项信息
   * @returns 创建的薪酬项ID
   */
  public async createSalaryItem(item: Omit<SalaryItem, 'id'>): Promise<number> {
    const connection = this.db.getConnection();
    
    const result = await connection.run(
      'INSERT INTO salary_items (name, type, value, subsidy_cycle, is_preset, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        item.name,
        item.type,
        item.value.toString(),
        item.subsidyCycle,
        item.isPreset ? 1 : 0,
        item.description || ''
      ]
    );
    
    return result.lastID;
  }

  /**
   * 更新薪酬项
   * @param id 薪酬项ID
   * @param item 薪酬项信息
   */
  public async updateSalaryItem(id: number, item: Partial<Omit<SalaryItem, 'id'>>): Promise<void> {
    const connection = this.db.getConnection();
    
    // 构建更新语句
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
      updateFields.push('value = ?');
      params.push(item.value.toString());
    }
    
    if (item.subsidyCycle !== undefined) {
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
    
    if (updateFields.length === 0) {
      return; // 没有需要更新的字段
    }
    
    // 添加ID参数
    params.push(id);
    
    await connection.run(
      `UPDATE salary_items SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
  }

  /**
   * 删除薪酬项
   * @param id 薪酬项ID
   */
  public async deleteSalaryItem(id: number): Promise<void> {
    const connection = this.db.getConnection();
    await connection.run('DELETE FROM salary_items WHERE id = ?', [id]);
  }

  /**
   * 检查薪酬项是否被薪酬组引用
   * @param id 薪酬项ID
   * @returns 是否被引用
   */
  public async isSalaryItemReferenced(id: number): Promise<boolean> {
    const connection = this.db.getConnection();
    const result = await connection.get(
      'SELECT COUNT(*) as count FROM salary_group_items WHERE salary_item_id = ?',
      [id]
    );
    
    return result.count > 0;
  }

  /**
   * 统计预置薪酬项数量
   * @returns 预置薪酬项数量
   */
  public async countPresetSalaryItems(): Promise<number> {
    const connection = this.db.getConnection();
    const result = await connection.get('SELECT COUNT(*) as count FROM salary_items WHERE is_preset = 1');
    
    return result.count;
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
      value: parseFloat(row.value),
      subsidyCycle: row.subsidy_cycle,
      isPreset: row.is_preset === 1,
      description: row.description
    };
  }
}