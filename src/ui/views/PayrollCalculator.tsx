/**
 * 工资计算页面
 * 提供工资计算功能，包括单个员工计算和批量计算
 */

import React, { useState, useEffect } from 'react';
// import { PayrollServiceImpl } from '../../services/payrollService.impl'; // Removed direct import
import { PayrollResult } from '../../services/payrollService'; // Keep this type if needed for UI state

// Define an interface for the payroll service that will be accessed via IPC
// This interface should ideally match the one exposed by preload.ts (e.g., IElectronPayrollApi)
interface IPayrollService {
  // This interface is now more of a conceptual guide for what window.electronAPI provides
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => Promise<PayrollResult>;
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => Promise<PayrollResult[]>;
  // Add other methods that were previously on PayrollServiceImpl and will be exposed via IPC
}

// Access the exposed API from the preload script
// Ensure that IElectronPayrollApi matches the structure exposed in preload.ts
interface IElectronPayrollApi {
  calculateEmployeeSalary: (employeeId: number, yearMonth: string) => Promise<PayrollResult>;
  batchCalculateSalary: (yearMonth: string, departmentId?: number) => Promise<PayrollResult[]>;
  // Add other methods exposed from main process here
}

// Type assertion for window.electronAPI
const electronAPI = (window as any).electronAPI as IElectronPayrollApi;

// Placeholder for IPC communication. In a real Electron app, you'd use ipcRenderer.
// const payrollServiceIPC: IPayrollService = { // This is now replaced by electronAPI
//   calculateEmployeeSalary: async (employeeId, yearMonth) => {
//     // Example: return window.electron.ipcRenderer.invoke('payroll:calculateEmployeeSalary', employeeId, yearMonth);
//     console.warn('IPC call to payroll:calculateEmployeeSalary not implemented');
//     // Simulate an error or empty result for now
//     throw new Error('IPC not implemented');
//     // return {} as PayrollResult; 
//   },
//   batchCalculateSalary: async (yearMonth, departmentId) => { // Removed from placeholder
//     // Example: return window.electron.ipcRenderer.invoke('payroll:batchCalculateSalary', yearMonth, departmentId);
//     console.warn('IPC call to payroll:batchCalculateSalary not implemented');
//     // Simulate an error or empty result for now
//     throw new Error('IPC not implemented');
//     // return [];
//   } // Removed from placeholder
// };

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  department_name: string;
}

