/**
 * 公式编辑器组件
 * 支持用户使用变量名编辑公式，提供语法高亮和变量提示
 */

import React, { useState, useEffect } from 'react';
import { Input, Tooltip, Tag, Card, Typography, Space } from 'antd';
import type { InputRef } from 'antd';
import { SalaryItem } from '../../services/payrollService';

const { Text, Paragraph } = Typography;

interface FormulaEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  variables: SalaryItem[];
  placeholder?: string;
}

/**
 * 公式编辑器组件
 * 支持用户使用变量名编辑公式，提供语法高亮和变量提示
 */
const FormulaEditor: React.FC<FormulaEditorProps> = ({
  value = '',
  onChange,
  variables,
  placeholder = '请输入公式，例如: ${基本工资} * 0.2'
}) => {
  const [formula, setFormula] = useState<string>(value);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showVariableList, setShowVariableList] = useState<boolean>(false);
  
  // 当外部value变化时更新内部状态
  useEffect(() => {
    setFormula(value);
  }, [value]);
  
  // 处理公式变化
  const handleFormulaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFormula(newValue);
    setCursorPosition(e.target.selectionStart || 0);
    
    // 触发外部onChange
    if (onChange) {
      onChange(newValue);
    }
  };
  
  // 处理变量插入
  const handleInsertVariable = (variableName: string) => {
    const before = formula.substring(0, cursorPosition);
    const after = formula.substring(cursorPosition);
    const newFormula = `${before}\${${variableName}}${after}`;
    
    setFormula(newFormula);
    
    // 触发外部onChange
    if (onChange) {
      onChange(newFormula);
    }
    
    // 隐藏变量列表
    setShowVariableList(false);
  };
  
  // 渲染变量列表
  const renderVariableList = () => {
    return (
      <Card 
        title="可用变量" 
        size="small" 
        style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
        extra={<Text type="secondary" onClick={() => setShowVariableList(false)} style={{ cursor: 'pointer' }}>关闭</Text>}
      >
        <Space wrap>
          {variables.map(variable => (
            <Tag 
              key={variable.id} 
              color="blue" 
              onClick={() => handleInsertVariable(variable.name)}
              style={{ cursor: 'pointer' }}
            >
              {variable.name}
            </Tag>
          ))}
        </Space>
      </Card>
    );
  };
  
  // 渲染语法高亮的公式
  const renderHighlightedFormula = () => {
    // 简单的语法高亮实现
    // 实际项目中可以使用更复杂的语法高亮库
    const highlightedHtml = formula
      .replace(/\$\{([^}]+)\}/g, '<span style="color: #1890ff;">\${$1}</span>') // 变量
      .replace(/([+\-*\/\(\)])/g, '<span style="color: #fa8c16;">$1</span>') // 运算符
      .replace(/(\d+(\.\d+)?)/g, '<span style="color: #52c41a;">$1</span>'); // 数字
    
    return (
      <div 
        style={{ 
          padding: '8px 12px', 
          border: '1px solid #d9d9d9', 
          borderRadius: 2,
          marginTop: 8,
          backgroundColor: '#f5f5f5',
          fontFamily: 'monospace'
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  };
  
  return (
    <div className="formula-editor">
      <Input.TextArea
        value={formula}
        onChange={handleFormulaChange}
        placeholder={placeholder}
        autoSize={{ minRows: 3, maxRows: 6 }}
        onFocus={() => setShowVariableList(true)}
      />
      
      {formula && (
        <Tooltip title="公式预览">
          {renderHighlightedFormula()}
        </Tooltip>
      )}
      
      {showVariableList && renderVariableList()}
      
      <Paragraph style={{ marginTop: 8 }}>
        <Text type="secondary">提示: 使用 ${'{变量名}'} 引用其他薪酬项，例如 ${'{基本工资}'} * 0.2</Text>
      </Paragraph>
    </div>
  );
};

export default FormulaEditor;