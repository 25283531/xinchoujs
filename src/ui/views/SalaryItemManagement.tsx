/**
 * 薪酬项管理界面
 * 实现薪酬项的创建、编辑、删除功能
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
  Card,
  Tooltip,
  Space,
  Typography,
  InputNumber,
  Radio
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { SalaryItemServiceImpl } from '../../services/salaryItemService.impl';
import { SalaryItem } from '../../services/payrollService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SalaryItemManagement: React.FC = () => {
  // 服务实例 - 通过 IPC 调用主进程服务
  // const salaryItemService = new SalaryItemServiceImpl(); // 直接实例化服务实现类不适用于 Electron 渲染进程
  
  // 状态
  const [salaryItems, setSalaryItems] = useState<SalaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<SalaryItem | null>(null);
  const [form] = Form.useForm();

  // 初始化加载数据
  useEffect(() => {
    fetchSalaryItems();
  }, []);

  // 获取所有薪酬项
  const fetchSalaryItems = async () => {
    setLoading(true);
    try {
      const items = await window.electronAPI.getAllSalaryItems();
      setSalaryItems(items);
    } catch (error) {
      message.error(`获取薪酬项失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns: TableColumnsType<SalaryItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'fixed': '固定值',
          'percentage': '百分比',
          'formula': '公式'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value: number, record: SalaryItem) => {
        if (record.type === 'percentage') {
          return `${value}%`;
        } else if (record.type === 'formula') {
          return (
            <Tooltip title={value}>
              <span>{String(value).length > 20 ? String(value).substring(0, 20) + '...' : value}</span>
            </Tooltip>
          );
        }
        return value;
      }
    },
    {
      title: '补贴周期',
      dataIndex: 'subsidyCycle',
      key: 'subsidyCycle',
      width: 120,
      render: (cycle: string) => {
        const cycleMap: Record<string, string> = {
          'monthly': '每月',
          'quarterly': '每季度',
          'yearly': '每年',
          'once': '一次性'
        };
        return cycleMap[cycle] || cycle || '无';
      }
    },
    {
      title: '预置项',
      dataIndex: 'isPreset',
      key: 'isPreset',
      width: 100,
      render: (isPreset: boolean) => isPreset ? '是' : '否'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            disabled={record.isPreset}
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            disabled={record.isPreset}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理添加薪酬项
  const handleAdd = () => {
    setCurrentItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'fixed',
      value: 0,
      subsidyCycle: 'monthly',
      isPreset: false
    });
    setModalVisible(true);
  };

  // 处理编辑薪酬项
  const handleEdit = (item: SalaryItem) => {
    setCurrentItem(item);
    form.setFieldsValue({
      name: item.name,
      type: item.type,
      value: item.value,
      subsidyCycle: item.subsidyCycle || 'monthly',
      isPreset: item.isPreset,
      description: item.description
    });
    setModalVisible(true);
  };

  // 处理删除薪酬项
  const handleDelete = async (item: SalaryItem) => {
    try {
      // 检查薪酬项是否被引用
      const isReferenced = await window.electronAPI.isSalaryItemReferenced(item.id);
      if (isReferenced) {
        message.error(`无法删除薪酬项 "${item.name}"，该项目正在被薪酬组使用`);
        return;
      }

      await window.electronAPI.deleteSalaryItem(item.id);
      message.success(`薪酬项 "${item.name}" 已删除`);
      fetchSalaryItems();
      fetchSalaryItems();
    } catch (error) {
      message.error(`删除薪酬项失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (currentItem) {
        // 更新薪酬项
        await window.electronAPI.updateSalaryItem(currentItem.id, values);
        message.success(`薪酬项 "${values.name}" 已更新`);
      fetchSalaryItems();
      } else {
        // 创建薪酬项
        await window.electronAPI.createSalaryItem(values);
        message.success(`薪酬项 "${values.name}" 已创建`);
      fetchSalaryItems();
      }
      
      setModalVisible(false);
      fetchSalaryItems();
    } catch (error) {
      if (error instanceof Error && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      message.error(`保存薪酬项失败: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
      console.error(error);
    }
  };

  return (
    <div className="salary-item-management">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
            <Title level={4}>薪酬项管理</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              添加薪酬项
            </Button>
          </Space>
          
          <Table 
            columns={columns} 
            dataSource={salaryItems} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>

      {/* 薪酬项编辑/创建模态框 */}
      <Modal
        title={currentItem ? `编辑薪酬项: ${currentItem.name}` : '添加薪酬项'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入薪酬项名称' }]}
          >
            <Input placeholder="请输入薪酬项名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择薪酬项类型' }]}
          >
            <Radio.Group>
              <Radio value="fixed">固定值</Radio>
              <Radio value="percentage">百分比</Radio>
              <Radio value="formula">公式</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="value"
            label="值"
            rules={[{ required: true, message: '请输入薪酬项值' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入薪酬项值"
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            name="subsidyCycle"
            label="补贴周期"
          >
            <Select placeholder="请选择补贴周期">
              <Option value="monthly">每月</Option>
              <Option value="quarterly">每季度</Option>
              <Option value="yearly">每年</Option>
              <Option value="once">一次性</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isPreset"
            label="是否预置项"
            valuePropName="checked"
          >
            <Radio.Group>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} placeholder="请输入薪酬项描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryItemManagement;