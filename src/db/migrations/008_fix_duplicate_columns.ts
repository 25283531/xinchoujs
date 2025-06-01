/**
 * 修复数据库表中的重复列迁移脚本
 * 主要用于修复employees表中可能存在的重复remark列
 */

import { BaseMigration } from './migration';

export class FixDuplicateColumns extends BaseMigration {
  version = 2025052002; // 版本号比职位表迁移大，确保在之后执行
  name = 'Fix duplicate columns in employees table';
  
  /**
   * 执行迁移 - 修复重复列
   */
  async up(): Promise<void> {
    const db = this.getDb();
    
    this.log('开始检查并修复employees表中的重复列...');
    
    try {
      // 获取employees表的列信息
      const columns = await this.getTableColumns('employees');
      
      // 检查是否有重复的列名
      const nameMap = new Map<string, any[]>();
      columns.forEach(column => {
        const name = column.name.toLowerCase();
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)!.push(column);
      });
      
      let hasDuplicateColumns = false;
      const duplicateColumns: {name: string, instances: any[]}[] = [];
      
      // 使用传统循环替代Map.entries()迭代
      const mapKeys = Array.from(nameMap.keys());
      for (let i = 0; i < mapKeys.length; i++) {
        const name = mapKeys[i];
        const columnsWithName = nameMap.get(name)!;
        if (columnsWithName.length > 1) {
          hasDuplicateColumns = true;
          this.log(`列名 '${name}' 重复出现 ${columnsWithName.length} 次`);
          duplicateColumns.push({ name, instances: columnsWithName });
        }
      }
      
      if (!hasDuplicateColumns) {
        this.log('employees表结构正常，没有重复列定义');
        return;
      }
      
      this.log('发现重复列，开始修复...');
      
      // 开始事务
      await db.exec('BEGIN TRANSACTION');
      
      try {
        // 创建临时表，不包含重复列
        this.log('创建临时表...');
        await db.exec(`
          CREATE TABLE employees_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_no VARCHAR NOT NULL UNIQUE,
            name VARCHAR NOT NULL,
            department INTEGER NOT NULL,
            position INTEGER NOT NULL,
            entry_date DATE NOT NULL,
            status INTEGER NOT NULL DEFAULT 1,
            social_insurance_group_id INTEGER,
            salary_group_id INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            gender TEXT DEFAULT 'male',
            base_salary REAL DEFAULT 0,
            birth_date DATE,
            id_card TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            leave_date DATE,
            remark TEXT,
            FOREIGN KEY (social_insurance_group_id) REFERENCES social_insurance_groups (id),
            FOREIGN KEY (salary_group_id) REFERENCES salary_groups (id)
          )
        `);
        
        // 复制数据到临时表
        this.log('复制数据到临时表...');
        await db.exec(`
          INSERT INTO employees_temp (
            id, employee_no, name, department, position, entry_date, status,
            social_insurance_group_id, salary_group_id, created_at, updated_at,
            gender, base_salary, birth_date, id_card, phone, email, address,
            leave_date, remark
          )
          SELECT 
            id, employee_no, name, department, position, entry_date, status,
            social_insurance_group_id, salary_group_id, created_at, updated_at,
            gender, base_salary, birth_date, id_card, phone, email, address,
            leave_date, remark
          FROM employees
        `);
        
        // 删除原表
        this.log('删除原表...');
        await db.exec('DROP TABLE employees');
        
        // 重命名临时表
        this.log('重命名临时表...');
        await db.exec('ALTER TABLE employees_temp RENAME TO employees');
        
        // 提交事务
        await db.exec('COMMIT');
        
        this.log('重复列修复完成！');
      } catch (error) {
        // 回滚事务
        await db.exec('ROLLBACK');
        this.logError('修复过程中出错', error);
        throw error;
      }
    } catch (error) {
      this.logError('检查或修复重复列失败', error);
      throw error;
    }
  }
  
  /**
   * 获取表的列信息
   */
  private async getTableColumns(tableName: string): Promise<any[]> {
    const db = this.getDb();
    
    try {
      return await db.all(`PRAGMA table_info(${tableName})`);
    } catch (error) {
      this.logError(`获取表 ${tableName} 的列信息失败`, error);
      throw error;
    }
  }
  
  /**
   * 回滚迁移
   * 注意：此迁移不支持回滚，因为它修复了数据结构问题
   */
  async down(): Promise<void> {
    this.log('此迁移不支持回滚，因为它修复了数据结构问题');
    return Promise.resolve();
  }
}