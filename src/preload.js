const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose IPC methods here
  // Example: ipcRenderer.invoke('some-channel', args)
  // We will add specific handlers for salary groups and items later
  // Expose IPC methods here
  // Example: ipcRenderer.invoke('some-channel', args)
  // We will add specific handlers for salary groups and items later
  getAllSalaryGroups: () => ipcRenderer.invoke('salaryGroup:getAllSalaryGroups'),
  getAllSalaryItems: () => ipcRenderer.invoke('salaryItem:getAllSalaryItems'),
  
  // SalaryGroupService IPC
  createSalaryGroup: (salaryGroupData) => ipcRenderer.invoke('salaryGroup:createSalaryGroup', salaryGroupData),
  updateSalaryGroup: (id, salaryGroupData) => ipcRenderer.invoke('salaryGroup:updateSalaryGroup', id, salaryGroupData),
  deleteSalaryGroup: (id) => ipcRenderer.invoke('salaryGroup:deleteSalaryGroup', id),
  assignSalaryGroupToEmployee: (employeeId, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToEmployee', employeeId, salaryGroupId),
  assignSalaryGroupToDepartment: (department, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToDepartment', department, salaryGroupId),
  assignSalaryGroupToPosition: (position, salaryGroupId) => ipcRenderer.invoke('salaryGroup:assignSalaryGroupToPosition', position, salaryGroupId),

  // SalaryItemService IPC
  createSalaryItem: (salaryItemData) => ipcRenderer.invoke('salaryItem:createSalaryItem', salaryItemData),
  updateSalaryItem: (id, salaryItemData) => ipcRenderer.invoke('salaryItem:updateSalaryItem', id, salaryItemData),
  deleteSalaryItem: (id) => ipcRenderer.invoke('salaryItem:deleteSalaryItem', id),
  isSalaryItemReferenced: (id) => ipcRenderer.invoke('salaryItem:isSalaryItemReferenced', id),

  // PayrollService IPC
  calculateEmployeeSalary: (employeeId, yearMonth) => ipcRenderer.invoke('payroll:calculateEmployeeSalary', employeeId, yearMonth),
  batchCalculateSalary: (yearMonth, departmentId) => ipcRenderer.invoke('payroll:batchCalculateSalary', yearMonth, departmentId)
});