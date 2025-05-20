/**
 * 员工管理页面
 * 提供员工信息的查看和编辑功能
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { message, Button, Table, Input, Select, Space, Modal, Form, DatePicker, Typography, Tabs, Tree, Divider, Card, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined, AppstoreOutlined, TeamOutlined, UserOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import OrganizationStructure from './OrganizationStructure';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import dayjs from 'dayjs';
import ImportEmployeesWizard from '../components/ImportEmployeesWizard';
import '../styles/importWizard.css';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

// 接口定义
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
  gender?: 'male' | 'female' | 'other';
}

// 字段验证错误类型
interface FieldErrors {
  [field: string]: string;
}

// 部门树节点接口
interface DepartmentTreeNode {
  key: string;
  title: string;
  type: 'department';
  departmentId: number;
  children?: (DepartmentTreeNode | PositionTreeNode)[];
}

// 职位树节点接口
interface PositionTreeNode {
  key: string;
  title: string;
  type: 'position';
  positionId: number;
  departmentId: number;
}

// 员工管理组件
const EmployeeManagement: React.FC = () => {
  // 状态管理
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [salaryGroups, setSalaryGroups] = useState<any[]>([]);
  const [socialInsuranceGroups, setSocialInsuranceGroups] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('employees'); // 当前活动标签页
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  // 组织架构状态
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isDepartmentModalVisible, setIsDepartmentModalVisible] = useState<boolean>(false);
  const [isPositionModalVisible, setIsPositionModalVisible] = useState<boolean>(false);
  
  // 导入相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState<boolean>(false);
  const [importStep, setImportStep] = useState<'select-file' | 'select-sheet' | 'preview-data' | 'map-fields' | 'importing'>('select-file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState<number>(0);
  
  // Form引用
  const formRef = useRef<FormInstance>(null);

  // 获取部门数据
  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI['organization:getAllDepartments']();
      if (response.success) {
        setDepartments(response.data);
      } else {
        message.error('获取部门数据失败: ' + response.message);
      }
    } catch (error) {
      message.error('获取部门数据出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取职位数据
  const fetchPositions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI['organization:getAllPositions']();
      if (response.success) {
        setPositions(response.data);
      } else {
        message.error('获取职位数据失败: ' + response.message);
      }
    } catch (error) {
      message.error('获取职位数据出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 获取账务组数据
  const fetchSalaryGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI.invoke('salaryGroup:getAllSalaryGroups');
      if (response && Array.isArray(response)) {
        setSalaryGroups(response);
      } else {
        message.error('获取账务组数据失败');
      }
    } catch (error) {
      message.error('获取账务组数据出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 获取社保组数据
  const fetchSocialInsuranceGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      // 注意：根据您的API调整此处调用
      const response = await window.electronAPI.invoke('socialInsurance:getSocialInsuranceGroups');
      if (response && Array.isArray(response)) {
        setSocialInsuranceGroups(response);
      } else {
        // 如果没有社保组数据，使用默认值
        setSocialInsuranceGroups([{
          id: 1,
          name: '默认社保组',
          description: '默认社保组'
        }]);
      }
    } catch (error) {
      console.error('获取社保组数据出错:', error);
      // 出错时使用默认值
      setSocialInsuranceGroups([{
        id: 1,
        name: '默认社保组',
        description: '默认社保组'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取员工数据
  const fetchEmployees = useCallback(async (departmentId?: number) => {
    try {
      setIsLoading(true);
      // 打印日志，调试API调用
      console.log('Fetching employees with departmentId:', departmentId);
      
      // 读取electronAPI中的实际方法
      let employeeData;
      try {
        // 直接使用electron的invoke方法，避免类型错误
        if (departmentId) {
          console.log('正在获取指定部门的员工:', departmentId);
          employeeData = await window.electronAPI.invoke('employee:getEmployeesByDepartment', departmentId);
        } else {
          console.log('正在获取所有员工');
          employeeData = await window.electronAPI.invoke('employee:getAllEmployees');
        }
      } catch (apiError) {
        console.error('尝试调用API时出错:', apiError);
        // 最后的尝试，直接调用配置到window上的API
        try {
          if (departmentId) {
            console.log('尝试获取指定部门的员工数据');
            employeeData = await fetch(`/api/employees?departmentId=${departmentId}`).then(res => res.json());
          } else {
            console.log('尝试获取所有员工数据');
            employeeData = await fetch('/api/employees').then(res => res.json());
          }
        } catch (fetchError) {
          console.error('尝试fetch获取员工数据失败:', fetchError);
          // 如果所有方法都失败，则使用空数组
          employeeData = { success: false, data: [], message: '无法连接到API' };
        }
      }
      
      console.log('Employee data response:', employeeData);
      
      if (employeeData && (employeeData.success || Array.isArray(employeeData))) {
        // 处理不同格式的响应数据
        const employeeList = Array.isArray(employeeData) ? employeeData : 
                           (employeeData.data ? employeeData.data : []);
        
        // 处理员工数据，添加部门名称和职位名称
        const employeesWithDetails = employeeList.map((employee: Employee) => {
          const department = departments.find(d => d.id === employee.department_id);
          const position = positions.find(p => p.id === employee.position_id);
          return {
            ...employee,
            department_name: department?.name,
            position_name: position?.name
          };
        });
        
        console.log('Processed employees:', employeesWithDetails);
        setEmployees(employeesWithDetails);
      } else {
        console.error('获取员工数据失败:', employeeData);
        message.error('获取员工数据失败: ' + (employeeData?.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取员工数据出错:', error);
      message.error('获取员工数据出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [departments, positions]);

  // 初始加载数据
  useEffect(() => {
    fetchDepartments();
    fetchPositions();
    fetchSalaryGroups();
    fetchSocialInsuranceGroups();
    // 默认显示员工管理标签页
    setActiveTab('employees');
  }, [fetchDepartments, fetchPositions, fetchSalaryGroups, fetchSocialInsuranceGroups]);

  // 当部门和职位数据都加载完成后，获取员工数据
  useEffect(() => {
    if (departments.length > 0 && positions.length > 0) {
      fetchEmployees(selectedDepartment || undefined);
    }
  }, [departments, positions, selectedDepartment, fetchEmployees]);

  // 处理部门选择变化
  const handleDepartmentChange = (value: number | null) => {
    setSelectedDepartment(value);
  };

  // 处理添加员工
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEditing(true);
    setFieldErrors({});
    if (formRef.current) {
      formRef.current.resetFields();
    }
  };

  // 处理编辑员工
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setFieldErrors({});
    
    // 使用setTimeout确保表单已经渲染后再设置值
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setFieldsValue({
          ...employee,
          entry_date: employee.entry_date ? dayjs(employee.entry_date) : null
        });
      }
    }, 0);
  };

  // 处理删除员工
  const handleDeleteEmployee = async (employeeId: number) => {
    try {
      setIsLoading(true);
      
      const response = await window.electronAPI['employee:deleteEmployee'](employeeId);
      
      if (response.success) {
        message.success('删除员工成功');
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        
        if (selectedEmployee && selectedEmployee.id === employeeId) {
          setSelectedEmployee(null);
        }
      } else {
        message.error('删除员工失败: ' + response.message);
      }
    } catch (error) {
      message.error('删除员工出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理保存员工信息
  const handleSaveEmployee = async (values: any) => {
    try {
      setIsLoading(true);
      
      // 处理日期格式
      const employeeData = {
        ...values,
        entry_date: values.entry_date ? dayjs(values.entry_date).format('YYYY-MM-DD') : null
      };
      
      let response;
      
      // 新增员工
      if (!selectedEmployee) {
        response = await window.electronAPI['employee:createEmployee'](employeeData);
        
        if (response.success) {
          // 获取新创建的员工详情
          const newEmployee = {
            ...employeeData,
            id: response.data,
            department_name: departments.find(d => d.id === employeeData.department_id)?.name,
            position_name: positions.find(p => p.id === employeeData.position_id)?.name
          };
          
          setEmployees([...employees, newEmployee]);
          setSelectedEmployee(null);
          message.success('添加员工成功');
        }
      } 
      // 更新员工
      else {
        response = await window.electronAPI['employee:updateEmployee'](selectedEmployee.id, employeeData);
        
        if (response.success) {
          // 更新员工列表中的数据
          const updatedEmployees = employees.map(emp => {
            if (emp.id === selectedEmployee.id) {
              return {
                ...employeeData,
                id: selectedEmployee.id,
                department_name: departments.find(d => d.id === employeeData.department_id)?.name,
                position_name: positions.find(p => p.id === employeeData.position_id)?.name
              };
            }
            return emp;
          });
          
          setEmployees(updatedEmployees);
          setSelectedEmployee(null);
          message.success('更新员工信息成功');
        } else {
          message.error('更新员工信息失败: ' + response.message);
        }
      }
      
      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('员工编号已存在')) {
        setFieldErrors({
          ...fieldErrors,
          employee_no: '员工编号已存在'
        });
      } else {
        message.error('保存员工信息出错: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理取消编辑
  const handleCancel = () => {
    setSelectedEmployee(null);
    setFieldErrors({});
    setIsEditing(false);
  };

  // 处理导入员工信息
  const handleImport = () => {
    setIsImportModalVisible(true);
    setImportStep('select-file');
    setSelectedFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setPreviewData([]);
    setHeaders([]);
    setFieldMapping({});
    setImportProgress(0);
  };

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    console.log('文件选择:', file.name, '文件大小:', file.size, 'bytes', '文件类型:', file.type);
    message.info(`正在读取文件: ${file.name}`);
    setSelectedFile(file);
    setIsLoading(true);
    
    try {
      // 获取文件路径
      const filePath = (file as any).path || '';
      console.log('原始文件路径:', filePath);
      
      // 新增: 输出所有文件对象的属性，便于调试
      console.log('文件对象的全部属性:', Object.keys(file));
      console.log('文件对象详情:', JSON.stringify(file, (key, value) => {
        if (value instanceof ArrayBuffer || value instanceof Blob) {
          return `[${key}: binary data]`;
        }
        return value;
      }, 2));
      
      // 先验证文件是否被正确设置
      if (!filePath) {
        message.error('无法获取文件路径，请重新选择文件');
        setIsLoading(false);
        return;
      }
      
      // 获取Excel文件的工作表名称
      console.log('正在调用excel:getSheets获取工作表信息...');
      const result = await window.electronAPI.invoke('excel:getSheets', filePath);
      console.log('Excel工作表结果:', result);
      
      if (result.success) {
        setSheetNames(result.data);
        // 确保文件已被选中，然后才进入下一步
        if (file) {
          setImportStep('select-sheet');
        } else {
          message.error('文件选择无效，请重新选择文件');
        }
      } else {
        message.error('读取Excel文件失败: ' + result.message);
      }
    } catch (error) {
      console.error('处理文件出错:', error); // 使用console.error
      message.error('处理文件出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理工作表选择
  const handleSheetSelect = async (sheetName: string) => {
    console.log('选择工作表:', sheetName); // 添加日志
    
    // 立即设置选中的工作表，这将激活下一步按钮
    setSelectedSheet(sheetName);
    
    // 如果已经选了工作表，下一步按钮将自动可用
    // 但我们仍然需要先施加加载提示器
    setIsLoading(true);
    
    try {
      // 检查文件是否存在
      if (!selectedFile) {
        message.error('文件不存在，请重新选择文件');
        setIsLoading(false);
        return;
      }
      
      // 获取文件路径
      const filePath = (selectedFile as any).path || '';
      console.log('读取工作表数据，文件路径:', filePath, '工作表名称:', sheetName);
      
      if (!filePath) {
        message.error('无法获取文件路径，请重新选择文件');
        setIsLoading(false);
        return;
      }
      
      // 获取工作表数据进行预览
      const result = await window.electronAPI.invoke('excel:readSheet', filePath, sheetName);
      console.log('工作表数据请求结果:', result);
      
      if (result.success) {
        // 数据加载成功，设置预览数据并前进到数据预览阶段
        const headers = result.data.headers;
        const rows = result.data.rows;
        
        // 记录数据并更新界面
        setPreviewData(rows);
        setHeaders(headers);
        
        // 这里初始化字段映射，并提前算出推荐的映射关系
        console.log('准备初始化字段映射关系');        
        const initialMapping: Record<string, string> = {};
        
        // 定义数据库目标字段列表
        const targetFields = [
          { id: 'employee_no', name: '工号' },
          { id: 'name', name: '姓名' },
          { id: 'department_id', name: '部门' },
          { id: 'position_id', name: '职位' },
          { id: 'entry_date', name: '入职日期' },
          { id: 'base_salary', name: '基本工资' },
          { id: 'status', name: '状态' },
          { id: 'gender', name: '性别' },
          { id: 'id_card', name: '身份证号' },
          { id: 'phone', name: '手机号' },
          { id: 'email', name: '邮箱' },
          { id: 'address', name: '地址' }
        ];
        
        // 尝试自动映射字段
        if (headers && headers.length > 0) {
          headers.forEach((header: string) => {
            // 尝试根据名称相似度匹配字段
            let bestMatch = '';
            let bestScore = 0;
            
            targetFields.forEach(field => {
              // 简单的相似度评分
              let score = 0;
              const headerLower = header.toLowerCase();
              const fieldNameLower = field.name.toLowerCase();
              const fieldIdLower = field.id.toLowerCase();
              
              // 检查包含关系
              if (headerLower.includes(fieldNameLower) || fieldNameLower.includes(headerLower)) {
                score += 2;
              }
              if (headerLower.includes(fieldIdLower) || fieldIdLower.includes(headerLower)) {
                score += 2;
              }
              
              // 检查起始字符匹配
              if (headerLower.startsWith(fieldNameLower.charAt(0)) || fieldNameLower.startsWith(headerLower.charAt(0))) {
                score += 1;
              }
              
              // 如果找到更好的匹配，更新
              if (score > bestScore) {
                bestScore = score;
                bestMatch = field.id;
              }
            });
            
            // 如果找到匹配，添加到映射
            if (bestScore > 0) {
              initialMapping[header] = bestMatch;
            }
          });
        }
        
        // 更新字段映射状态
        console.log('初始化字段映射关系:', initialMapping);
        setFieldMapping(initialMapping);
        
        // 设置页面状态为数据预览
        setImportStep('preview-data');
      } else {
        message.error('读取工作表数据失败: ' + result.message);
      }
    } catch (error) {
      console.error('处理工作表出错:', error); // 使用console.error
      message.error('处理工作表出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理字段映射
  const handleFieldMap = (mapping: Record<string, string>) => {
    console.log('设置字段映射:', mapping);
    setFieldMapping(mapping);
    // 转入字段映射阶段
    setImportStep('map-fields');
  };

  // 执行导入
  const handleExecuteImport = async () => {
    setImportStep('importing');
    setImportProgress(0);
    setIsLoading(true);
    
    try {
      // 准备导入数据
      const importData = previewData.map(row => {
        const employee: any = {};
        Object.keys(fieldMapping).forEach(excelColumn => {
          const fieldName = fieldMapping[excelColumn];
          const columnIndex = headers.indexOf(excelColumn);
          if (columnIndex !== -1 && fieldName) {
            employee[fieldName] = row[columnIndex];
          }
        });
        return employee;
      });
      
      // 批量导入员工
      const response = await window.electronAPI['employee:batchImportEmployees'](importData);
      
      if (response.success) {
        message.success(`成功导入 ${response.data.success} 名员工`);
        
        if (response.data.failures > 0) {
          message.warning(`${response.data.failures} 名员工导入失败`);
        }
        
        // 重新获取员工列表
        fetchEmployees(selectedDepartment || undefined);
        setIsImportModalVisible(false);
      } else {
        message.error('批量导入员工失败: ' + response.message);
      }
    } catch (error) {
      message.error('执行导入出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭导入对话框
  const handleCloseImport = () => {
    setIsImportModalVisible(false);
  };

  // 导出员工信息
  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // 获取要导出的员工数据
      const dataToExport = employees.map(employee => ({
        '工号': employee.employee_no,
        '姓名': employee.name,
        '部门': employee.department_name,
        '职位': employee.position_name,
        '入职日期': employee.entry_date,
        '基本工资': employee.base_salary,
        '状态': employee.status === 'active' ? '在职' : '离职'
      }));
      
      // 导出数据
      const result = await window.electronAPI.invoke('excel:exportData', {
        sheetName: '员工信息',
        data: dataToExport
      });
      
      if (result.success) {
        message.success('员工数据导出成功');
      } else {
        message.error('导出员工数据失败: ' + result.message);
      }
    } catch (error) {
      message.error('导出员工数据出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<Employee> = [
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      sorter: (a, b) => a.employee_no.localeCompare(b.employee_no)
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      sorter: (a, b) => (a.department_name || '').localeCompare(b.department_name || '')
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      key: 'position_name',
      sorter: (a, b) => (a.position_name || '').localeCompare(b.position_name || '')
    },
    {
      title: '入职日期',
      dataIndex: 'entry_date',
      key: 'entry_date',
      sorter: (a, b) => a.entry_date.localeCompare(b.entry_date),
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '-'
    },
    {
      title: '基本工资',
      dataIndex: 'base_salary',
      key: 'base_salary',
      sorter: (a, b) => a.base_salary - b.base_salary,
      render: (text) => text.toFixed(2)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Text type={text === 'active' ? 'success' : 'danger'}>
          {text === 'active' ? '在职' : '离职'}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditEmployee(record)}
            type="link"
          >
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: '确认删除',
              content: `确定要删除员工 ${record.name} (${record.employee_no}) 吗？`,
              onOk: () => handleDeleteEmployee(record.id),
              okText: '删除',
              cancelText: '取消',
              okButtonProps: { danger: true }
            })}
            danger
            type="link"
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="employee-management">
      <div className="page-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>员工管理</h2>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>部门筛选：</span>
              <Select
                style={{ width: 200 }}
                placeholder="选择部门"
                allowClear
                onChange={handleDepartmentChange}
                value={selectedDepartment}
              >
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>
        <div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddEmployee}
            >
              添加员工
            </Button>
            <Button
              icon={<TeamOutlined />}
              onClick={() => setActiveTab('organization')}
              style={{ marginLeft: 8 }}
            >
              组织架构
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={handleImport}
            >
              批量导入
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出Excel
            </Button>
          </Space>
        </div>
      </div>

      {activeTab === 'employees' ? (
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div></div> {/* 左侧留空，不显示标题 */}
            <Button icon={<ArrowLeftOutlined />} onClick={() => setActiveTab('employees')}>返回员工管理</Button>
          </div>
          <OrganizationStructure />
        </>
      )}

      {/* 员工编辑对话框 */}
      <Modal
        title={selectedEmployee ? '编辑员工' : '添加员工'}
        open={isEditing}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          ref={formRef}
          layout="vertical"
          onFinish={handleSaveEmployee}
        >
          <Form.Item
            name="employee_no"
            label="员工工号"
            rules={[{ required: true, message: '请输入员工工号' }]}
            validateStatus={fieldErrors.employee_no ? 'error' : undefined}
            help={fieldErrors.employee_no}
          >
            <Input placeholder="请输入员工工号" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="员工姓名"
            rules={[{ required: true, message: '请输入员工姓名' }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          
          <Form.Item
            name="department_id"
            label="所属部门"
            rules={[{ required: true, message: '请选择所属部门' }]}
          >
            <Select placeholder="请选择部门">
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="position_id"
            label="职位"
            rules={[{ required: true, message: '请选择职位' }]}
          >
            <Select placeholder="请选择职位">
              {positions
                .filter(pos => !formRef.current?.getFieldValue('department_id') || pos.department_id === formRef.current.getFieldValue('department_id'))
                .map(pos => (
                  <Option key={pos.id} value={pos.id}>{pos.name}</Option>
                ))
              }
            </Select>
          </Form.Item>
          
          <Form.Item
            name="entry_date"
            label="入职日期"
            rules={[{ required: true, message: '请选择入职日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
          </Form.Item>
          
          <Form.Item
            name="base_salary"
            label="基本工资"
            rules={[{ required: true, message: '请输入基本工资' }]}
          >
            <Input type="number" placeholder="请输入基本工资" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="员工状态"
            initialValue="active"
          >
            <Select>
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="gender"
            label="性别"
          >
            <Select placeholder="请选择性别">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="salary_group_id"
            label="薪资组"
            rules={[{ required: true, message: '请选择薪资组' }]}
          >
            <Select placeholder="请选择薪资组">
              {salaryGroups.length > 0 ? (
                salaryGroups.map(group => (
                  <Option key={group.id} value={group.id}>{group.name}</Option>
                ))
              ) : (
                <Option value={1}>默认薪资组</Option>
              )}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="social_insurance_group_id"
            label="社保组"
            rules={[{ required: true, message: '请选择社保组' }]}
          >
            <Select placeholder="请选择社保组">
              {socialInsuranceGroups.length > 0 ? (
                socialInsuranceGroups.map(group => (
                  <Option key={group.id} value={group.id}>{group.name}</Option>
                ))
              ) : (
                <Option value={1}>默认社保组</Option>
              )}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCancel}>取消</Button>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  保存
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入员工向导 - 弹窗形式 */}
      <Modal
        title="批量导入员工数据"
        open={isImportModalVisible}
        onCancel={handleCloseImport}
        footer={null}
        width={800}
        maskClosable={false}
      >
        <ImportEmployeesWizard
          isOpen={isImportModalVisible}
          step={importStep}
          selectedFile={selectedFile}
          fileSheets={sheetNames}
          selectedSheet={selectedSheet}
          previewData={previewData}
          headers={headers}
          fieldMapping={fieldMapping}
          importProgress={importProgress}
          departments={departments}
          positions={positions}
          onClose={handleCloseImport}
          onFileSelect={handleFileSelect}
          onSheetSelect={handleSheetSelect}
          onFieldMap={handleFieldMap}
          onImport={handleExecuteImport}
          onStepChange={setImportStep}
        />
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
