import React, { useState, useEffect } from 'react';
import '../../ui/styles/importWizard.css';

// 导入向导组件的属性接口
interface ImportEmployeesWizardProps {
  isOpen: boolean;
  step: 'select-file' | 'select-sheet' | 'preview-data' | 'map-fields' | 'importing';
  selectedFile: File | null;
  fileSheets: string[];
  selectedSheet: string;
  previewData: any[][];
  headers: string[];
  fieldMapping: Record<string, string>;
  importProgress: number;
  departments: any[];
  positions: any[];
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onSheetSelect: (sheetName: string) => void;
  onFieldMap: (mapping: Record<string, string>) => void;
  onImport: () => Promise<void>;
  onStepChange: (step: 'select-file' | 'select-sheet' | 'preview-data' | 'map-fields' | 'importing') => void;
}

// 员工导入向导组件
const ImportEmployeesWizard: React.FC<ImportEmployeesWizardProps> = ({
  isOpen,
  step,
  selectedFile,
  fileSheets,
  selectedSheet,
  previewData,
  headers,
  fieldMapping,
  importProgress,
  departments,
  positions,
  onClose,
  onFileSelect,
  onSheetSelect,
  onFieldMap,
  onImport,
  onStepChange
}) => {
  // 可用的目标字段列表
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
  
  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };
  
  // 处理下一步操作
  const handleNext = () => {
    switch (step) {
      case 'select-file':
        onStepChange('select-sheet');
        break;
      case 'select-sheet':
        onStepChange('preview-data');
        break;
      case 'preview-data':
        onStepChange('map-fields');
        break;
      case 'map-fields':
        onStepChange('importing');
        onImport(); // 开始导入过程
        break;
    }
  };
  
  // 处理上一步操作
  const handleBack = () => {
    switch (step) {
      case 'select-sheet':
        onStepChange('select-file');
        break;
      case 'preview-data':
        onStepChange('select-sheet');
        break;
      case 'map-fields':
        onStepChange('preview-data');
        break;
    }
  };
  
  // 处理字段映射更改
  const handleMappingChange = (sourceField: string, targetField: string) => {
    const newMapping = { ...fieldMapping, [sourceField]: targetField };
    onFieldMap(newMapping);
  };
  
  // 自动映射字段（根据相似名称）
  const autoMapFields = () => {
    const newMapping: Record<string, string> = {};
    
    headers.forEach(header => {
      // 尝试根据名称相似度匹配字段
      let bestMatch = '';
      let bestScore = 0;
      
      targetFields.forEach(field => {
        // 简单的相似度评分（可以使用更复杂的算法）
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
        newMapping[header] = bestMatch;
      }
    });
    
    onFieldMap(newMapping);
  };
  
  // 渲染不同步骤的内容
  const renderStepContent = () => {
    switch (step) {
      case 'select-file':
        return (
          <div className="step-content file-selection">
            <h3>选择员工数据文件</h3>
            <p>请选择包含员工数据的Excel文件(.xlsx或.xls格式)</p>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <div className="selected-file">
                <p>已选择文件: {selectedFile.name}</p>
              </div>
            )}
          </div>
        );
        
      case 'select-sheet':
        return (
          <div className="step-content sheet-selection">
            <h3>选择工作表</h3>
            <p>该Excel文件包含以下工作表，请选择要导入的工作表:</p>
            <div className="sheets-list">
              {fileSheets.length > 0 ? (
                fileSheets.map(sheet => (
                  <div 
                    key={sheet} 
                    className={`sheet-item ${selectedSheet === sheet ? 'selected' : ''}`}
                    onClick={() => onSheetSelect(sheet)}
                  >
                    {sheet}
                  </div>
                ))
              ) : (
                <div className="no-sheets">未找到工作表，请返回上一步重新选择文件</div>
              )}
            </div>
            {/* 添加调试信息 */}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              <p>当前选中的工作表: {selectedSheet || '未选择'}</p>
              <p>可用工作表数量: {fileSheets.length}</p>
            </div>
          </div>
        );
        
      case 'preview-data':
        return (
          <div className="step-content data-preview">
            <h3>数据预览</h3>
            <p>以下是前10行数据预览，请确认数据格式是否正确:</p>
            
            {previewData.length > 0 ? (
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell?.toString() || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>无法预览数据，请返回选择其他工作表。</p>
            )}
          </div>
        );
        
      case 'map-fields':
        return (
          <div className="step-content field-mapping">
            <h3>字段映射</h3>
            <p>请将Excel表格中的列映射到员工数据字段:</p>
            
            <button 
              className="auto-map-button" 
              onClick={autoMapFields}
            >
              自动映射字段
            </button>
            
            <div className="mapping-table-container">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Excel列名</th>
                    <th>映射到字段</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, i) => (
                    <tr key={i}>
                      <td>{header}</td>
                      <td>
                        <select 
                          value={fieldMapping[header] || ''}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                        >
                          <option value="">-- 不导入此字段 --</option>
                          {targetFields.map(field => (
                            <option key={field.id} value={field.id}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      case 'importing':
        return (
          <div className="step-content importing">
            <h3>正在导入数据</h3>
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p>{importProgress}% 已完成</p>
            {importProgress === 100 && (
              <div className="import-complete">
                <h4>导入完成！</h4>
                <p>员工数据已成功导入系统。</p>
              </div>
            )}
          </div>
        );
    }
  };
  
  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const steps = [
      { id: 'select-file', name: '选择文件' },
      { id: 'select-sheet', name: '选择工作表' },
      { id: 'preview-data', name: '数据预览' },
      { id: 'map-fields', name: '字段映射' },
      { id: 'importing', name: '导入中' }
    ];
    
    return (
      <div className="step-indicator">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`step ${step === s.id ? 'active' : ''} ${getStepStatus(s.id)}`}>
              <div className="step-number">{i + 1}</div>
              <div className="step-name">{s.name}</div>
            </div>
            {i < steps.length - 1 && <div className="step-connector"></div>}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  // 获取步骤状态
  const getStepStatus = (stepId: string): string => {
    const stepOrder = ['select-file', 'select-sheet', 'preview-data', 'map-fields', 'importing'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };
  
  // 渲染对话框内容
  if (!isOpen) return null;
  
  return (
    <div className="import-wizard-backdrop">
      <div className="import-wizard-modal">
        <div className="import-wizard-header">
          <h2>批量导入员工数据</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {renderStepIndicator()}
        
        <div className="import-wizard-content">
          {renderStepContent()}
        </div>
        
        <div className="import-wizard-footer">
          {step !== 'select-file' && step !== 'importing' && (
            <button 
              className="back-button"
              onClick={handleBack}
            >
              上一步
            </button>
          )}
          
          {step !== 'importing' && (
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={
                // 在选择文件阶段，文件已选择则启用按钮
                (step === 'select-file' && (!selectedFile || !selectedFile.name)) ||
                // 不对选择工作表阶段进行限制，始终启用下一步按钮
                // 在字段映射阶段，至少已映射一个字段则启用按钮
                (step === 'map-fields' && Object.keys(fieldMapping).length === 0)
              }
            >
              {step === 'map-fields' ? '开始导入' : '下一步'}
            </button>
          )}
          
          {step === 'importing' && importProgress === 100 && (
            <button 
              className="finish-button"
              onClick={onClose}
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportEmployeesWizard;
