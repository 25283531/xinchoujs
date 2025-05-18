/**
 * 薪酬组管理界面
 * 实现薪酬组的创建、编辑、删除和分配功能
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Card,
  List,
  Tag,
  Tooltip,
  Space,
  Typography,
  Divider
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType, TableProps, FormListFieldData } from 'antd';
import { SalaryGroup, SalaryItem } from '../../services/payrollService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const SalaryGroupManagement: React.FC = () => {
  // 服务实例 - 通过 IPC 调用主进程服务
  
  // 状态
  const [salaryGroups, setSalaryGroups] = useState<SalaryGroup[]>([]);
  // 分配记录状态
  const [records, setRecords] = useState<Array<{id: number; name: string; department?: string; position?: string; value?: string}>>([]);
  const [salaryItems, setSalaryItems] = useState<SalaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentGroup, setCurrentGroup] = useState<SalaryGroup | null>(null);
  const [form] = Form.useForm();
  const [fields, setFields] = useState<FormListFieldData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [departments, setDepartments] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Array<{id: number; name: string; department: string; position: string}>>([]);
  
  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with IPC call to main process
      // const groups = await salaryGroupService.getAllSalaryGroups();
      // const items = await salaryItemService.getAllSalaryItems();
      // 使用 IPC 调用获取数据
      if (window.electronAPI) {
        const groups = await window.electronAPI.getAllSalaryGroups();
        const items = await window.electronAPI.getAllSalaryItems();
        setSalaryGroups(groups);
        setSalaryItems(items);
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法加载数据。');
      }
      
      // 加载部门、职位和员工数据
      // 实际项目中应该从数据库加载
      setDepartments(['技术部', '人事部', '财务部', '市场部']);
      setPositions(['工程师', '经理', '主管', '专员']);
      setEmployees([
        { id: 1, name: '张三', department: '技术部', position: '工程师' },
        { id: 2, name: '李四', department: '人事部', position: '经理' },
        { id: 3, name: '王五', department: '财务部', position: '主管' }
      ]);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // 打开创建/编辑模态框
  const openModal = (group?: SalaryGroup) => {
    setCurrentGroup(group || null);
    form.resetFields();
    
    if (group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        items: group.items.map(item => ({
          salaryItemId: item.salaryItemId,
          calculationOrder: item.calculationOrder
        }))
      });
    }
    
    setModalVisible(true);
  };
  
  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setCurrentGroup(null);
    form.resetFields();
  };
  
  // 保存薪酬组
  interface SalaryGroupFormValues {
    name: string;
    description?: string;
    items?: Array<{
      salaryItemId: number;
      calculationOrder: number;
    }>;
  }
  
  const saveSalaryGroup = async (values: SalaryGroupFormValues) => {
    try {
      const salaryGroup: Omit<SalaryGroup, 'id'> = {
        name: values.name,
        description: values.description,
        items: values.items || []
      };
      
      if (window.electronAPI) {
        if (currentGroup) {
          await window.electronAPI.updateSalaryGroup(currentGroup.id, salaryGroup);
          message.success('薪酬组更新成功');
        } else {
          await window.electronAPI.createSalaryGroup(salaryGroup);
          message.success('薪酬组创建成功');
        }
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法保存薪酬组。');
      }
      
      closeModal();
      loadData();
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`);
      console.error(error);
    }
  };
  
  // 删除薪酬组
  const deleteSalaryGroup = async (id: number) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteSalaryGroup(id);
        message.success('薪酬组删除成功');
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法删除薪酬组。');
      }
      loadData();
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`);
      console.error(error);
    }
  };
  
  // 分配薪酬组给员工
  const assignToEmployee = async (employeeId: number, salaryGroupId: number) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.assignSalaryGroupToEmployee(employeeId, salaryGroupId);
        message.success('分配成功');
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法分配薪酬组。');
      }
    } catch (error: any) {
      message.error(`分配失败: ${error.message}`);
      console.error(error);
      console.error(error);
      console.error(error);
    }
  };
  
  // 分配薪酬组给部门
  const assignToDepartment = async (department: string, salaryGroupId: number) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.assignSalaryGroupToDepartment(department, salaryGroupId);
        message.success('分配成功');
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法分配薪酬组。');
      }
    } catch (error: any) {
      message.error(`分配失败: ${error.message}`);
      console.error(error);
      console.error(error);
      console.error(error);
    }
  };
  
  // 分配薪酬组给职位
  const assignToPosition = async (position: string, salaryGroupId: number) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.assignSalaryGroupToPosition(position, salaryGroupId);
        message.success('分配成功');
      } else {
        console.error('Electron API not available.');
        message.error('Electron API 不可用，无法分配薪酬组。');
      }
    } catch (error: any) {
      message.error(`分配失败: ${error.message}`);
      console.error(error);
      console.error(error);
      console.error(error);
    }
  };
  
  // 获取薪酬项名称
  const getSalaryItemName = (id: number) => {
    const item = salaryItems.find(item => item.id === id);
    return item ? item.name : '未知薪酬项';
  };
  
  // 获取薪酬项类型显示文本
  const getSalaryItemTypeText = (type: string) => {
    switch (type) {
      case 'fixed': return '固定金额';
      case 'percentage': return '百分比';
      case 'formula': return '公式';
      default: return type;
    }
  };
  
  // 表格列定义
  const columns: TableColumnsType<SalaryGroup> = [
    {
      title: '薪酬组名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '薪酬项数量',
      key: 'itemCount',
      render: (_, record: SalaryGroup) => record.items.length
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: SalaryGroup) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => openModal(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => deleteSalaryGroup(record.id)}>删除</Button>
        </Space>
      )
    }
  ];
  
  // 渲染薪酬项选择器
  const renderSalaryItemSelector = () => {
    return (
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'salaryItemId']}
                  rules={[{ required: true, message: '请选择薪酬项' }]}
                >
                  <Select style={{ width: 200 }} placeholder="选择薪酬项">
                    {salaryItems.map(item => (
                      <Option key={item.id} value={item.id}>
                        {item.name} ({getSalaryItemTypeText(item.type)})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'calculationOrder']}
                  rules={[{ required: true, message: '请输入计算顺序' }]}
                >
                  <Input type="number" style={{ width: 100 }} placeholder="计算顺序" />
                </Form.Item>
                <Button danger onClick={() => remove(name)}>删除</Button>
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                添加薪酬项
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    );
  };
  
  // 渲染公式帮助信息
  const renderFormulaHelp = () => {
    return (
      <Card title="公式编辑帮助" size="small" style={{ marginBottom: 16 }}>
        <Paragraph>
          <Text strong>变量引用格式:</Text> ${'{变量名}'}
        </Paragraph>
        <Paragraph>
          <Text strong>示例:</Text> ${'{基本工资}'} + ${'{岗位津贴}'} * 0.5
        </Paragraph>
        <Paragraph>
          <Text strong>可用变量:</Text>
        </Paragraph>
        <div style={{ maxHeight: 150, overflow: 'auto' }}>
          {salaryItems.map(item => (
            <Tag key={item.id} color="blue">{item.name}</Tag>
          ))}
        </div>
        <Paragraph>
          <Text type="warning">注意: 公式中引用的变量必须在计算顺序中排在当前项之前</Text>
        </Paragraph>
      </Card>
    );
  };
  
  // 定义薪酬项表格行数据接口
  interface SalaryItemTableRow {
    salaryItemId: number;
    calculationOrder: number;
    key: number;
    name: string;
    salaryItem?: SalaryItem;
  }
  
  // 渲染薪酬组详情
  const renderSalaryGroupDetail = (group: SalaryGroup) => {
    return (
      <Card title={`薪酬组: ${group.name}`} style={{ marginBottom: 16 }}>
        <Paragraph>{group.description}</Paragraph>
        <Title level={5}>薪酬项列表:</Title>
        <Table
          dataSource={group.items.map(item => ({
            ...item,
            key: item.salaryItemId,
            name: getSalaryItemName(item.salaryItemId),
            salaryItem: salaryItems.find(i => i.id === item.salaryItemId)
          })) as SalaryItemTableRow[]}
          rowKey="salaryItemId"
          columns={[
            {
              title: '计算顺序',
              dataIndex: 'calculationOrder',
              key: 'calculationOrder',
              sorter: (a, b) => a.calculationOrder - b.calculationOrder
            },
            {
              title: '薪酬项名称',
              dataIndex: 'name',
              key: 'name'
            },
            {
              title: '类型',
              key: 'type',
              render: (_, record: SalaryItemTableRow) => getSalaryItemTypeText(record.salaryItem?.type || '')
            },
            {
              title: '值/公式',
              key: 'value',
              render: (_, record: SalaryItemTableRow) => {
                const item = record.salaryItem;
                if (!item) return '-';
                
                if (item.type === 'formula') {
                  return (
                    <Tooltip title="点击查看公式详情">
                      <Text code ellipsis style={{ maxWidth: 300 }}>
                        {item.value}
                      </Text>
                    </Tooltip>
                  );
                }
                
                return item.type === 'percentage' ? `${item.value}%` : item.value;
              }
            }
          ]}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };
  
  // 渲染分配选项卡
  const renderAssignmentTabs = () => {
    return (
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="按部门分配" key="1">
          <List
            dataSource={departments}
            renderItem={(department: string) => (
              <List.Item
                actions={[
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择薪酬组"
                    onChange={(value: number) => assignToDepartment(department, value)}
                  >
                    {salaryGroups.map(group => (
                      <Option key={group.id} value={group.id}>{group.name}</Option>
                    ))}
                  </Select>
                ]}
              >
                <List.Item.Meta
                  title={department}
                  description={`部门: ${department}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="按职位分配" key="2">
          <List
            dataSource={positions}
            renderItem={(position: string) => (
              <List.Item
                actions={[
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择薪酬组"
                    onChange={(value: number) => assignToPosition(position, value)}
                  >
                    {salaryGroups.map(group => (
                      <Option key={group.id} value={group.id}>{group.name}</Option>
                    ))}
                  </Select>
                ]}
              >
                <List.Item.Meta
                  title={position}
                  description={`职位: ${position}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="按员工分配" key="3">
          <List
            dataSource={employees}
            renderItem={(employee: {id: number; name: string; department: string; position: string}) => (
              <List.Item
                actions={[
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择薪酬组"
                    onChange={(value: number) => assignToEmployee(employee.id, value)}
                  >
                    {salaryGroups.map(group => (
                      <Option key={group.id} value={group.id}>{group.name}</Option>
                    ))}
                  </Select>
                ]}
              >
                <List.Item.Meta
                  title={employee.name}
                  description={`部门: ${employee.department}, 职位: ${employee.position}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    );
  };
  
  return (
    <div className="salary-group-management">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>薪酬组管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增薪酬组
        </Button>
      </div>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="薪酬组列表" key="1">
          <Table
            columns={columns}
            dataSource={salaryGroups.map(group => ({ ...group, key: group.id }))}
            loading={loading}
            expandable={{
              expandedRowRender: record => renderSalaryGroupDetail(record)
            }}
          />
        </TabPane>
        <TabPane tab="薪酬组分配" key="2">
          {renderAssignmentTabs()}
        </TabPane>
      </Tabs>
      
      <Modal
        title={currentGroup ? '编辑薪酬组' : '新增薪酬组'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveSalaryGroup}
          initialValues={{ items: [] }}
        >
          <Form.Item
            name="name"
            label="薪酬组名称"
            rules={[{ required: true, message: '请输入薪酬组名称' }]}
          >
            <Input placeholder="请输入薪酬组名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          
          <Divider orientation="left">
            薪酬项
            <Tooltip title="薪酬项的计算顺序很重要，公式类型的薪酬项只能引用计算顺序在其之前的薪酬项">
              <QuestionCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </Divider>
          
          {renderFormulaHelp()}
          {renderSalaryItemSelector()}
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={closeModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryGroupManagement;