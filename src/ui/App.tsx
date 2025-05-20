/**
 * 薪酬管理系统前端应用入口
 */

import React, { useState, useEffect } from 'react';
import PayrollCalculator from './views/PayrollCalculator';
import EmployeeManagement from './views/EmployeeManagement';
import TaxSettings from './views/TaxSettings';
import SalaryGroupManagement from './views/SalaryGroupManagement';
import SalaryItemManagement from './views/SalaryItemManagement';
import AttendanceExceptionItemsView from './views/AttendanceExceptionItemsView';
import ImportAttendanceDataView from './views/ImportAttendanceDataView';
import OrganizationStructure from './views/OrganizationStructure';

const App: React.FC = () => {
  // 视图类型，增加了组织架构视图
  type ViewType = 'payroll' | 'employee' | 'taxSettings' | 'salaryGroup' | 'salaryItem' | 'attendanceItems' | 'importAttendance' | 'organization';

  const [currentView, setCurrentView] = useState<ViewType>('payroll');

  // 监听URL哈希变化，支持直接链接到特定页面
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/organization-structure') {
        setCurrentView('organization');
      } else if (hash === '#/employee-management') {
        setCurrentView('employee');
      }
    };

    // 初始加载时检查URL
    handleHashChange();

    // 监听哈希变化
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>薪酬管理系统</h1>
        <nav className="main-nav">
          <button
            className={currentView === 'payroll' ? 'active' : ''}
            onClick={() => setCurrentView('payroll')}
          >
            工资计算
          </button>
          <button
            className={currentView === 'employee' ? 'active' : ''}
            onClick={() => setCurrentView('employee')}
          >
            员工管理
          </button>
          <button
            className={currentView === 'salaryGroup' ? 'active' : ''}
            onClick={() => setCurrentView('salaryGroup')}
          >
            薪酬组
          </button>
          <button
            className={currentView === 'salaryItem' ? 'active' : ''}
            onClick={() => setCurrentView('salaryItem')}
          >
            薪酬项
          </button>
          <button
            className={currentView === 'taxSettings' ? 'active' : ''}
            onClick={() => setCurrentView('taxSettings')}
          >
            个税设置
          </button>
          <button
            className={currentView === 'attendanceItems' ? 'active' : ''}
            onClick={() => setCurrentView('attendanceItems')}
          >
            考勤异常项
          </button>
          <button
            className={currentView === 'importAttendance' ? 'active' : ''}
            onClick={() => setCurrentView('importAttendance')}
          >
            导入考勤数据
          </button>
          <button
            className={currentView === 'organization' ? 'active' : ''}
            onClick={() => setCurrentView('organization')}
          >
            组织架构
          </button>
        </nav>
      </header>

      <main className="app-content">
        {currentView === 'payroll' ? (
          <PayrollCalculator />
        ) : currentView === 'employee' ? (
          <EmployeeManagement />
        ) : currentView === 'salaryGroup' ? (
          <SalaryGroupManagement />
        ) : currentView === 'salaryItem' ? (
          <SalaryItemManagement />
        ) : currentView === 'attendanceItems' ? (
          <AttendanceExceptionItemsView />
        ) : currentView === 'importAttendance' ? (
          <ImportAttendanceDataView />
        ) : currentView === 'organization' ? (
          <OrganizationStructure />
        ) : (
          <TaxSettings />
        )}
      </main>

      <footer className="app-footer">
        <p> {new Date().getFullYear()} 薪酬管理系统 - 版本 1.0.0</p>
      </footer>
    </div>
  );
};

export default App;