const PayrollCalculator: React.FC = () => {
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [calculationResults, setCalculationResults] = useState<PayrollResult[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  // const payrollService = new PayrollServiceImpl(); // Removed direct instantiation
  
  // 获取部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // 实际应用中应从API获取部门列表
        setDepartments([
          { id: 1, name: '研发部' },
          { id: 2, name: '市场部' },
          { id: 3, name: '财务部' },
          { id: 4, name: '人力资源部' }
        ]);
      } catch (error) {
        console.error('获取部门列表失败:', error);
        setMessage('获取部门列表失败');
      }
    };
    
    fetchDepartments();
  }, []);
  
  // 根据部门获取员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      if (selectedDepartment === null) {
        setEmployees([]);
        return;
      }
      
      try {
        // 实际应用中应从API获取员工列表
        // const response = await fetch(`/api/employees?departmentId=${selectedDepartment}`);
        // const data = await response.json();
        // setEmployees(data);
        
        // 模拟数据
        setEmployees([
          { id: 1, name: '张三', department_name: '研发部' },
          { id: 2, name: '李四', department_name: '研发部' },
          { id: 3, name: '王五', department_name: '研发部' }
        ]);
      } catch (error) {
        console.error('获取员工列表失败:', error);
        setMessage('获取员工列表失败');
      }
    };
    
    fetchEmployees();
  }, [selectedDepartment]);
  
  // 计算单个员工工资
  const calculateSingleEmployeeSalary = async () => {
    if (!selectedEmployee) {
      setMessage('请选择员工');
      return;
    }
    
    setIsCalculating(true);
    setMessage('正在计算...');
    
    try {
      // const result = await payrollService.calculateEmployeeSalary(selectedEmployee, yearMonth); // Replaced with IPC call
      // const result = await payrollServiceIPC.calculateEmployeeSalary(selectedEmployee, yearMonth); // Replaced with electronAPI call
      const result = await electronAPI.calculateEmployeeSalary(selectedEmployee, yearMonth);
      setCalculationResults([result]);
      setMessage('计算完成');
    } catch (error) {
      console.error('计算工资失败:', error);
      setMessage(`计算工资失败: ${(error as Error).message}`);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // 批量计算工资
  const batchCalculateSalary = async () => {
    setIsCalculating(true);
    setMessage('正在批量计算...');
    
    try {
      // const results = await payrollService.batchCalculateSalary(yearMonth, selectedDepartment || undefined); // Replaced with IPC call
      // const results = await payrollServiceIPC.batchCalculateSalary(yearMonth, selectedDepartment || undefined); // Replaced with electronAPI call
      const results = await electronAPI.batchCalculateSalary(yearMonth, selectedDepartment || undefined);
      setCalculationResults(results);
      setMessage(`批量计算完成，共 ${results.length} 条记录`);
    } catch (error) {
      console.error('批量计算工资失败:', error);
      setMessage(`批量计算工资失败: ${(error as Error).message}`);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // 获取当前年月
  function getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
  
  return (
    <div className="payroll-calculator">
      <h1>工资计算</h1>
      
      <div className="form-group">
        <label>计算年月：</label>
        <input 
          type="month" 
          value={yearMonth} 
          onChange={(e) => setYearMonth(e.target.value)}
          disabled={isCalculating}
        />
      </div>
      
      <div className="form-group">
        <label>部门：</label>
        <select 
          value={selectedDepartment || ''} 
          onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : null)}
          disabled={isCalculating}
        >
          <option value="">全部部门</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>员工：</label>
        <select 
          value={selectedEmployee || ''} 
          onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
          disabled={isCalculating}
        >
          <option value="">请选择员工</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>
      
      <div className="button-group">
        <button 
          onClick={calculateSingleEmployeeSalary} 
          disabled={isCalculating || !selectedEmployee}
        >
          计算选中员工
        </button>
        <button 
          onClick={batchCalculateSalary} 
          disabled={isCalculating}
        >
          批量计算
        </button>
      </div>
      
      {message && <div className="message">{message}</div>}
      
      {calculationResults.length > 0 && (
        <div className="results">
          <h2>计算结果</h2>
          <table>
            <thead>
              <tr>
                <th>员工ID</th>
                <th>年月</th>
                <th>基本工资</th>
                <th>总工资</th>
                <th>社保</th>
                <th>个税</th> {/* 添加个税列 */}
                <th>考勤扣款</th>
                <th>奖惩金额</th>
                <th>实发工资</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {calculationResults.map(result => (
                <tr key={`${result.employeeId}-${result.yearMonth}`}>
                  <td>{result.employeeId}</td>
                  <td>{result.yearMonth}</td>
                  <td>{result.baseSalary.toFixed(2)}</td>
                  <td>{result.totalSalary.toFixed(2)}</td>
                  <td>{result.socialInsurance.toFixed(2)}</td>
                  <td>{result.tax.toFixed(2)}</td> {/* 显示个税金额 */}
                  <td>{result.attendanceDeduction.toFixed(2)}</td>
                  <td>{result.rewardPunishment.toFixed(2)}</td>
                  <td>{result.netSalary.toFixed(2)}</td>
                  <td>{result.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {calculationResults.length === 1 && (
            <div className="salary-details">
              <h3>薪酬明细</h3>
              <table>
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(calculationResults[0].details).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollCalculator;