/**
 * Preload script for Electron renderer process.
 * This script runs before the renderer process is loaded, and has access to both DOM APIs and Node.js environment.
 * It's used to expose whitelisted IPC channels to the renderer process via `contextBridge`.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from './electronAPI.d'; // Import IElectronAPI
import { PayrollResult, SalaryGroup, SalaryItem } from './services/payrollService'; // Ensure this path is correct relative to preload.ts
import { AttendanceExceptionItem } from './db/database'; // Import AttendanceExceptionItem type

// Define the API that will be exposed to the renderer process
// This should match the IPayrollService interface in PayrollCalculator.tsx for consistency, if possible,
// or at least provide the same functionalities.
export interface IElectronPayrollApi {
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => Promise<PayrollResult>;
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => Promise<PayrollResult[]>;
  // Add other methods exposed from main process here
}

const electronApi: IElectronAPI = {
  // 添加通用的invoke方法，用于处理任意IPC调用
  invoke: (channel: string, ...args: any[]) => {
    console.log(`[Preload] Calling generic invoke: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  
  // PayrollService IPC
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => {
    console.log('[Preload] Calling payroll:calculateEmployeeSalary');
    return ipcRenderer.invoke('payroll:calculateEmployeeSalary', employeeId, yearMonth);
  },
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => {
    console.log('[Preload] Calling payroll:batchCalculateSalary');
    return ipcRenderer.invoke('payroll:batchCalculateSalary', yearMonth, departmentId);
  },

  // SalaryGroupService IPC
  getAllSalaryGroups: () => {
    console.log('[Preload] Calling salaryGroup:getAllSalaryGroups');
    return ipcRenderer.invoke('salaryGroup:getAllSalaryGroups');
  },
  createSalaryGroup: (salaryGroupData: Omit<SalaryGroup, 'id'>) => {
    console.log('[Preload] Calling salaryGroup:createSalaryGroup');
    return ipcRenderer.invoke('salaryGroup:createSalaryGroup', salaryGroupData);
  },
  updateSalaryGroup: (id: number, salaryGroupData: Omit<SalaryGroup, 'id'>) => {
    console.log('[Preload] Calling salaryGroup:updateSalaryGroup');
    return ipcRenderer.invoke('salaryGroup:updateSalaryGroup', id, salaryGroupData);
  },
  deleteSalaryGroup: (id: number) => {
    console.log('[Preload] Calling salaryGroup:deleteSalaryGroup');
    return ipcRenderer.invoke('salaryGroup:deleteSalaryGroup', id);
  },
  assignSalaryGroupToEmployee: (employeeId: number, salaryGroupId: number) => {
    console.log('[Preload] Calling salaryGroup:assignSalaryGroupToEmployee');
    return ipcRenderer.invoke('salaryGroup:assignSalaryGroupToEmployee', employeeId, salaryGroupId);
  },
  assignSalaryGroupToDepartment: (department: string, salaryGroupId: number) => {
    console.log('[Preload] Calling salaryGroup:assignSalaryGroupToDepartment');
    return ipcRenderer.invoke('salaryGroup:assignSalaryGroupToDepartment', department, salaryGroupId);
  },
  assignSalaryGroupToPosition: (position: string, salaryGroupId: number) => {
    console.log('[Preload] Calling salaryGroup:assignSalaryGroupToPosition');
    return ipcRenderer.invoke('salaryGroup:assignSalaryGroupToPosition', position, salaryGroupId);
  },

  // SalaryItemService IPC
  getAllSalaryItems: () => {
    console.log('[Preload] Calling salaryItem:getAllSalaryItems');
    return ipcRenderer.invoke('salaryItem:getAllSalaryItems');
  },
  createSalaryItem: (salaryItemData: Omit<SalaryItem, 'id'>) => {
    console.log('[Preload] Calling salaryItem:createSalaryItem');
    return ipcRenderer.invoke('salaryItem:createSalaryItem', salaryItemData);
  },
  updateSalaryItem: (id: number, salaryItemData: Omit<SalaryItem, 'id'>) => {
    console.log('[Preload] Calling salaryItem:updateSalaryItem');
    return ipcRenderer.invoke('salaryItem:updateSalaryItem', id, salaryItemData);
  },
  deleteSalaryItem: (id: number) => {
    console.log('[Preload] Calling salaryItem:deleteSalaryItem');
    return ipcRenderer.invoke('salaryItem:deleteSalaryItem', id);
  },
  isSalaryItemReferenced: (id: number) => {
    console.log('[Preload] Calling salaryItem:isSalaryItemReferenced');
    return ipcRenderer.invoke('salaryItem:isSalaryItemReferenced', id);
  },

  // AttendanceService IPC
  getExceptionItems: () => {
    console.log('[Preload] Calling attendance:getExceptionItems');
    return ipcRenderer.invoke('attendance:getExceptionItems');
  },
  defineExceptionItem: (item: AttendanceExceptionItem) => {
    console.log('[Preload] Calling attendance:defineExceptionItem');
    return ipcRenderer.invoke('attendance:defineExceptionItem', item);
  },
  updateExceptionItem: (item: AttendanceExceptionItem) => {
    console.log('[Preload] Calling attendance:updateExceptionItem');
    return ipcRenderer.invoke('attendance:updateExceptionItem', item);
  },
  deleteExceptionItem: (id: number) => {
    console.log('[Preload] Calling attendance:deleteExceptionItem');
    return ipcRenderer.invoke('attendance:deleteExceptionItem', id);
  }
  
  // 注意：通用invoke方法已在对象顶部定义，不需要重复定义

  // Add other exposed APIs here
}

// Expose the API to the renderer process under `window.electronAPI`
// This is a secure way to provide an interface between the renderer and main processes.
// Only the functions defined in `electronApi` will be accessible in the renderer process.
try {
  contextBridge.exposeInMainWorld('electronAPI', electronApi);
  console.log('[Preload] electronAPI exposed to renderer process.');
} catch (error) {
  console.error('[Preload] Failed to expose electronAPI:', error);
}

// It's also common to expose ipcRenderer.on and ipcRenderer.send for specific channels if needed,
// but for invoke/handle patterns, the above is usually sufficient.
// Example for one-way messages from main to renderer:
// contextBridge.exposeInMainWorld('ipcRenderer', {
//   on: (channel: string, func: (...args: any[]) => void) => {
//     const validChannels = ['some-channel-from-main']; // Whitelist channels
//     if (validChannels.includes(channel)) {
//       ipcRenderer.on(channel, (event, ...args) => func(...args));
//     }
//   },
//   // removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel) // If needed
// });