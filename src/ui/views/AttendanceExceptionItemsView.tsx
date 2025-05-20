import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Table, Modal, Space, InputNumber } from 'antd';
import { AttendanceExceptionItem } from '../../db/database';

const { Option } = Select;

const AttendanceExceptionItemsView: React.FC = () => {
  const [exceptionItems, setExceptionItems] = useState<AttendanceExceptionItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AttendanceExceptionItem | null>(null);
  const [form] = Form.useForm();

  const fetchExceptionItems = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.invoke('attendance:getExceptionItems');
        if (result.success && result.data !== undefined) {
          setExceptionItems(result.data);
        } else if (!result.success) {
          console.error('Failed to fetch exception items:', result.error);
        }
      } catch (error) {
        console.error('Error invoking getExceptionItems:', error);
      }
    }
  };

  useEffect(() => {
    fetchExceptionItems();
  }, []);

  const handleAddException = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditException = (item: AttendanceExceptionItem) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setIsModalVisible(true);
  };

  const handleDeleteException = async (id: number) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.invoke('attendance:deleteExceptionItem', id);
        if (result.success) {
          console.log('Exception item deleted successfully');
          fetchExceptionItems(); // Refresh list
        } else {
          console.error('Failed to delete exception item:', result.error);
          alert('Failed to delete exception item: ' + result.error);
        }
      } catch (error) {
        console.error('Error invoking deleteExceptionItem:', error);
        alert('Error deleting exception item: ' + error);
      }
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async values => {
      if (window.electronAPI) {
        try {
          const dataToSave = editingItem ? { ...editingItem, ...values } : values;
          const result = editingItem
            ? await window.electronAPI.invoke('attendance:updateExceptionItem', dataToSave)
            : await window.electronAPI.invoke('attendance:defineExceptionItem', dataToSave);

          if (result.success) {
            console.log('Exception item saved successfully');
            setIsModalVisible(false);
            form.resetFields();
            fetchExceptionItems(); // Refresh list
          } else {
            console.error('Failed to save exception item:', result.error);
            alert('Failed to save exception item: ' + result.error);
          }
        } catch (error) {
          console.error('Error invoking save/update exception item:', error);
          alert('Error saving/updating exception item: ' + error);
        }
      }
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingItem(null);
  };

  const columns = [
    { title: '异常名称', dataIndex: 'name', key: 'name' },
    { title: '扣款类型', dataIndex: 'deductionRuleType', key: 'deductionRuleType' },
    { title: '扣款规则值', dataIndex: 'deductionRuleValue', key: 'deductionRuleValue' },
    { title: '扣款规则阈值', dataIndex: 'deductionRuleThreshold', key: 'deductionRuleThreshold' },
    { title: '备注', dataIndex: 'notes', key: 'notes' },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: AttendanceExceptionItem) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditException(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDeleteException(record.id!)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>考勤异常设置</h2>
      <Button type="primary" onClick={handleAddException} style={{ marginBottom: 16 }}>新增异常类型</Button>
      <Table dataSource={exceptionItems} columns={columns} rowKey="id" />

      <Modal
        title={editingItem ? '编辑异常类型' : '新增异常类型'}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="异常名称"
            rules={[{ required: true, message: '请输入异常名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="deductionRuleType"
            label="扣款类型"
            rules={[{ required: true, message: '请选择扣款类型!' }]}
          >
            <Select placeholder="请选择">
              <Option value="fixed">固定金额</Option>
              <Option value="per_hour">每小时</Option>
              <Option value="per_day_salary">按天工资比例</Option>
              <Option value="tiered_count">按次数分级</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="deductionRuleValue"
            label="扣款规则值"
            rules={[{ required: true, message: '请输入扣款规则值!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={form.getFieldValue('deductionRuleType') === 'per_day_salary' ? 0.01 : 1} />
          </Form.Item>
           <Form.Item
            name="deductionRuleThreshold"
            label="扣款规则阈值 (按次数分级时有效)"
          >
            <InputNumber style={{ width: '100%' }} min={0} disabled={form.getFieldValue('deductionRuleType') !== 'tiered_count'} />
          </Form.Item>
           <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceExceptionItemsView;