/**
 * 数据库迁移管理器
 * 用于统一管理和执行所有数据库迁移脚本
 */

import { Database } from '../database';
import { Migration, BaseMigration } from './migration';

// 导入所有迁移脚本
import { migrateAttendanceExceptionSettings } from './attendanceExceptionMigration';
import { InitialSchemaMigration } from './001_initial_schema';
import { AddSubsidyCycleToSalaryItems } from './002_add_subsidy_cycle_to_salary_items';
import { CreateDepartmentsTable } from './003_create_departments_table';
import { AddIsPresetToSalaryItems } from './004_add_is_preset_to_salary_items';
import { FixMissingTablesAndColumns } from './005_fix_missing_tables_and_columns';
import { AddMissingEmployeeFields } from './006_add_missing_employee_fields';
import { CreatePositionsTable } from './007_create_positions_table';
// 在此处导入其他迁移脚本

export class MigrationManager {
  private static readonly MIGRATIONS_TABLE = 'schema_migrations';
  
  /**
   * 确保迁移表存在
   */
  private static async ensureMigrationsTable(): Promise<void> {
    const db = Database.getInstance().getConnection();
    
    try {
      // 创建迁移版本跟踪表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.MIGRATIONS_TABLE} (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('迁移版本跟踪表检查完成');
    } catch (error) {
      console.error('创建迁移版本跟踪表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取已执行的迁移版本列表
   */
  private static async getExecutedMigrations(): Promise<number[]> {
    const db = Database.getInstance().getConnection();
    
    try {
      const rows = await db.all(`SELECT version FROM ${this.MIGRATIONS_TABLE} ORDER BY version ASC`);
      return rows.map((row: any) => row.version);
    } catch (error) {
      console.error('获取已执行迁移版本失败:', error);
      return [];
    }
  }
  
  /**
   * 记录迁移执行
   */
  private static async recordMigration(migration: Migration): Promise<void> {
    const db = Database.getInstance().getConnection();
    
    try {
      await db.run(
        `INSERT INTO ${this.MIGRATIONS_TABLE} (version, name) VALUES (?, ?)`,
        [migration.version, migration.name]
      );
      console.log(`迁移 ${migration.version} (${migration.name}) 已记录`);
    } catch (error) {
      console.error(`记录迁移 ${migration.version} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取所有可用的迁移脚本
   */
  private static async getAllMigrations(): Promise<Migration[]> {
    // 这里我们将使用一个临时的迁移列表，后续会改为自动加载目录下的所有迁移文件
    // 创建初始表结构迁移实例
    const initialSchemaMigration = new InitialSchemaMigration();
    
    // 将旧的迁移函数包装为符合新接口的对象
    const legacyAttendanceMigration: Migration = {
      version: 2023060101,
      name: 'Add columns to attendance_exception_settings',
      up: migrateAttendanceExceptionSettings
    };
    
    // 返回所有迁移脚本，按版本号排序
    return [
      initialSchemaMigration,
      legacyAttendanceMigration,
      new AddSubsidyCycleToSalaryItems(),
      new CreateDepartmentsTable(),
      new AddIsPresetToSalaryItems(),
      new FixMissingTablesAndColumns(),
      new AddMissingEmployeeFields(),
      new CreatePositionsTable(),
      // 在此处添加其他迁移脚本
    ].sort((a, b) => a.version - b.version);
  }
  
  /**
   * 执行所有未执行的迁移脚本
   */
  public static async runAllMigrations(): Promise<void> {
    console.log('开始执行数据库迁移...');
    
    try {
      // 设置超时保护，确保迁移不会无限期阻塞应用程序启动
      const migrationTimeout = setTimeout(() => {
        console.warn('数据库迁移超时，应用程序将继续启动');
        // 不做任何处理，让应用程序继续运行
      }, 10000); // 10秒超时
      
      try {
        // 确保迁移表存在
        await this.ensureMigrationsTable();
        
        // 获取已执行的迁移版本
        const executedVersions = await this.getExecutedMigrations();
        console.log('已执行的迁移版本:', executedVersions);
        
        // 获取所有可用的迁移脚本
        const allMigrations = await this.getAllMigrations();
        console.log(`发现 ${allMigrations.length} 个迁移脚本`);
        
        // 筛选出未执行的迁移脚本
        const pendingMigrations = allMigrations.filter(m => !executedVersions.includes(m.version));
        console.log(`有 ${pendingMigrations.length} 个迁移脚本待执行`);
        
        // 按版本号顺序执行未执行的迁移脚本
        for (const migration of pendingMigrations) {
          console.log(`执行迁移 ${migration.version} (${migration.name})...`);
          
          try {
            // 执行迁移
            await migration.up();
            
            // 记录迁移执行
            await this.recordMigration(migration);
            
            console.log(`迁移 ${migration.version} 执行成功`);
          } catch (error) {
            console.error(`迁移 ${migration.version} 执行失败:`, error);
            // 抛出错误，中断整个迁移过程
            throw error;
          }
        }
        
        console.log('所有数据库迁移执行完成');
      } finally {
        // 清除超时定时器
        clearTimeout(migrationTimeout);
      }
    } catch (error) {
      console.error('数据库迁移过程中发生未预期的错误:', error);
      // 抛出异常，中断应用程序启动
      console.log('数据库迁移失败，应用程序将退出');
      // 使用setTimeout确保错误消息被完全打印
      setTimeout(() => {
        process.exit(1); // 非正常退出
      }, 100);
    }
  }
}