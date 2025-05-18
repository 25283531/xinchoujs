import { SalaryGroup, SalaryItem } from '../services/payrollService';

interface AttendanceExceptionItem {
  id?: number;
  name: string;
  deductionRule: string;
  unit: 'day' | 'hour' | 'count';
  amount?: number;
}

export interface ElectronAPI {
  // Salary Group IPC
  getAllSalaryGroups: () => Promise<SalaryGroup[]>;
  createSalaryGroup: (salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<any>;
  updateSalaryGroup: (id: number, salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<any>;
  deleteSalaryGroup: (id: number) => Promise<any>;
  assignSalaryGroupToEmployee: (employeeId: number, salaryGroupId: number) => Promise<any>;
  assignSalaryGroupToDepartment: (department: string, salaryGroupId: number) => Promise<any>;
  assignSalaryGroupToPosition: (position: string, salaryGroupId: number) => Promise<any>;

  // Salary Item IPC
  getAllSalaryItems: () => Promise<SalaryItem[]>;
  isSalaryItemReferenced: (id: number) => Promise<boolean>;
  deleteSalaryItem: (id: number) => Promise<any>;
  updateSalaryItem: (id: number, values: any) => Promise<any>;
  createSalaryItem: (values: any) => Promise<any>;

  // Attendance IPC
  invoke(channel: 'attendance:getExceptionItems'): Promise<{ success: boolean; data?: AttendanceExceptionItem[]; error?: string }>;
  invoke(channel: 'attendance:defineExceptionItem', item: Partial<AttendanceExceptionItem>): Promise<{ success: boolean; error?: string }>;
  invoke(channel: 'attendance:importAttendanceData', filePath: string, matchingKeyword: string): Promise<{ success: boolean; error?: string }>;
  invoke(channel: 'attendance:processAttendanceData', dataId: number): Promise<{ success: boolean; error?: string }>;
  invoke(channel: 'attendance:calculateDeductions', payrollId: number): Promise<{ success: boolean; error?: string }>;

  // Generic invoke fallback (if needed for other channels not explicitly typed)
  invoke(channel: string, ...args: any[]): Promise<any>;

  // Other potential IPC methods from main.ts (if used in renderer)
  // payroll:calculateEmployeeSalary
  // payroll:batchCalculateSalary
  // send: (channel: string, ...args: any[]) => void; // If used for non-invoke
  // on: (channel: string, listener: (event: any, ...args: any[]) => void) => (() => void); // If used for non-invoke
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}