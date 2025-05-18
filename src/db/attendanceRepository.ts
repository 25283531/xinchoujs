import { Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { AttendanceExceptionItem, ImportedAttendanceData } from './database';

export interface AttendanceRepository {
  createExceptionItem(item: AttendanceExceptionItem): Promise<void>;
  getExceptionItems(): Promise<AttendanceExceptionItem[]>;
  saveImportedData(data: ImportedAttendanceData): Promise<number>; // Returns the ID of the saved data
  getImportedData(id: number): Promise<ImportedAttendanceData | undefined>;
  updateImportedDataStatus(id: number, status: 'pending' | 'processed' | 'error'): Promise<void>;
  getAttendanceRecordsByEmployeeAndMonth(employeeId: number, yearMonth: string): Promise<AttendanceRecord[]>;
  getEmployeeSalaryBase(employeeId: number): Promise<number | undefined>;
  updateExceptionItem(item: AttendanceExceptionItem): Promise<void>;
  deleteExceptionItem(id: number): Promise<void>;
  saveAttendanceRecords(records: AttendanceRecord[]): Promise<void>;
  findEmployeeId(rowData: any, matchingKeyword: 'name' | 'name+id' | 'name+idcard'): Promise<number | undefined>;
  findExceptionTypeId(rowData: any): Promise<number | undefined>;
}


export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  record_date: string; // Assuming DATE is stored as 'YYYY-MM-DD'
  exception_type_id: number;
  exception_count: number;
  remark?: string;
}

