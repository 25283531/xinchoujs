import React, { useState, useEffect } from 'react';
import '../styles/organization.css';

// 部门和职位类型定义
interface Department {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Position {
  id: number;
  name: string;
  department_id: number;
  department_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// 组织架构管理组件
const OrganizationStructure: React.FC = () => {
  // 状态管理
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // 部门表单状态
  const [departmentForm, setDepartmentForm] = useState<{name: string, description: string}>({
    name: '',
    description: ''
  });
  
  // 职位表单状态
  const [positionForm, setPositionForm] = useState<{name: string, department_id: number, description: string}>({
    name: '',
    department_id: 1, // 默认为第一个部门
    description: ''
  });
  
  // 模态窗口状态
  const [showDepartmentModal, setShowDepartmentModal] = useState<boolean>(false);
  const [showPositionModal, setShowPositionModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // 初始化加载部门和职位数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 获取所有部门
        const deptResponse = await window.electronAPI['organization:getAllDepartments']();
        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data);
        } else {
          setMessage('加载部门数据失败');
          setMessageType('error');
        }
        
        // 获取所有职位
        const posResponse = await window.electronAPI['organization:getAllPositions']();
        if (posResponse.success && posResponse.data) {
          setPositions(posResponse.data);
        } else {
          setMessage('加载职位数据失败');
          setMessageType('error');
        }
      } catch (error) {
        console.error('加载组织架构数据出错:', error);
        setMessage('加载组织架构数据出错');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 显示消息提示
  const showMessageTip = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };
  
  // 部门相关操作
  const handleAddDepartment = () => {
    setDepartmentForm({ name: '', description: '' });
    setIsEditMode(false);
    setShowDepartmentModal(true);
  };
  
