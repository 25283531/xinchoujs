import { Database } from '../database';
import { Migration } from './migration';

interface ColumnInfo {
  name: string;
  type: string;
  [key: string]: any;
}

/**
 * 数据库迁移：为员工表添加缺失的字段
 * 1. 添加gender字段
 * 2. 添加base_salary字段
 * 3. 添加其他个人信息字段
 */
export class AddMissingEmployeeFields implements Migration {
  readonly version = 2023060105; // 迁移版本号
  readonly name = '为员工表添加缺失的字段'; // 迁移名称

  async up(): Promise<void> {
    console.log(`开始执行迁移 ${this.version} - ${this.name}...`);
    const db = Database.getInstance().getConnection();
    try {
      // 获取员工表的现有列
      console.log('检查employees表结构...');
      const employeesColumns = await this.getTableColumns(db, 'employees');
      
      // 1. 添加gender字段
      if (!employeesColumns.some(col => col.name === 'gender')) {
        console.log('添加gender字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN gender TEXT DEFAULT 'male'`);
        console.log('gender字段添加成功');
      } else {
        console.log('gender字段已存在，无需添加');
      }
      
      // 2. 添加base_salary字段
      if (!employeesColumns.some(col => col.name === 'base_salary')) {
        console.log('添加base_salary字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN base_salary REAL DEFAULT 0`);
        console.log('base_salary字段添加成功');
      } else {
        console.log('base_salary字段已存在，无需添加');
      }
      
      // 3. 添加birth_date字段
      if (!employeesColumns.some(col => col.name === 'birth_date')) {
        console.log('添加birth_date字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN birth_date DATE`);
        console.log('birth_date字段添加成功');
      } else {
        console.log('birth_date字段已存在，无需添加');
      }
      
      // 4. 添加id_card字段
      if (!employeesColumns.some(col => col.name === 'id_card')) {
        console.log('添加id_card字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN id_card TEXT`);
        console.log('id_card字段添加成功');
      } else {
        console.log('id_card字段已存在，无需添加');
      }
      
      // 5. 添加phone字段
      if (!employeesColumns.some(col => col.name === 'phone')) {
        console.log('添加phone字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN phone TEXT`);
        console.log('phone字段添加成功');
      } else {
        console.log('phone字段已存在，无需添加');
      }
      
      // 6. 添加email字段
      if (!employeesColumns.some(col => col.name === 'email')) {
        console.log('添加email字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN email TEXT`);
        console.log('email字段添加成功');
      } else {
        console.log('email字段已存在，无需添加');
      }
      
      // 7. 添加address字段
      if (!employeesColumns.some(col => col.name === 'address')) {
        console.log('添加address字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN address TEXT`);
        console.log('address字段添加成功');
      } else {
        console.log('address字段已存在，无需添加');
      }
      
      // 8. 添加leave_date字段
      if (!employeesColumns.some(col => col.name === 'leave_date')) {
        console.log('添加leave_date字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN leave_date DATE`);
        console.log('leave_date字段添加成功');
      } else {
        console.log('leave_date字段已存在，无需添加');
      }
      
      // 9. 添加remark字段
      if (!employeesColumns.some(col => col.name === 'remark')) {
        console.log('添加remark字段到employees表...');
        await db.exec(`ALTER TABLE employees ADD COLUMN remark TEXT`);
        console.log('remark字段添加成功');
      } else {
        console.log('remark字段已存在，无需添加');
      }
      
      console.log(`迁移 ${this.version} - ${this.name} 执行成功`);
    } catch (error) {
      console.error(`迁移 ${this.version} - ${this.name} 执行失败:`, error);
      throw error;
    }
  }

  async down(): Promise<void> {
    // 回滚操作暂不实现，因为删除列可能导致数据丢失
    return Promise.resolve();
  }
  
  // 辅助方法：获取表的列信息
  private async getTableColumns(db: any, tableName: string): Promise<ColumnInfo[]> {
    const rows = await db.all(`PRAGMA table_info(${tableName})`);
    return rows as ColumnInfo[];
  }
}