export class AttendanceRepositoryImpl implements AttendanceRepository {
  private db: Database<sqlite3.Database, sqlite3.Statement>;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
  }

  async createExceptionItem(item: AttendanceExceptionItem): Promise<void> {
    await this.db.run(
      `INSERT INTO attendance_exception_settings (name, deduction_rule_type, deduction_rule_value, deduction_rule_threshold, notes) VALUES (?, ?, ?, ?, ?)`,
      item.name,
      item.deductionRuleType,
      item.deductionRuleValue,
      item.deductionRuleThreshold,
      item.notes
    );
    console.log('Created exception item in DB:', item.name);
  }

  async getExceptionItems(): Promise<AttendanceExceptionItem[]> {
    try {
      // 尝试使用完整的列名查询
      const rows = await this.db.all<AttendanceExceptionItem[]>(
        `SELECT id, name, deduction_rule_type, deduction_rule_value, deduction_rule_threshold, notes FROM attendance_exception_settings`
      );
      console.log('Fetched exception items from DB:', rows.length);
      return rows;
    } catch (error) {
      console.warn('使用完整列名查询失败，尝试使用基本列名查询:', error);
      
      try {
        // 如果完整查询失败，使用基本列查询，然后手动添加缺失的属性
        const basicRows = await this.db.all<any[]>(
          `SELECT id, name, notes FROM attendance_exception_settings`
        );
        
        // 手动添加缺失的属性，设置默认值
        const completeRows: AttendanceExceptionItem[] = basicRows.map(row => ({
          id: row.id,
          name: row.name,
          notes: row.notes,
          deductionRuleType: 'fixed', // 默认值
          deductionRuleValue: 0,      // 默认值
          deductionRuleThreshold: 0   // 默认值
        }));
        
        console.log('Fetched basic exception items and added default values:', completeRows.length);
        return completeRows;
      } catch (innerError) {
        console.error('基本列查询也失败:', innerError);
        // 如果所有查询都失败，返回空数组
        return [];
      }
    }
  }

  async updateExceptionItem(item: AttendanceExceptionItem): Promise<void> {
    if (item.id === undefined) {
      throw new Error('Cannot update exception item without an ID.');
    }
    await this.db.run(
      `UPDATE attendance_exception_settings SET name = ?, deduction_rule_type = ?, deduction_rule_value = ?, deduction_rule_threshold = ?, notes = ? WHERE id = ?`,
      item.name,
      item.deductionRuleType,
      item.deductionRuleValue,
      item.deductionRuleThreshold,
      item.notes,
      item.id
    );
    console.log('Updated exception item in DB:', item.id);
  }

  async deleteExceptionItem(id: number): Promise<void> {
    await this.db.run(`DELETE FROM attendance_exception_settings WHERE id = ?`, id);
    console.log('Deleted exception item from DB:', id);
  }

  async saveImportedData(data: ImportedAttendanceData): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO imported_attendance_data (file_path, matching_keyword, import_date, status, raw_data) VALUES (?, ?, ?, ?, ?)`,
      data.filePath,
      data.matchingKeyword,
      data.importDate,
      data.status,
      JSON.stringify(data.rawData) // Store raw data as JSON string
    );
    const lastId = result.lastID;
    if (lastId === undefined) {
      throw new Error('Failed to get last inserted ID for imported data.');
    }
    console.log('Saved imported data to DB with ID:', lastId);
    return lastId;
  }

  async getImportedData(id: number): Promise<ImportedAttendanceData | undefined> {
    // TODO: Implement DB fetch logic for ImportedAttendanceData by ID
    console.log('Fetching imported data from DB:', id);
    const row = await this.db.get<ImportedAttendanceData>(
      `SELECT id, file_path as filePath, matching_keyword as matchingKeyword, import_date as importDate, status, raw_data as rawData FROM imported_attendance_data WHERE id = ?`,
      id
    );
    if (row && row.rawData) {
       // Parse rawData back to object
       row.rawData = JSON.parse(row.rawData as any);
    }
    return row;
  }

  async updateImportedDataStatus(id: number, status: 'pending' | 'processed' | 'error'): Promise<void> {
    await this.db.run(
      `UPDATE imported_attendance_data SET status = ? WHERE id = ?`,
      status,
      id
    );
    console.log(`Updated imported data ${id} status to ${status}`);
  }

  async getAttendanceRecordsByEmployeeAndMonth(employeeId: number, yearMonth: string): Promise<AttendanceRecord[]> {
    // yearMonth is 'YYYY-MM'
    const startDate = `${yearMonth}-01`;
    // Find the last day of the month
    const [year, month] = yearMonth.split('-').map(Number);
    const endDate = `${yearMonth}-${new Date(year, month, 0).getDate()}`;

    const rows = await this.db.all<AttendanceRecord[]>(
      `SELECT id, employee_id, record_date, exception_type_id, exception_count, remark
       FROM attendance_records
       WHERE employee_id = ? AND record_date BETWEEN ? AND ?`,
      employeeId,
      startDate,
      endDate
    );
    console.log(`Fetched ${rows.length} attendance records for employee ${employeeId} in ${yearMonth}`);
    return rows;
  }

  async getEmployeeSalaryBase(employeeId: number): Promise<number | undefined> {
    console.log(`Fetching salary base for employee ${employeeId}`);
    // Assuming 'employees' table exists with 'id' and 'monthly_salary' columns
    const row = await this.db.get<{ monthly_salary: number }>(`SELECT monthly_salary FROM employees WHERE id = ?`, employeeId);
    if (row && row.monthly_salary !== undefined) {
      // Assuming 21.75 working days per month for daily salary calculation
      return row.monthly_salary / 21.75;
    }
    console.warn(`Monthly salary not found for employee ${employeeId}.`);
    return undefined;
  }

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    if (records.length === 0) {
      console.log('No attendance records to save.');
      return;
    }
    const stmt = await this.db.prepare(
      `INSERT INTO attendance_records (employee_id, record_date, exception_type_id, exception_count, remark) VALUES (?, ?, ?, ?, ?)`
    );
    for (const record of records) {
      await stmt.run(
        record.employee_id,
        record.record_date,
        record.exception_type_id,
        record.exception_count,
        record.remark
      );
    }
    await stmt.finalize();
    console.log(`Saved ${records.length} attendance records to DB.`);
  }

  async findEmployeeId(rowData: any, matchingKeyword: 'name' | 'name+id' | 'name+idcard'): Promise<number | undefined> {
    console.log(`Finding employee ID for row with keyword ${matchingKeyword}`);
    let query = '';
    let params: any[] = [];

    switch (matchingKeyword) {
      case 'name':
        // Assuming rowData has a 'name' field and employees table has 'name' column
        if (rowData.name) {
          query = `SELECT id FROM employees WHERE name = ?`;
          params = [rowData.name];
        }
        break;
      case 'name+id':
        // Assuming rowData has 'name' and 'id' fields and employees table has 'name' and 'employee_id' columns
        if (rowData.name && rowData.id) {
          query = `SELECT id FROM employees WHERE name = ? AND employee_id = ?`;
          params = [rowData.name, rowData.id];
        }
        break;
      case 'name+idcard':
        // Assuming rowData has 'name' and 'idcard' fields and employees table has 'name' and 'id_card' columns
        if (rowData.name && rowData.idcard) {
          query = `SELECT id FROM employees WHERE name = ? AND id_card = ?`;
          params = [rowData.name, rowData.idcard];
        }
        break;
      default:
        console.warn(`Unknown matching keyword: ${matchingKeyword}`);
        return undefined;
    }

    if (query && params.length > 0) {
      const row = await this.db.get<{ id: number }>(query, ...params);
      if (row) {
        console.log(`Found employee ID: ${row.id}`);
        return row.id;
      } else {
        console.warn(`Employee not found for keyword ${matchingKeyword} and data ${JSON.stringify(rowData)}`);
      }
    }

    return undefined;
  }

  async findExceptionTypeId(rowData: any): Promise<number | undefined> {
    console.log('Finding exception type ID for row');
    // Assuming rowData contains information to identify the exception type, e.g., a 'exception_type_name' field.
    // Assuming attendance_exception_settings table has 'id' and 'name' columns.
    if (rowData.exception_type_name) {
      const row = await this.db.get<{ id: number }>(`SELECT id FROM attendance_exception_settings WHERE name = ?`, rowData.exception_type_name);
      if (row) {
        console.log(`Found exception type ID: ${row.id}`);
        return row.id;
      } else {
        console.warn(`Exception type not found for name: ${rowData.exception_type_name}`);
      }
    }

    return undefined;
  }
}