  const handleEditDepartment = (department: Department) => {
    setDepartmentForm({
      name: department.name,
      description: department.description || ''
    });
    setSelectedDepartment(department);
    setIsEditMode(true);
    setShowDepartmentModal(true);
  };
  
  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`确定要删除部门 "${department.name}" 吗？这将同时删除该部门下的所有职位！`)) {
      return;
    }
    
    try {
      const response = await window.electronAPI['organization:deleteDepartment'](department.id);
      if (response.success) {
        // 更新部门列表
        setDepartments(departments.filter(d => d.id !== department.id));
        // 更新职位列表，移除该部门下的所有职位
        setPositions(positions.filter(p => p.department_id !== department.id));
        showMessageTip(`部门 "${department.name}" 已删除`, 'success');
      } else {
        showMessageTip('删除部门失败', 'error');
      }
    } catch (error: any) {
      showMessageTip(`删除部门出错: ${error.message || '未知错误'}`, 'error');
    }
  };
  
  const handleSaveDepartment = async () => {
    // 表单验证
    if (!departmentForm.name.trim()) {
      showMessageTip('部门名称不能为空', 'error');
      return;
    }
    
    try {
      let response;
      
      if (isEditMode && selectedDepartment) {
        // 更新部门
        response = await window.electronAPI['organization:updateDepartment'](
          selectedDepartment.id,
          departmentForm
        );
        
        if (response.success) {
          // 更新部门列表
          setDepartments(departments.map(dept => 
            dept.id === selectedDepartment.id 
              ? { ...dept, ...departmentForm } 
              : dept
          ));
          showMessageTip(`部门 "${departmentForm.name}" 已更新`, 'success');
        } else {
          showMessageTip('更新部门失败', 'error');
        }
      } else {
        // 创建新部门
        response = await window.electronAPI['organization:createDepartment'](departmentForm);
        
        if (response.success && response.data) {
          const newDepartment = {
            id: response.data,
            name: departmentForm.name,
            description: departmentForm.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 更新部门列表
          setDepartments([...departments, newDepartment]);
          showMessageTip(`部门 "${departmentForm.name}" 已创建`, 'success');
        } else {
          showMessageTip('创建部门失败', 'error');
        }
      }
      
      // 关闭模态窗口
      setShowDepartmentModal(false);
    } catch (error: any) {
      showMessageTip(`保存部门出错: ${error.message || '未知错误'}`, 'error');
    }
  };
  
  // 职位相关操作
  const handleAddPosition = () => {
    // 默认选择第一个部门
    const defaultDeptId = departments.length > 0 ? departments[0].id : 1;
    
    setPositionForm({ 
      name: '', 
      department_id: defaultDeptId, 
      description: '' 
    });
    setIsEditMode(false);
    setShowPositionModal(true);
  };
  
  const handleEditPosition = (position: Position) => {
    setPositionForm({
      name: position.name,
      department_id: position.department_id,
      description: position.description || ''
    });
    setSelectedPosition(position);
    setIsEditMode(true);
    setShowPositionModal(true);
  };
  
  const handleDeletePosition = async (position: Position) => {
    if (!confirm(`确定要删除职位 "${position.name}" 吗？`)) {
      return;
    }
    
    try {
      const response = await window.electronAPI['organization:deletePosition'](position.id);
      if (response.success) {
        // 更新职位列表
        setPositions(positions.filter(p => p.id !== position.id));
        showMessageTip(`职位 "${position.name}" 已删除`, 'success');
      } else {
        showMessageTip('删除职位失败', 'error');
      }
    } catch (error: any) {
      showMessageTip(`删除职位出错: ${error.message || '未知错误'}`, 'error');
    }
  };
  
  const handleSavePosition = async () => {
    // 表单验证
    if (!positionForm.name.trim()) {
      showMessageTip('职位名称不能为空', 'error');
      return;
    }
    
    if (!positionForm.department_id) {
      showMessageTip('请选择所属部门', 'error');
      return;
    }
    
    try {
      let response;
      
      if (isEditMode && selectedPosition) {
        // 更新职位
        response = await window.electronAPI['organization:updatePosition'](
          selectedPosition.id,
          positionForm
        );
        
        if (response.success) {
          // 查找部门名称
          const dept = departments.find(d => d.id === positionForm.department_id);
          
          // 更新职位列表
          setPositions(positions.map(pos => 
            pos.id === selectedPosition.id 
              ? { 
                  ...pos, 
                  ...positionForm,
                  department_name: dept ? dept.name : '未知部门'
                } 
              : pos
          ));
          showMessageTip(`职位 "${positionForm.name}" 已更新`, 'success');
        } else {
          showMessageTip('更新职位失败', 'error');
        }
      } else {
        // 创建新职位
        response = await window.electronAPI['organization:createPosition'](positionForm);
        
        if (response.success && response.data) {
          // 查找部门名称
          const dept = departments.find(d => d.id === positionForm.department_id);
          
          const newPosition = {
            id: response.data,
            name: positionForm.name,
            department_id: positionForm.department_id,
            department_name: dept ? dept.name : '未知部门',
            description: positionForm.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 更新职位列表
          setPositions([...positions, newPosition]);
          showMessageTip(`职位 "${positionForm.name}" 已创建`, 'success');
        } else {
          showMessageTip('创建职位失败', 'error');
        }
      }
      
      // 关闭模态窗口
      setShowPositionModal(false);
    } catch (error: any) {
      showMessageTip(`保存职位出错: ${error.message || '未知错误'}`, 'error');
    }
  };
  
  // 返回员工管理页面
  const handleBackToEmployees = () => {
    window.location.href = '#/employee-management';
  };
  
  return (
    <div className="organization-structure">
      {/* 移除标题区域，只保留内容区域 */}
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="organization-container">
          {/* 部门管理区域 */}
          <div className="section department-section">
            <div className="section-header">
              <h2>部门管理</h2>
              <button 
                onClick={handleAddDepartment}
                className="add-button"
              >
                添加部门
              </button>
            </div>
            
            <div className="list-container">
              {departments.length === 0 ? (
                <div className="no-data">暂无部门数据</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>部门名称</th>
                      <th>描述</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(dept => (
                      <tr key={dept.id}>
                        <td>{dept.id}</td>
                        <td>{dept.name}</td>
                        <td>{dept.description}</td>
                        <td>
                          <button 
                            onClick={() => handleEditDepartment(dept)} 
                            className="edit-button"
                            title="编辑部门"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteDepartment(dept)} 
                            className="delete-button"
                            title="删除部门"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* 职位管理区域 */}
          <div className="section position-section">
            <div className="section-header">
              <h2>职位管理</h2>
              <button 
                onClick={handleAddPosition}
                className="add-button"
                disabled={departments.length === 0}
              >
                添加职位
              </button>
            </div>
            
            <div className="list-container">
              {positions.length === 0 ? (
                <div className="no-data">暂无职位数据</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>职位名称</th>
                      <th>所属部门</th>
                      <th>描述</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id}>
                        <td>{pos.id}</td>
                        <td>{pos.name}</td>
                        <td>{pos.department_name}</td>
                        <td>{pos.description}</td>
                        <td>
                          <button 
                            onClick={() => handleEditPosition(pos)} 
                            className="edit-button"
                            title="编辑职位"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeletePosition(pos)} 
                            className="delete-button"
                            title="删除职位"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 部门模态窗口 */}
      {showDepartmentModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{isEditMode ? '编辑部门' : '添加部门'}</h2>
            
            <div className="form-group">
              <label>部门名称：</label>
              <input 
                type="text" 
                value={departmentForm.name} 
                onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                placeholder="请输入部门名称"
              />
            </div>
            
            <div className="form-group">
              <label>描述：</label>
              <textarea 
                value={departmentForm.description} 
                onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                placeholder="请输入部门描述（可选）"
              />
            </div>
            
            <div className="modal-buttons">
              <button onClick={() => setShowDepartmentModal(false)} className="cancel-button">
                取消
              </button>
              <button onClick={handleSaveDepartment} className="save-button">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 职位模态窗口 */}
      {showPositionModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{isEditMode ? '编辑职位' : '添加职位'}</h2>
            
            <div className="form-group">
              <label>职位名称：</label>
              <input 
                type="text" 
                value={positionForm.name} 
                onChange={(e) => setPositionForm({...positionForm, name: e.target.value})}
                placeholder="请输入职位名称"
              />
            </div>
            
            <div className="form-group">
              <label>所属部门：</label>
              <select 
                value={positionForm.department_id} 
                onChange={(e) => setPositionForm({...positionForm, department_id: Number(e.target.value)})}
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>描述：</label>
              <textarea 
                value={positionForm.description} 
                onChange={(e) => setPositionForm({...positionForm, description: e.target.value})}
                placeholder="请输入职位描述（可选）"
              />
            </div>
            
            <div className="modal-buttons">
              <button onClick={() => setShowPositionModal(false)} className="cancel-button">
                取消
              </button>
              <button onClick={handleSavePosition} className="save-button">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationStructure;
