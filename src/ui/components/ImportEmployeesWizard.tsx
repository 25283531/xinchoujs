import React, { useState, useEffect } from 'react';
import styles from './ImportEmployeesWizard.module.css';

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
}): JSX.Element | null => {
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
          <div>
            <h3>选择员工数据文件</h3>
            <p>请选择包含员工数据的Excel文件(.xlsx或.xls格式)</p>
            
            <div className={styles.fileSelectArea}>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="employee-file-input"
              />
              <label htmlFor="employee-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📄</span>
                <span>点击选择文件或拖拽文件到这里</span>
              </label>
            </div>
            
            {selectedFile && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
                <p>已选择文件: {selectedFile.name}</p>
              </div>
            )}
          </div>
        );
        
      case 'select-sheet':
        return (
          <div>
            <h3>选择工作表</h3>
            <p>该Excel文件包含以下工作表，请选择要导入的工作表:</p>
            <div className={styles.sheetsList}>
              {fileSheets.length > 0 ? (
                fileSheets.map(sheet => (
                  <div 
                    key={sheet} 
                    className={`${styles.sheetItem} ${selectedSheet === sheet ? styles.selected : ''}`}
                    onClick={() => onSheetSelect(sheet)}
                  >
                    {sheet}
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>未找到工作表，请返回上一步重新选择文件</div>
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
          <div>
            <h3>数据预览</h3>
            <p>以下是前10行数据预览，请确认数据格式是否正确: <small>(共{previewData.length}行数据)</small></p>
            
            {previewData.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, i) => (
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
              <div style={{ padding: '40px', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '20px' }}>
                <p>无法预览数据，请返回选择其他工作表。</p>
              </div>
            )}
          </div>
        );
        
      case 'map-fields':
        return (
          <div>
            <h3>字段映射</h3>
            <p>请将Excel表格中的列映射到员工数据字段:</p>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <h4 style={{ color: '#52c41a', marginTop: 0 }}>数据验证提示</h4>
              <p>系统将在导入前对数据进行验证，请确保：</p>
              <ul>
                <li><strong>工号</strong>和<strong>姓名</strong>为必填字段</li>
                <li><strong>工号</strong>格式正确（字母、数字和连字符）</li>
                <li><strong>入职日期</strong>支持多种格式：YYYY-MM-DD、YYYY-MM、YYYY/MM/DD、YYYY.MM.DD、DD/MM/YYYY、MM/DD/YYYY，以及Excel日期值</li>
                <li><strong>基本工资</strong>必须是数字</li>
                <li><strong>手机号</strong>格式为11位数字（1开头）</li>
                <li><strong>邮箱</strong>格式正确（包含@符号）</li>
                <li><strong>身份证号</strong>格式为18位（最后一位可以是X）</li>
              </ul>
              <p>如果数据不符合要求，系统会在导入结果中显示具体错误信息。</p>
            </div>
            
            <button 
              className={styles.secondaryButton}
              onClick={autoMapFields}
              style={{ marginBottom: '20px' }}
            >
              自动映射字段
            </button>
            
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Excel列名</th>
                    <th>映射到字段</th>
                    <th>必填</th>
                    <th>格式要求</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, i) => {
                    const selectedField = fieldMapping[header] || '';
                    let isRequired = false;
                    let formatRequirement = '';
                    
                    // 根据字段类型设置验证信息
                    switch (selectedField) {
                      case 'employee_no':
                        isRequired = true;
                        formatRequirement = '字母、数字和连字符';
                        break;
                      case 'name':
                        isRequired = true;
                        formatRequirement = '不能为空';
                        break;
                      case 'entry_date':
                        formatRequirement = '支持多种日期格式';
                        break;
                      case 'base_salary':
                        formatRequirement = '数字';
                        break;
                      case 'phone':
                        formatRequirement = '11位数字（1开头）';
                        break;
                      case 'email':
                        formatRequirement = '包含@符号';
                        break;
                      case 'id_card':
                        formatRequirement = '18位（最后一位可以是X）';
                        break;
                    }
                    
                    return (
                      <tr key={i}>
                        <td>{header}</td>
                        <td>
                          <select 
                            value={selectedField}
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
                        <td>
                          {isRequired ? (
                            <span style={{ color: '#ff4d4f' }}>是</span>
                          ) : (
                            <span>否</span>
                          )}
                        </td>
                        <td>{formatRequirement}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      case 'importing':
        return (
          <div>
            <h3>正在导入数据</h3>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '18px', fontWeight: 'bold' }}>{importProgress}% 已完成</p>
            {importProgress === 100 && (
              <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
                <h4 style={{ color: '#52c41a', marginBottom: '8px' }}>导入完成！</h4>
                <p style={{ color: '#52c41a' }}>员工数据已成功导入系统。</p>
              </div>
            )}
          </div>
        );
    }
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

  // 渲染步骤指示器(水平布局)
  const renderStepIndicator = () => {
    const steps = [
      { id: 'select-file', name: '选择文件' },
      { id: 'select-sheet', name: '选择工作表' },
      { id: 'preview-data', name: '数据预览' },
      { id: 'map-fields', name: '字段映射' },
      { id: 'importing', name: '导入员工数据' }
    ];
    
    return (
      <div className={styles.stepIndicator}>
        <div className={styles.horizontalSteps}>
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`${styles.stepItem} ${styles[getStepStatus(s.id)]}`}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <div className={styles.stepName}>{s.name}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={`${styles.stepArrow} ${getStepStatus(s.id) === 'completed' ? styles.completed : ''}`}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染对话框内容
  if (!isOpen) return null;
  
  return (
    <div className={styles.wizardBackdrop}>
      <div className={styles.wizardModal}>
        <div className={styles.wizardHeader}>
          <h2>批量导入员工数据</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {renderStepIndicator()}
        
        <div className={styles.wizardContent}>
          {renderStepContent()}
        </div>
        
        <div className={styles.wizardFooter}>
          {step !== 'select-file' && step !== 'importing' && (
            <button 
              className={styles.secondaryButton}
              onClick={handleBack}
            >
              上一步
            </button>
          )}
          
          {step !== 'importing' && (
            <button 
              className={styles.primaryButton}
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
              className={styles.primaryButton}
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

export default React.memo(ImportEmployeesWizard);
