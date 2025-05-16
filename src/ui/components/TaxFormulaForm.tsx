import React, { useState, useEffect } from 'react';

interface TaxFormula {
  id?: number;
  name: string;
  isDefault: boolean;
  formula: {
    threshold: number;
    deductions?: any[]; // 简化处理，实际应有详细结构
    rates: Array<{
      level: number;
      upper: number;
      rate: number;
      quick_deduction: number;
    }>;
  };
}

interface TaxFormulaFormProps {
  formula: TaxFormula;
  onSave: (formula: TaxFormula) => void;
  onCancel: () => void;
}

const TaxFormulaForm: React.FC<TaxFormulaFormProps> = ({ formula, onSave, onCancel }) => {
  const [formData, setFormData] = useState<TaxFormula>(formula);

  useEffect(() => {
    setFormData(formula);
  }, [formula]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isDefault') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'threshold') {
      setFormData({ ...formData, formula: { ...formData.formula, [name]: parseFloat(value) || 0 } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRateChange = (index: number, field: keyof TaxFormula['formula']['rates'][0], value: string) => {
    const newRates = [...formData.formula.rates];
    newRates[index] = {
      ...newRates[index],
      [field]: field === 'upper' ? (value === 'Infinity' ? Infinity : parseFloat(value) || 0) : parseFloat(value) || 0,
    };
    setFormData({ ...formData, formula: { ...formData.formula, rates: newRates } });
  };

  const handleAddRate = () => {
    setFormData({
      ...formData,
      formula: {
        ...formData.formula,
        rates: [
          ...formData.formula.rates,
          { level: formData.formula.rates.length + 1, upper: 0, rate: 0, quick_deduction: 0 },
        ],
      },
    });
  };

  const handleRemoveRate = (index: number) => {
    const newRates = formData.formula.rates.filter((_, i) => i !== index);
    setFormData({ ...formData, formula: { ...formData.formula, rates: newRates } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">公式名称:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <label htmlFor="isDefault">是否默认:</label>
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="threshold">起征点:</label>
        <input
          type="number"
          id="threshold"
          name="threshold"
          value={formData.formula.threshold}
          onChange={handleInputChange}
          step="0.01"
        />
      </div>

      <h4>税率分级</h4>
      <table>
        <thead>
          <tr>
            <th>级别</th>
            <th>本级距上限 (不含)</th>
            <th>税率 (%)</th>
            <th>速算扣除数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {formData.formula.rates.map((rate, index) => (
            <tr key={index}>
              <td>{rate.level}</td>
              <td>
                <input
                  type="number"
                  value={rate.upper === Infinity ? '' : rate.upper}
                  onChange={(e) => handleRateChange(index, 'upper', e.target.value)}
                  step="0.01"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={rate.rate * 100} // 显示为百分比
                  onChange={(e) => handleRateChange(index, 'rate', (parseFloat(e.target.value) / 100).toString())}
                  step="0.01"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={rate.quick_deduction}
                  onChange={(e) => handleRateChange(index, 'quick_deduction', e.target.value)}
                  step="0.01"
                />
              </td>
              <td>
                <button type="button" onClick={() => handleRemoveRate(index)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={handleAddRate}>添加分级</button>

      {/* TODO: 添加专项附加扣除管理 */}

      <div>
        <button type="submit">保存</button>
        <button type="button" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
};

export default TaxFormulaForm;