/**
 * 薪酬组数据库仓库
 * 负责薪酬组的数据库访问操作
 */

import { Database } from './database';
import { SalaryGroup } from '../services/payrollService';

export class SalaryGroupRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * 获取所有薪酬组
   * @returns 薪酬组列表
   */
  public async getAllSalaryGroups(): Promise<SalaryGroup[]> {
    const connection = this.db.getConnection();
    const rows = await connection.all('SELECT * FROM salary_groups ORDER BY id');
    
    const salaryGroups: SalaryGroup[] = [];
    
    for (const row of rows) {
      const group = this.mapToSalaryGroup(row);
      const items = await this.getSalaryGroupItems(group.id);
      group.items = items;
      salaryGroups.push(group);
    }
    
    return salaryGroups;
  }

  /**
   * 根据ID获取薪酬组
   * @param id 薪酬组ID
   * @returns 薪酬组
   */
  public async getSalaryGroupById(id: number): Promise<SalaryGroup | null> {
    const connection = this.db.getConnection();
    const row = await connection.get('SELECT * FROM salary_groups WHERE id = ?', [id]);
    
    if (!row) {
      return null;
    }
    
    const group = this.mapToSalaryGroup(row);
    const items = await this.getSalaryGroupItems(group.id);
    group.items = items;
    
    return group;
  }

  /**
   * 创建薪酬组
   * @param salaryGroup 薪酬组数据
   * @returns 创建的薪酬组ID
   */
  public async createSalaryGroup(salaryGroup: Omit<SalaryGroup, 'id'>): Promise<number> {
    const connection = this.db.getConnection();
    
    // 开始事务
    await connection.exec('BEGIN TRANSACTION');
    
    try {
      // 插入薪酬组
      const result = await connection.run(
        'INSERT INTO salary_groups (name, description) VALUES (?, ?)',
        [salaryGroup.name, salaryGroup.description || null]
      );
      
      const salaryGroupId = result.lastID;
      
      // 插入薪酬组项目
      for (const item of salaryGroup.items) {
        await connection.run(
          'INSERT INTO salary_group_items (salary_group_id, salary_item_id, calculation_order) VALUES (?, ?, ?)',
          [salaryGroupId, item.salaryItemId, item.calculationOrder]
        );
      }
      
      // 提交事务
      await connection.exec('COMMIT');
      
      return salaryGroupId;
    } catch (error) {
      // 回滚事务
      await connection.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * 更新薪酬组
   * @param id 薪酬组ID
   * @param salaryGroup 薪酬组数据
   */
  public async updateSalaryGroup(id: number, salaryGroup: Omit<SalaryGroup, 'id'>): Promise<void> {
    const connection = this.db.getConnection();
    
    // 开始事务
    await connection.exec('BEGIN TRANSACTION');
    
    try {
      // 更新薪酬组
      await connection.run(
        'UPDATE salary_groups SET name = ?, description = ? WHERE id = ?',
        [salaryGroup.name, salaryGroup.description || null, id]
      );
      
      // 删除原有薪酬组项目
      await connection.run('DELETE FROM salary_group_items WHERE salary_group_id = ?', [id]);
      
      // 插入新的薪酬组项目
      for (const item of salaryGroup.items) {
        await connection.run(
          'INSERT INTO salary_group_items (salary_group_id, salary_item_id, calculation_order) VALUES (?, ?, ?)',
          [id, item.salaryItemId, item.calculationOrder]
        );
      }
      
      // 提交事务
      await connection.exec('COMMIT');
    } catch (error) {
      // 回滚事务
      await connection.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * 删除薪酬组
   * @param id 薪酬组ID
   */
  public async deleteSalaryGroup(id: number): Promise<void> {
    const connection = this.db.getConnection();
    
    // 开始事务
    await connection.exec('BEGIN TRANSACTION');
    
    try {
      // 删除薪酬组项目
      await connection.run('DELETE FROM salary_group_items WHERE salary_group_id = ?', [id]);
      
      // 删除薪酬组
      await connection.run('DELETE FROM salary_groups WHERE id = ?', [id]);
      
      // 提交事务
      await connection.exec('COMMIT');
    } catch (error) {
      // 回滚事务
      await connection.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * 获取薪酬组项目
   * @param salaryGroupId 薪酬组ID
   * @returns 薪酬组项目列表
   */
  private async getSalaryGroupItems(salaryGroupId: number): Promise<Array<{salaryItemId: number; calculationOrder: number}>> {
    const connection = this.db.getConnection();
    const rows = await connection.all(
      'SELECT salary_item_id, calculation_order FROM salary_group_items WHERE salary_group_id = ? ORDER BY calculation_order',
      [salaryGroupId]
    );
    
    return rows.map((row: {salary_item_id: number; calculation_order: number}) => ({
      salaryItemId: row.salary_item_id,
      calculationOrder: row.calculation_order
    }));
  }

  /**
   * 将数据库行映射为薪酬组对象
   * @param row 数据库行
   * @returns 薪酬组对象
   */
  private mapToSalaryGroup(row: {id: number; name: string; description: string | null}): SalaryGroup {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      items: []
    };
  }
}