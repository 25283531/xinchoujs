import { SalaryGroup, SalaryItem, PayrollResult } from './services/payrollService';
import { AttendanceExceptionItem } from './db/database';

export interface IElectronAPI {
  // 通用IPC调用方法
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  
  // PayrollService IPC
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => Promise<PayrollResult>;
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => Promise<PayrollResult[]>;

  // SalaryGroupService IPC
  getAllSalaryGroups: () => Promise<SalaryGroup[]>;
  createSalaryGroup: (salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<number>;
  updateSalaryGroup: (id: number, salaryGroupData: Omit<SalaryGroup, 'id'>) => Promise<boolean>;
  deleteSalaryGroup: (id: number) => Promise<boolean>;
  assignSalaryGroupToEmployee: (employeeId: number, salaryGroupId: number) => Promise<boolean>;
  assignSalaryGroupToDepartment: (department: string, salaryGroupId: number) => Promise<boolean>;
  assignSalaryGroupToPosition: (position: string, salaryGroupId: number) => Promise<boolean>;

  // SalaryItemService IPC
  getAllSalaryItems: () => Promise<SalaryItem[]>;
  createSalaryItem: (salaryItemData: Omit<SalaryItem, 'id'>) => Promise<number>;
  updateSalaryItem: (id: number, salaryItemData: Omit<SalaryItem, 'id'>) => Promise<boolean>;
  deleteSalaryItem: (id: number) => Promise<boolean>;
  isSalaryItemReferenced: (id: number) => Promise<boolean>;

  // AttendanceService IPC
  getExceptionItems: () => Promise<AttendanceExceptionItem[]>;
  defineExceptionItem: (item: AttendanceExceptionItem) => Promise<any>;
  updateExceptionItem: (item: AttendanceExceptionItem) => Promise<any>;
  deleteExceptionItem: (id: number) => Promise<any>;
  importAttendanceData: (filePath: string, matchingKeyword: string) => Promise<any>;
  processAttendanceData: (dataId: string) => Promise<any>;

  // EmployeeService IPC
  getEmployeesByDepartment: (departmentId: number) => Promise<any[]>;
  'employee:getAllEmployees': () => Promise<{ success: boolean; data: any[]; message?: string }>;
  'employee:getEmployeeById': (id: number) => Promise<{ success: boolean; data: any; message?: string }>;
  'employee:createEmployee': (employee: any) => Promise<{ success: boolean; data: number; message?: string }>;
  'employee:updateEmployee': (id: number, employee: any) => Promise<{ success: boolean; message?: string }>;
  'employee:deleteEmployee': (id: number) => Promise<{ success: boolean; message?: string }>;

  // EmployeeService IPC (批量操作)
  'employee:batchImportEmployees': (employees: any[]) => Promise<{ success: boolean; data: { success: number; failures: number }; message?: string }>;

  // OrganizationService IPC (新的命名空间方式)
  'organization:getAllDepartments': () => Promise<{ success: boolean; data: any[]; message?: string }>;
  'organization:getDepartmentById': (id: number) => Promise<{ success: boolean; data: any; message?: string }>;
  'organization:createDepartment': (department: any) => Promise<{ success: boolean; data: number; message?: string }>;
  'organization:updateDepartment': (id: number, department: any) => Promise<{ success: boolean; data: boolean; message?: string }>;
  'organization:deleteDepartment': (id: number) => Promise<{ success: boolean; data: boolean; message?: string }>;
  'organization:getAllPositions': () => Promise<{ success: boolean; data: any[]; message?: string }>;
  'organization:getPositionsByDepartment': (departmentId: number) => Promise<{ success: boolean; data: any[]; message?: string }>;
  'organization:getPositionById': (id: number) => Promise<{ success: boolean; data: any; message?: string }>;
  'organization:createPosition': (position: any) => Promise<{ success: boolean; data: number; message?: string }>;
  'organization:updatePosition': (id: number, position: any) => Promise<{ success: boolean; data: boolean; message?: string }>;
  'organization:deletePosition': (id: number) => Promise<{ success: boolean; data: boolean; message?: string }>;
  
  // 兼容旧版API
  getAllEmployees: () => Promise<any[]>;
  getEmployeeById: (id: number) => Promise<any>;
  createEmployee: (employeeData: any) => Promise<number>;
  updateEmployee: (id: number, employeeData: any) => Promise<boolean>;
  deleteEmployee: (id: number) => Promise<boolean>;
  
  getAllPositions: () => Promise<any[]>;
  getPositionsByDepartment: (departmentId: number) => Promise<any[]>;
  getPositionById: (id: number) => Promise<any>;
  createPosition: (positionData: any) => Promise<number>;
  updatePosition: (id: number, positionData: any) => Promise<boolean>;
  deletePosition: (id: number) => Promise<boolean>;
  
  getAllDepartments: () => Promise<any[]>;
  getDepartmentById: (id: number) => Promise<any>;
  createDepartment: (departmentData: any) => Promise<number>;
  updateDepartment: (id: number, departmentData: any) => Promise<boolean>;
  deleteDepartment: (id: number) => Promise<boolean>;
  // Add other exposed APIs here
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}