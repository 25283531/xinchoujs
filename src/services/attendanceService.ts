import { AttendanceExceptionItem as DbAttendanceExceptionItem, ImportedAttendanceData } from '../db/database'; // 从数据库导入类型

// 重新导出AttendanceExceptionItem类型，以便其他模块可以从这里导入
export type AttendanceExceptionItem = DbAttendanceExceptionItem;
import { AttendanceRepository, AttendanceRecord } from '../db/attendanceRepository';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface AttendanceService {
  defineExceptionItem(item: AttendanceExceptionItem): Promise<void>;
  getExceptionItems(): Promise<AttendanceExceptionItem[]>;
  importAttendanceData(filePath: string, matchingKeyword: 'name' | 'name+id' | 'name+idcard'): Promise<number>;
  processAttendanceData(dataId: number): Promise<void>;
  calculateDeductions(employeeId: number, yearMonth: string): Promise<number>; // Returns total deduction amount
  updateExceptionItem(item: AttendanceExceptionItem): Promise<void>;
  deleteExceptionItem(id: number): Promise<void>;
}

export class AttendanceServiceImpl implements AttendanceService {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async defineExceptionItem(item: AttendanceExceptionItem): Promise<void> {
    await this.attendanceRepository.createExceptionItem(item);
  }

  async getExceptionItems(): Promise<AttendanceExceptionItem[]> {
    return this.attendanceRepository.getExceptionItems();
  }

  async updateExceptionItem(item: AttendanceExceptionItem): Promise<void> {
    await this.attendanceRepository.updateExceptionItem(item);
  }

  async deleteExceptionItem(id: number): Promise<void> {
    await this.attendanceRepository.deleteExceptionItem(id);
  }

