/**
 * 员工管理页面
 * 提供员工信息的查看和编辑功能
 */

import React, { useState, useEffect } from 'react';

interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  department_id: number;
}

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  department_id: number;
  department_name?: string;
  position_id: number;
  position_name?: string;
  entry_date: string;
  salary_group_id: number;
  social_insurance_group_id: number;
  base_salary: number;
  status: 'active' | 'inactive';
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
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
  
  // 获取职位列表
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        // 实际应用中应从API获取职位列表
        setPositions([
          { id: 1, name: '软件工程师', department_id: 1 },
          { id: 2, name: '产品经理', department_id: 1 },
          { id: 3, name: '市场专员', department_id: 2 },
          { id: 4, name: '财务专员', department_id: 3 },
          { id: 5, name: 'HR专员', department_id: 4 }
        ]);
      } catch (error) {
        console.error('获取职位列表失败:', error);
        setMessage('获取职位列表失败');
      }
    };
    
    fetchPositions();
  }, []);
  
  // 根据部门获取员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        // 实际应用中应从API获取员工列表
        // const response = await fetch(`/api/employees?departmentId=${selectedDepartment || ''}`);
        // const data = await response.json();
        // setEmployees(data);
        
        // 模拟数据
        setTimeout(() => {
          const mockEmployees: Employee[] = [
            { 
              id: 1, 
              employee_no: 'EMP001', 
              name: '张三', 
              department_id: 1, 
              department_name: '研发部',
              position_id: 1, 
              position_name: '软件工程师',
              entry_date: '2020-01-01',
              salary_group_id: 1,
              social_insurance_group_id: 1,
              base_salary: 8000,
              status: 'active'
            },
            { 
              id: 2, 
              employee_no: 'EMP002', 
              name: '李四', 
              department_id: 1, 
              department_name: '研发部',
              position_id: 2, 
              position_name: '产品经理',
              entry_date: '2019-05-15',
              salary_group_id: 1,
              social_insurance_group_id: 1,
              base_salary: 10000,
              status: 'active'
            },
            { 
              id: 3, 
              employee_no: 'EMP003', 
              name: '王五', 
              department_id: 2, 
              department_name: '市场部',
              position_id: 3, 
              position_name: '市场专员',
              entry_date: '2021-03-10',
              salary_group_id: 1,
              social_insurance_group_id: 1,
              base_salary: 7500,
              status: 'active'
            }
          ];
          
          if (selectedDepartment) {
            setEmployees(mockEmployees.filter(emp => emp.department_id === selectedDepartment));
          } else {
            setEmployees(mockEmployees);
          }
          
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('获取员工列表失败:', error);
        setMessage('获取员工列表失败');
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, [selectedDepartment]);
  
  // 选择员工
  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(false);
  };
  
  // 创建新员工
  const handleCreateEmployee = () => {
    const newEmployee: Employee = {
      id: 0, // 新员工ID为0，保存时会分配真实ID
      employee_no: '',
      name: '',
      department_id: selectedDepartment || 1,
      position_id: 1,
      entry_date: new Date().toISOString().split('T')[0],
      salary_group_id: 1,
      social_insurance_group_id: 1,
      base_salary: 0,
      status: 'active'
    };
    
    setSelectedEmployee(newEmployee);
    setIsEditing(true);
  };
  
  // 编辑员工
  const handleEditEmployee = () => {
    if (selectedEmployee) {
      setIsEditing(true);
    }
  };
  
  // 保存员工
  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    
    setIsLoading(true);
    try {
      // 实际应用中应调用API保存员工信息
      // const response = await fetch('/api/employees', {
      //   method: selectedEmployee.id ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(selectedEmployee)
      // });
      // const data = await response.json();
      
      // 模拟保存成功
      setTimeout(() => {
        // 更新员工列表
        if (selectedEmployee.id === 0) {
          // 新增员工
          const newId = Math.max(...employees.map(e => e.id), 0) + 1;
          const newEmployee = {
            ...selectedEmployee,
            id: newId,
            department_name: departments.find(d => d.id === selectedEmployee.department_id)?.name,
            position_name: positions.find(p => p.id === selectedEmployee.position_id)?.name
          };
          
          setEmployees([...employees, newEmployee]);
          setSelectedEmployee(newEmployee);
        } else {
          // 更新员工
          const updatedEmployees = employees.map(emp => 
            emp.id === selectedEmployee.id ? {
              ...selectedEmployee,
              department_name: departments.find(d => d.id === selectedEmployee.department_id)?.name,
              position_name: positions.find(p => p.id === selectedEmployee.position_id)?.name
            } : emp
          );
          
          setEmployees(updatedEmployees);
        }
        
        setIsEditing(false);
        setIsLoading(false);
        setMessage('保存成功');
        
        // 3秒后清除消息
        setTimeout(() => setMessage(''), 3000);
      }, 500);
    } catch (error) {
      console.error('保存员工信息失败:', error);
      setMessage('保存员工信息失败');
      setIsLoading(false);
    }
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    // 如果是新建员工，取消后清空选择
    if (selectedEmployee && selectedEmployee.id === 0) {
      setSelectedEmployee(null);
    }
    
    setIsEditing(false);
  };
  
  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedEmployee) return;
    
    const { name, value } = e.target;
    
    setSelectedEmployee({
      ...selectedEmployee,
      [name]: name === 'base_salary' ? Number(value) : 
              (name === 'department_id' || name === 'position_id' || 
               name === 'salary_group_id' || name === 'social_insurance_group_id') ? 
              Number(value) : value
    });
  };
  
  return (
    <div className="employee-management">
      <h1>员工管理</h1>
      
      <div className="filter-section">
        <div className="form-group">
          <label>部门：</label>
          <select 
            value={selectedDepartment || ''} 
            onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : null)}
            disabled={isLoading}
          >
            <option value="">全部部门</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleCreateEmployee} 
          disabled={isLoading || isEditing}
        >
          新增员工
        </button>
      </div>
      
      {message && <div className="message">{message}</div>}
      
      <div className="employee-container">
        <div className="employee-list">
          <h2>员工列表</h2>
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : employees.length === 0 ? (
            <div className="no-data">暂无员工数据</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>工号</th>
                  <th>姓名</th>
                  <th>部门</th>
                  <th>职位</th>
                  <th>入职日期</th>
                  <th>基本工资</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr 
                    key={employee.id} 
                    onClick={() => handleSelectEmployee(employee)}
                    className={selectedEmployee?.id === employee.id ? 'selected' : ''}
                  >
                    <td>{employee.employee_no}</td>
                    <td>{employee.name}</td>
                    <td>{employee.department_name}</td>
                    <td>{employee.position_name}</td>
                    <td>{employee.entry_date}</td>
                    <td>{employee.base_salary.toFixed(2)}</td>
                    <td>{employee.status === 'active' ? '在职' : '离职'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="employee-details">
          <h2>员工详情</h2>
          {selectedEmployee ? (
            <div className="details-form">
              <div className="form-group">
                <label>工号：</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="employee_no" 
                    value={selectedEmployee.employee_no} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                ) : (
                  <span>{selectedEmployee.employee_no}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>姓名：</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="name" 
                    value={selectedEmployee.name} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                ) : (
                  <span>{selectedEmployee.name}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>部门：</label>
                {isEditing ? (
                  <select 
                    name="department_id" 
                    value={selectedEmployee.department_id} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                ) : (
                  <span>{selectedEmployee.department_name}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>职位：</label>
                {isEditing ? (
                  <select 
                    name="position_id" 
                    value={selectedEmployee.position_id} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    {positions
                      .filter(pos => !selectedEmployee.department_id || pos.department_id === selectedEmployee.department_id)
                      .map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                  </select>
                ) : (
                  <span>{selectedEmployee.position_name}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>入职日期：</label>
                {isEditing ? (
                  <input 
                    type="date" 
                    name="entry_date" 
                    value={selectedEmployee.entry_date} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                ) : (
                  <span>{selectedEmployee.entry_date}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>基本工资：</label>
                {isEditing ? (
                  <input 
                    type="number" 
                    name="base_salary" 
                    value={selectedEmployee.base_salary} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                ) : (
                  <span>{selectedEmployee.base_salary.toFixed(2)}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>薪酬组：</label>
                {isEditing ? (
                  <select 
                    name="salary_group_id" 
                    value={selectedEmployee.salary_group_id} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    <option value="1">默认薪酬组</option>
                    {/* 实际应用中应从API获取薪酬组列表 */}
                  </select>
                ) : (
                  <span>默认薪酬组</span>
                )}
              </div>
              
              <div className="form-group">
                <label>社保组：</label>
                {isEditing ? (
                  <select 
                    name="social_insurance_group_id" 
                    value={selectedEmployee.social_insurance_group_id} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    <option value="1">默认社保组</option>
                    {/* 实际应用中应从API获取社保组列表 */}
                  </select>
                ) : (
                  <span>默认社保组</span>
                )}
              </div>
              
              <div className="form-group">
                <label>状态：</label>
                {isEditing ? (
                  <select 
                    name="status" 
                    value={selectedEmployee.status} 
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    <option value="active">在职</option>
                    <option value="inactive">离职</option>
                  </select>
                ) : (
                  <span>{selectedEmployee.status === 'active' ? '在职' : '离职'}</span>
                )}
              </div>
              
              <div className="button-group">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSaveEmployee} 
                      disabled={isLoading}
                    >
                      保存
                    </button>
                    <button 
                      onClick={handleCancelEdit} 
                      disabled={isLoading}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleEditEmployee} 
                    disabled={isLoading}
                  >
                    编辑
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">请选择员工查看详情</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;