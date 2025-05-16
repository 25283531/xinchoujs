/**
 * 薪酬项编辑组件
 * 支持用户编辑薪酬项，包括固定金额、百分比和公式类型
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Card, Typography, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { SalaryItem } from '../../services/payrollService';
import FormulaEditor from './FormulaEditor';

const { Text } = Typography;
const { Option } = Select;

interface SalaryItemEditorProps {
  value?: Partial<SalaryItem>;
  onChange?: (value: Partial<SalaryItem>) => void;
  variables?: SalaryItem[];
}

/**
 * 薪酬项编辑组件
 * 支持用户编辑薪酬项，包括固定金额、百分比和公式类型
 */
const SalaryItemEditor: React.FC<SalaryItemEditorProps> = ({
  value = {},
  onChange,
  variables = []
}) => {
  // 内部状态
  const [itemType, setItemType] = useState<string>(value.type || 'fixed');
  const [itemValue, setItemValue] = useState<number | string>(value.value || (value.type === 'formula' ? '' : 0));
  const [itemName, setItemName] = useState<string>(value.name || '');
  const [itemDescription, setItemDescription] = useState<string>(value.description || '');
  const [subsidyCycle, setSubsidyCycle] = useState<number>(value.subsidyCycle || 1);
  
  // 当外部value变化时更新内部状态
  useEffect(() => {
    setItemType(value.type || 'fixed');
    setItemValue(value.value || (value.type === 'formula' ? '' : 0));
    setItemName(value.name || '');
    setItemDescription(value.description || '');
    setSubsidyCycle(value.subsidyCycle || 1);
  }, [value]);
  
  // 处理类型变化
  const handleTypeChange = (type: 'fixed' | 'percentage' | 'formula' | string) => {
    setItemType(type);
    
    // 根据类型设置默认值
    let defaultValue: number | string = 0;
    if (type === 'percentage') {
      defaultValue = 0;
    } else if (type === 'formula') {
      defaultValue = '';
    }
    
    setItemValue(defaultValue);
    
    // 触发外部onChange
    if (onChange) {
      onChange({
        ...value,
        type,
        value: defaultValue
      });
    }
  };
  
  // 处理值变化
  const handleValueChange = (val: number | string | null) => {
    let newValue: number | string;

    if (itemType === 'formula') {
      // FormulaEditor returns string, treat null as empty string
      newValue = val === null ? '' : String(val);
    } else {
      // InputNumber returns number | null, treat null as 0 for fixed/percentage
      newValue = val === null ? 0 : Number(val);
    }

    setItemValue(newValue);

    // 触发外部onChange
    if (onChange) {
      onChange({
        ...value,
        value: newValue
      });
    }
  };
  
  // 处理名称变化
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setItemName(name);
    
    // 触发外部onChange
    if (onChange) {
      onChange({
        ...value,
        name
      });
    }
  };
  
  // 处理描述变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value;
    setItemDescription(description);
    
    // 触发外部onChange
    if (onChange) {
      onChange({
        ...value,
        description
      });
    }
  };
  
  // 处理补贴周期变化
  const handleSubsidyCycleChange = (cycle: number) => {
    setSubsidyCycle(cycle);
    
    // 触发外部onChange
    if (onChange) {
      onChange({
        ...value,
        subsidyCycle: cycle
      });
    }
  };
  
  // 渲染值编辑器
  const renderValueEditor = () => {
    switch (itemType) {
      case 'fixed':
        return (
          <InputNumber
            value={typeof itemValue === 'number' ? itemValue : undefined}
            onChange={handleValueChange}
            min={0}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="元"
          />
        );
      case 'percentage':
        return (
          <InputNumber
            value={typeof itemValue === 'number' ? itemValue : undefined}
            onChange={handleValueChange}
            min={0}
            max={100}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="%"
          />
        );
      case 'formula':
        return (
          <FormulaEditor
            value={typeof itemValue === 'string' ? itemValue : ''}
            onChange={handleValueChange}
            variables={variables}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="salary-item-editor" bordered={false}>
      <Form layout="vertical">
        <Form.Item label="薪酬项名称" required>
          <Input
            value={itemName}
            onChange={handleNameChange}
            placeholder="请输入薪酬项名称"
          />
        </Form.Item>
        
        <Form.Item label="薪酬项类型" required>
          <Radio.Group value={itemType} onChange={e => handleTypeChange(e.target.value)}>
            <Radio.Button value="fixed">固定金额</Radio.Button>
            <Radio.Button value="percentage">百分比</Radio.Button>
            <Radio.Button value="formula">公式</Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item label="值/公式" required>
          {renderValueEditor()}
          {itemType === 'formula' && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              提示: 公式中可以使用 ${'{变量名}'} 引用其他薪酬项
            </Text>
          )}
        </Form.Item>
        
        <Form.Item label="补贴周期">
          <Select value={subsidyCycle} onChange={handleSubsidyCycleChange} style={{ width: '100%' }}>
            <Option value={1}>每月</Option>
            <Option value={3}>每季度</Option>
            <Option value={6}>每半年</Option>
            <Option value={12}>每年</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="描述">
          <Input.TextArea
            value={itemDescription}
            onChange={handleDescriptionChange}
            placeholder="请输入薪酬项描述"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SalaryItemEditor;