  async importAttendanceData(filePath: string, matchingKeyword: 'name' | 'name+id' | 'name+idcard'): Promise<number> {
    console.log(`Importing attendance data from ${filePath} with keyword ${matchingKeyword}`);
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let rawData: any[] = [];

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      if (fileExtension === '.csv') {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        rawData = parse(fileContent, { columns: true, skip_empty_lines: true });
        console.log(`Parsed ${rawData.length} rows from CSV.`);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Parsed ${rawData.length} rows from Excel.`);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      const importedData: ImportedAttendanceData = {
        filePath: filePath,
        matchingKeyword: matchingKeyword,
        importDate: new Date().toISOString(),
        status: 'pending',
        rawData: rawData,
        data: rawData, // Add the missing data property
      };

      const importedDataId = await this.attendanceRepository.saveImportedData(importedData);
      console.log('Imported data saved to DB with ID:', importedDataId);

      return importedDataId; // Return the ID of the saved raw data

    } catch (error) {
      console.error('Error importing attendance data:', error);
      throw error; // Re-throw to propagate the error
    }
  }

  async processAttendanceData(dataId: number): Promise<void> {
    console.log('Processing attendance data:', dataId);
    try {
      const importedData = await this.attendanceRepository.getImportedData(dataId);

      if (!importedData) {
        console.warn(`Imported data with ID ${dataId} not found.`);
        return; // Or throw an error
      }

      if (importedData.status !== 'pending') {
        console.warn(`Imported data with ID ${dataId} is not in 'pending' status. Current status: ${importedData.status}`);
        return; // Or throw an error
      }

      const processedRecords: AttendanceRecord[] = [];

      for (const rowData of importedData.rawData) {
        const employeeId = await this.attendanceRepository.findEmployeeId(rowData, importedData.matchingKeyword);
        const exceptionTypeId = await this.attendanceRepository.findExceptionTypeId(rowData);

        if (employeeId !== undefined && exceptionTypeId !== undefined) {
          // Assuming rowData has 'date' and 'count' fields
          if (rowData.date && rowData.count !== undefined) {
            processedRecords.push({
              employee_id: employeeId,
              record_date: rowData.date, // Ensure date format is 'YYYY-MM-DD'
              exception_type_id: exceptionTypeId,
              exception_count: Number(rowData.count),
              remark: rowData.remark || '',
            });
          } else {
            console.warn('Skipping row due to missing date or count:', rowData);
          }
        } else {
          console.warn('Skipping row due to missing employee or exception type:', rowData);
        }
      }

      await this.attendanceRepository.saveAttendanceRecords(processedRecords);
      await this.attendanceRepository.updateImportedDataStatus(dataId, 'processed');
      console.log(`Processed data with ID ${dataId} and saved ${processedRecords.length} records.`);

    } catch (error) {
      console.error('Error processing attendance data:', error);
      await this.attendanceRepository.updateImportedDataStatus(dataId, 'error');
      throw error; // Re-throw to propagate the error
    }
  }

  async calculateDeductions(employeeId: number, yearMonth: string): Promise<number> {
    console.log(`Calculating deductions for employee ${employeeId} in ${yearMonth}`);

    // 1. Fetch attendance records for the employee and month
    const attendanceRecords = await this.attendanceRepository.getAttendanceRecordsByEmployeeAndMonth(employeeId, yearMonth);
    if (attendanceRecords.length === 0) {
      console.log(`No attendance records found for employee ${employeeId} in ${yearMonth}`);
      return 0; // No records, no deduction
    }

    // 2. Fetch all defined exception rules
    const exceptionRules = await this.attendanceRepository.getExceptionItems();
    const ruleMap = new Map<number, AttendanceExceptionItem>();
    for (const rule of exceptionRules) {
      if (rule.id !== undefined) {
        ruleMap.set(rule.id, rule);
      }
    }

    let totalDeduction = 0;

    // 3. Group records by exception type to handle tiered_count rules
    const recordsByExceptionType = new Map<number, AttendanceRecord[]>();
    for (const record of attendanceRecords) {
      if (!recordsByExceptionType.has(record.exception_type_id)) {
        recordsByExceptionType.set(record.exception_type_id, []);
      }
      recordsByExceptionType.get(record.exception_type_id)!.push(record);
    }

    // 4. Calculate deductions for each exception type
    for (const [exceptionTypeId, records] of recordsByExceptionType.entries()) {
      const rule = ruleMap.get(exceptionTypeId);
      if (!rule) {
        console.warn(`Rule not found for exception type ID ${exceptionTypeId}. Skipping deduction.`);
        continue;
      }

      switch (rule.deductionRuleType) {
        case 'fixed':
          // Fixed amount per occurrence
          if (rule.deductionRuleValue !== undefined) {
            totalDeduction += (rule.deductionRuleValue * records.length);
          }
          break;
        case 'per_hour':
          // Deduction per hour of exception. Assumes exception_count is in hours.
          if (rule.deductionRuleValue !== undefined) {
            const totalHours = records.reduce((sum, rec) => sum + rec.exception_count, 0);
            totalDeduction += (rule.deductionRuleValue * totalHours);
          }
          break;
        case 'per_day_salary':
          // Deduction is a percentage of daily salary. Requires employee's daily salary.
          if (rule.deductionRuleValue !== undefined) {
             // This is a simplified placeholder. Real implementation needs employee's salary base.
             // Fetch employee's daily salary base
             const dailySalary = await this.attendanceRepository.getEmployeeSalaryBase(employeeId);
             if (dailySalary !== undefined) {
               const totalDays = records.reduce((sum, rec) => sum + rec.exception_count, 0); // Assuming exception_count is days or occurrences to be treated as days
               totalDeduction += (dailySalary * rule.deductionRuleValue * totalDays);
             } else {
               console.warn(`Daily salary base not found for employee ${employeeId}. Cannot calculate per_day_salary deduction.`);
             }
          }
          break;
        case 'tiered_count':
          // Deduction based on total count, with a threshold.
          if (rule.deductionRuleValue !== undefined && rule.deductionRuleThreshold !== undefined) {
            const totalCount = records.reduce((sum, rec) => sum + rec.exception_count, 0);
            if (totalCount > rule.deductionRuleThreshold) {
              // Deduct for occurrences exceeding the threshold
              totalDeduction += (rule.deductionRuleValue * (totalCount - rule.deductionRuleThreshold));
            }
          }
          break;
        default:
          console.warn(`Unknown deduction rule type for exception ID ${exceptionTypeId}: ${rule.deductionRuleType}. Skipping.`);
          break;
      }
    }

    console.log(`Calculated total deduction for employee ${employeeId} in ${yearMonth}: ${totalDeduction}`);
    return totalDeduction;
  }
}