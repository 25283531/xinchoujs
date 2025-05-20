import { PayrollResult, SalaryGroup, SalaryItem } from '../services/payrollService';
import { AttendanceExceptionItem, Employee, Department, Position } from '../db/database';

export interface IElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;

  // PayrollService IPC
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => Promise<any>;
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => Promise<any>;

  // SalaryGroupService IPC
  getAllSalaryGroups: () => Promise<SalaryGroup[]>;
  createSalaryGroup: (salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<number>;
  updateSalaryGroup: (id: number, salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<void>;
  deleteSalaryGroup: (id: number) => Promise<void>;
  assignSalaryGroupToEmployee: (employeeId: number, salaryGroupId: number) => Promise<void>;
  assignSalaryGroupToDepartment: (department: string, salaryGroupId: number) => Promise<void>;
  assignSalaryGroupToPosition: (position: string, salaryGroupId: number) => Promise<void>;

  // SalaryItemService IPC
  getAllSalaryItems: () => Promise<SalaryItem[]>;
  createSalaryItem: (salaryItemData: Omit<SalaryItem, 'id'>) => Promise<number>;
  updateSalaryItem: (id: number, salaryItemData: Omit<SalaryItem, 'id'>) => Promise<void>;
  deleteSalaryItem: (id: number) => Promise<void>;
  isSalaryItemReferenced: (id: number) => Promise<boolean>;

  // AttendanceService IPC
  getExceptionItems: () => Promise<{ success: boolean; data?: AttendanceExceptionItem[]; error?: string }>;
  defineExceptionItem: (item: Omit<AttendanceExceptionItem, 'id'>) => Promise<{ success: boolean; data?: number; error?: string }>;
  updateExceptionItem: (item: AttendanceExceptionItem) => Promise<{ success: boolean; error?: string }>;
  deleteExceptionItem: (id: number) => Promise<{ success: boolean; error?: string }>;
  importAttendanceData: (filePath: string, matchingKeyword: string) => Promise<{ success: boolean; data?: { dataId: string }; error?: string }>;
  processAttendanceData: (dataId: string) => Promise<{ success: boolean; error?: string }>;

  // EmployeeService IPC (Missing methods)
  getEmployeesByDepartment: (departmentId: number) => Promise<Employee[]>;
  getAllEmployees: () => Promise<Employee[]>;
  createEmployee: (employeeData: Omit<Employee, 'id' | 'department_name' | 'position_name'>) => Promise<number>;
  getEmployeeById: (id: number) => Promise<Employee | null>;
  updateEmployee: (id: number, employeeData: Omit<Employee, 'id' | 'department_name' | 'position_name'>) => Promise<void>;
}