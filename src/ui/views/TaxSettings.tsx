import React, { useState, useEffect } from 'react';
import TaxFormulaForm from '../components/TaxFormulaForm'; // 导入 TaxFormulaForm 组件

interface TaxFormula {
  id?: number;
  name: string;
  isDefault: boolean;
  formula: {
    threshold: number;
    deductions?: any[];
    rates: Array<{
      level: number;
      upper: number;
      rate: number;
      quick_deduction: number;
    }>;
  };
}

const TaxSettings: React.FC = () => {
  const [taxFormulas, setTaxFormulas] = useState<TaxFormula[]>([]);
  const [editingFormula, setEditingFormula] = useState<TaxFormula | null>(null);

  useEffect(() => {
    // TODO: 从后端服务加载个税公式列表
    const loadTaxFormulas = async () => {
      // 示例数据
      const dummyFormulas: TaxFormula[] = [
        {
          id: 1,
          name: '个人所得税（2019年起）',
          isDefault: true,
          formula: {
            threshold: 5000,
            deductions: [],
            rates: [
              { level: 1, upper: 3000, rate: 0.03, quick_deduction: 0 },
              { level: 2, upper: 12000, rate: 0.1, quick_deduction: 210 },
              { level: 3, upper: 25000, rate: 0.2, quick_deduction: 1690 },
              { level: 4, upper: 35000, rate: 0.25, quick_deduction: 4410 },
              { level: 5, upper: 55000, rate: 0.3, quick_deduction: 7160 },
              { level: 6, upper: 80000, rate: 0.35, quick_deduction: 15660 },
              { level: 7, upper: Infinity, rate: 0.45, quick_deduction: 27260 }
            ]
          }
        },
        // 可以添加更多示例公式
      ];
      setTaxFormulas(dummyFormulas);
    };

    loadTaxFormulas();
  }, []);

  const handleEdit = (formula: TaxFormula) => {
    setEditingFormula(formula);
  };

  const handleDelete = async (id: number) => {
    // TODO: 调用后端服务删除个税公式
    console.log('删除公式:', id);
    setTaxFormulas(taxFormulas.filter(f => f.id !== id));
  };

  const handleSave = async (formula: TaxFormula) => {
    // TODO: 调用后端服务保存个税公式
    console.log('保存公式:', formula);
    if (formula.id) {
      setTaxFormulas(taxFormulas.map(f => f.id === formula.id ? formula : f));
    } else {
      // 模拟生成ID
      const newFormula = { ...formula, id: Date.now() };
      setTaxFormulas([...taxFormulas, newFormula]);
    }
    setEditingFormula(null);
  };

  const handleCancelEdit = () => {
    setEditingFormula(null);
  };

  return (
    <div>
      <h2>个税设置</h2>
      <button onClick={() => setEditingFormula({ name: '', isDefault: false, formula: { threshold: 5000, rates: [] } })}>添加新公式</button>
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>是否默认</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {taxFormulas.map(formula => (
            <tr key={formula.id}>
              <td>{formula.name}</td>
              <td>{formula.isDefault ? '是' : '否'}</td>
              <td>
                <button onClick={() => handleEdit(formula)}>编辑</button>
                <button onClick={() => handleDelete(formula.id!)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingFormula && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingFormula.id ? '编辑个税公式' : '添加个税公式'}</h3>
            {/* TODO: 使用 TaxFormulaForm 组件 */}
            <TaxFormulaForm // 集成 TaxFormulaForm 组件
              formula={editingFormula}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSettings;