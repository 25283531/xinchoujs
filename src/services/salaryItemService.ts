/**
 * 薪酬项服务
 * 负责薪酬项的管理，包括预置薪酬项和自定义薪酬项
 */

import { SalaryItem } from './payrollService';
import { Database } from '../db/database';

export class SalaryItemService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * 初始化预置薪酬项
   * 如果预置薪酬项不存在，则创建
   */
  public async initPresetSalaryItems(): Promise<void> {
    const connection = this.db.getConnection();
    
    // 检查是否已存在预置薪酬项
    const existingPresets = await connection.all(
      'SELECT COUNT(*) as count FROM salary_items WHERE is_preset = 1'
    );
    
    if (existingPresets[0].count > 0) {
      console.log('预置薪酬项已存在，跳过初始化');
      return;
    }
    
    // 定义预置薪酬项
    const presetItems: Omit<SalaryItem, 'id'>[] = [
      {
        name: '租房补贴',
        type: 'fixed',
        value: 1000,
        subsidyCycle: 1, // 每月发放
        isPreset: true,
        description: '员工租房补贴，默认每月1000元'
      },
      {
        name: '通话补贴',
        type: 'fixed',
        value: 100,
        subsidyCycle: 1, // 每月发放
        isPreset: true,
        description: '员工通话补贴，默认每月100元'
      },
      {
        name: '学历补贴',
        type: 'fixed',
        value: 500,
        subsidyCycle: 1, // 每月发放
        isPreset: true,
        description: '员工学历补贴，默认每月500元'
      },
      {
        name: '高温补贴',
        type: 'fixed',
        value: 300,
        subsidyCycle: 3, // 每3个月发放一次
        isPreset: true,
        description: '员工高温补贴，默认每3个月300元'
      },
      {
        name: '技能补贴',
        type: 'fixed',
        value: 800,
        subsidyCycle: 1, // 每月发放
        isPreset: true,
        description: '员工技能补贴，默认每月800元'
      }
    ];
    
    // 插入预置薪酬项
    const stmt = await connection.prepare(
      'INSERT INTO salary_items (name, type, calculation_value, subsidy_cycle, is_preset, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    
    for (const item of presetItems) {
      await stmt.run(
        item.name,
        item.type,
        item.value.toString(),
        item.subsidyCycle,
        item.isPreset ? 1 : 0,
        item.description
      );
    }
    
    await stmt.finalize();
    console.log('预置薪酬项初始化完成');
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
      'INSERT INTO salary_items (name, type, calculation_value, subsidy_cycle, is_preset, description) VALUES (?, ?, ?, ?, ?, ?)',
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
      updateFields.push('calculation_value = ?');
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
    
    // 检查是否为预置薪酬项
    const item = await this.getSalaryItemById(id);
    if (item && item.isPreset) {
      throw new Error('预置薪酬项不允许删除');
    }
    
    // 检查是否被薪酬组引用
    const references = await connection.all(
      'SELECT COUNT(*) as count FROM salary_group_items WHERE salary_item_id = ?',
      [id]
    );
    
    if (references[0].count > 0) {
      throw new Error('该薪酬项已被薪酬组引用，无法删除');
    }
    
    await connection.run('DELETE FROM salary_items WHERE id = ?', [id]);
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
      value: row.type === 'fixed' ? parseFloat(row.calculation_value) : row.calculation_value,
      subsidyCycle: row.subsidy_cycle,
      isPreset: row.is_preset === 1,
      description: row.description
    };
  }
}