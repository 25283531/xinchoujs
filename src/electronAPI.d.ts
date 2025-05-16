import { SalaryGroup, SalaryItem, PayrollResult } from './services/payrollService';

export interface IElectronAPI {
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

  // Add other exposed APIs here
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}