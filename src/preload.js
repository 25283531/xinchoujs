const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Generic invoke method for any channel
  // Example: ipcRenderer.invoke('some-channel', args)
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  // Example: ipcRenderer.invoke('some-channel', args)
  getAllSalaryGroups: () => ipcRenderer.invoke('salaryGroup:getAllSalaryGroups'),
  getAllSalaryItems: () => ipcRenderer.invoke('salaryItem:getAllSalaryItems'),
  
  // SalaryGroup methods
  createSalaryGroup: (salaryGroupData) => ipcRenderer.invoke('salaryGroup:createSalaryGroup', salaryGroupData),
  updateSalaryGroup: (id, salaryGroupData) => ipcRenderer.invoke('salaryGroup:updateSalaryGroup', id, salaryGroupData),
  deleteSalaryGroup: (id) => ipcRenderer.invoke('salaryGroup:deleteSalaryGroup', id),
  assignSalaryGroupToEmployee: (employeeId, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToEmployee', employeeId, salaryGroupId),
  assignSalaryGroupToDepartment: (department, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToDepartment', department, salaryGroupId),
  assignSalaryGroupToPosition: (position, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToPosition', position, salaryGroupId),
  
  // SalaryItem methods
  createSalaryItem: (salaryItemData) => ipcRenderer.invoke('salaryItem:createSalaryItem', salaryItemData),
  updateSalaryItem: (id, salaryItemData) => ipcRenderer.invoke('salaryItem:updateSalaryItem', id, salaryItemData),
  deleteSalaryItem: (id) => ipcRenderer.invoke('salaryItem:deleteSalaryItem', id),
  isSalaryItemReferenced: (id) => ipcRenderer.invoke('salaryItem:isSalaryItemReferenced', id),
  
  // Payroll methods
  calculateEmployeeSalary: (employeeId, yearMonth) => ipcRenderer.invoke('payroll:calculateEmployeeSalary', employeeId, yearMonth),
  batchCalculateSalary: (yearMonth, departmentId) => ipcRenderer.invoke('payroll:batchCalculateSalary', yearMonth, departmentId),
  
  // Employee methods
  getAllEmployees: () => ipcRenderer.invoke('employee:getAllEmployees'),
  getEmployeesByDepartment: (departmentId) => ipcRenderer.invoke('employee:getEmployeesByDepartment', departmentId),
  getEmployeeById: (id) => ipcRenderer.invoke('employee:getEmployeeById', id),
  createEmployee: (employeeData) => ipcRenderer.invoke('employee:createEmployee', employeeData),
  updateEmployee: (id, employeeData) => ipcRenderer.invoke('employee:updateEmployee', id, employeeData),
  deleteEmployee: (id) => ipcRenderer.invoke('employee:deleteEmployee', id)
});