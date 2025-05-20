/**
 * Preload script for Electron renderer process.
 * This script runs before the renderer process is loaded, and has access to both DOM APIs and Node.js environment.
 * It's used to expose whitelisted IPC channels to the renderer process via `contextBridge`.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from './electronAPI.d'; // Import IElectronAPI
import { PayrollResult, SalaryGroup, SalaryItem } from './services/payrollService'; // Ensure this path is correct relative to preload.ts
import { AttendanceExceptionItem } from './db/database'; // Import AttendanceExceptionItem type



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
  },
  importAttendanceData: (filePath: string, matchingKeyword: string) => {
    console.log('[Preload] Calling attendance:importAttendanceData');
    return ipcRenderer.invoke('attendance:importAttendanceData', filePath, matchingKeyword);
  },
  processAttendanceData: (dataId: string) => {
    console.log('[Preload] Calling attendance:processAttendanceData');
    return ipcRenderer.invoke('attendance:processAttendanceData', dataId);
  },

  // EmployeeService IPC
  getEmployeesByDepartment: (departmentId: number) => {
    console.log('[Preload] Calling employee:getEmployeesByDepartment');
    return ipcRenderer.invoke('employee:getEmployeesByDepartment', departmentId);
  },
  getAllEmployees: () => {
    console.log('[Preload] Calling employee:getAllEmployees');
    return ipcRenderer.invoke('employee:getAllEmployees');
  },
  createEmployee: (employeeData: any) => {
    console.log('[Preload] Calling employee:createEmployee');
    return ipcRenderer.invoke('employee:createEmployee', employeeData);
  },
  getEmployeeById: (id: number) => {
    console.log('[Preload] Calling employee:getEmployeeById');
    return ipcRenderer.invoke('employee:getEmployeeById', id);
  },
  updateEmployee: (id: number, employeeData: any) => {
    console.log('[Preload] Calling employee:updateEmployee');
    return ipcRenderer.invoke('employee:updateEmployee', id, employeeData);
  },
  deleteEmployee(id: number) {
    console.log('[Preload] Calling deleteEmployee', id);
    return ipcRenderer.invoke('employee:deleteEmployee', id);
  },
  
  // 组织架构管理API - 旧式方法
  getAllDepartments() {
    console.log('[Preload] Calling getAllDepartments');
    return ipcRenderer.invoke('department:getAllDepartments');
  },
  getDepartmentById(id: number) {
    console.log('[Preload] Calling getDepartmentById');
    return ipcRenderer.invoke('department:getDepartmentById', id);
  },
  createDepartment(departmentData: any) {
    console.log('[Preload] Calling createDepartment');
    return ipcRenderer.invoke('department:createDepartment', departmentData);
  },
  updateDepartment(id: number, departmentData: any) {
    console.log('[Preload] Calling updateDepartment');
    return ipcRenderer.invoke('department:updateDepartment', id, departmentData);
  },
  deleteDepartment(id: number) {
    console.log('[Preload] Calling deleteDepartment');
    return ipcRenderer.invoke('department:deleteDepartment', id);
  },
  getAllPositions() {
    console.log('[Preload] Calling getAllPositions');
    return ipcRenderer.invoke('position:getAllPositions');
  },
  getPositionsByDepartment(departmentId: number) {
    console.log('[Preload] Calling getPositionsByDepartment');
    return ipcRenderer.invoke('position:getPositionsByDepartment', departmentId);
  },
  getPositionById(id: number) {
    console.log('[Preload] Calling getPositionById');
    return ipcRenderer.invoke('position:getPositionById', id);
  },
  createPosition(positionData: any) {
    console.log('[Preload] Calling createPosition');
    return ipcRenderer.invoke('position:createPosition', positionData);
  },
  updatePosition(id: number, positionData: any) {
    console.log('[Preload] Calling updatePosition');
    return ipcRenderer.invoke('position:updatePosition', id, positionData);
  },
  deletePosition(id: number) {
    console.log('[Preload] Calling deletePosition');
    return ipcRenderer.invoke('position:deletePosition', id);
  },
  
  // 组织架构管理API - 新的命名空间方式
  'employee:getAllEmployees': () => {
    console.log('[Preload] Calling employee:getAllEmployees');
    return ipcRenderer.invoke('employee:getAllEmployees');
  },
  'employee:getEmployeeById': (id: number) => {
    console.log('[Preload] Calling employee:getEmployeeById', id);
    return ipcRenderer.invoke('employee:getEmployeeById', id);
  },
  'employee:createEmployee': (employee: any) => {
    console.log('[Preload] Calling employee:createEmployee', employee);
    return ipcRenderer.invoke('employee:createEmployee', employee);
  },
  'employee:updateEmployee': (id: number, employee: any) => {
    console.log('[Preload] Calling employee:updateEmployee', id, employee);
    return ipcRenderer.invoke('employee:updateEmployee', id, employee);
  },
  'employee:deleteEmployee': (id: number) => {
    console.log('[Preload] Calling employee:deleteEmployee', id);
    return ipcRenderer.invoke('employee:deleteEmployee', id);
  },
  'employee:batchImportEmployees': (employees: any[]) => {
    console.log('[Preload] Calling employee:batchImportEmployees', employees.length);
    return ipcRenderer.invoke('employee:batchImportEmployees', employees);
  },
  'organization:getAllDepartments': () => {
    console.log('[Preload] Calling organization:getAllDepartments');
    return ipcRenderer.invoke('organization:getAllDepartments');
  },
  'organization:getDepartmentById': (id: number) => {
    console.log('[Preload] Calling organization:getDepartmentById', id);
    return ipcRenderer.invoke('organization:getDepartmentById', id);
  },
  'organization:createDepartment': (department: any) => {
    console.log('[Preload] Calling organization:createDepartment', department);
    return ipcRenderer.invoke('organization:createDepartment', department);
  },
  'organization:updateDepartment': (id: number, department: any) => {
    console.log('[Preload] Calling organization:updateDepartment', id, department);
    return ipcRenderer.invoke('organization:updateDepartment', id, department);
  },
  'organization:deleteDepartment': (id: number) => {
    console.log('[Preload] Calling organization:deleteDepartment', id);
    return ipcRenderer.invoke('organization:deleteDepartment', id);
  },
  'organization:getAllPositions': () => {
    console.log('[Preload] Calling organization:getAllPositions');
    return ipcRenderer.invoke('organization:getAllPositions');
  },
  'organization:getPositionsByDepartment': (departmentId: number) => {
    console.log('[Preload] Calling organization:getPositionsByDepartment', departmentId);
    return ipcRenderer.invoke('organization:getPositionsByDepartment', departmentId);
  },
  'organization:getPositionById': (id: number) => {
    console.log('[Preload] Calling organization:getPositionById', id);
    return ipcRenderer.invoke('organization:getPositionById', id);
  },
  'organization:createPosition': (position: any) => {
    console.log('[Preload] Calling organization:createPosition', position);
    return ipcRenderer.invoke('organization:createPosition', position);
  },
  'organization:updatePosition': (id: number, position: any) => {
    console.log('[Preload] Calling organization:updatePosition', id, position);
    return ipcRenderer.invoke('organization:updatePosition', id, position);
  },
  'organization:deletePosition': (id: number) => {
    console.log('[Preload] Calling organization:deletePosition', id);
    return ipcRenderer.invoke('organization:deletePosition', id);
  },
  
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