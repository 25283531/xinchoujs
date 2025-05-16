# 薪酬组与薪酬项关联关系说明

## 一、数据模型

### 1.1 薪酬项 (SalaryItem)

薪酬项是薪酬计算的基本单元，可以是固定金额、百分比或公式类型。

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 薪酬项名称 | 必填，用于在公式中引用 |
| type | VARCHAR | 类型 | fixed(固定金额), percentage(百分比), formula(公式) |
| value | TEXT | 值或公式 | 根据类型存储不同内容 |
| subsidy_cycle | INTEGER | 补贴周期 | 默认1（每月），可设置为多月一次 |
| is_preset | BOOLEAN | 是否预置 | 默认false，预置项不可删除 |
| description | TEXT | 描述 | 可选 |

### 1.2 薪酬组 (SalaryGroup)

薪酬组是多个薪酬项的集合，用于统一管理和分配给员工、部门或职位。

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 薪酬组名称 | 必填 |
| description | TEXT | 描述 | 可选 |

### 1.3 薪酬组项目 (SalaryGroupItem)

薪酬组项目是薪酬组和薪酬项的关联表，定义了薪酬组中包含哪些薪酬项及其计算顺序。

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| salary_group_id | INTEGER | 薪酬组ID | 外键 |
| salary_item_id | INTEGER | 薪酬项ID | 外键 |
| calculation_order | INTEGER | 计算顺序 | 排序用，决定公式计算的先后顺序 |

## 二、关联关系

### 2.1 薪酬组与薪酬项

- 一个薪酬组可以包含多个薪酬项（一对多）
- 一个薪酬项可以属于多个薪酬组（多对一）
- 薪酬组与薪酬项通过薪酬组项目表（SalaryGroupItem）建立多对多关系

### 2.2 薪酬组与员工

- 一个薪酬组可以分配给多个员工（一对多）
- 一个员工只能属于一个薪酬组（多对一）
- 员工表（Employee）中的 salary_group_id 字段引用薪酬组表（SalaryGroup）的 id 字段

### 2.3 薪酬组分配优先级

薪酬组可以分配给部门、职位或单独员工，优先级为：

1. 员工个人设置的薪酬组（最高优先级）
2. 职位设置的薪酬组（中等优先级）
3. 部门设置的薪酬组（最低优先级）

## 三、公式引用规则

### 3.1 变量引用格式

在公式类型的薪酬项中，可以使用 `${变量名}` 格式引用其他薪酬项，例如：

```
${基本工资} * 0.2 + ${岗位津贴}
```

### 3.2 计算顺序规则

1. 公式类型的薪酬项只能引用计算顺序在其之前的薪酬项
2. 计算顺序由薪酬组项目表（SalaryGroupItem）中的 calculation_order 字段决定
3. 系统会在保存薪酬组时验证公式引用的合法性，防止循环引用

### 3.3 公式计算示例

假设有以下薪酬项：

| ID | 名称 | 类型 | 值/公式 | 计算顺序 |
| -- | ---- | ---- | ------- | -------- |
| 1 | 基本工资 | fixed | 5000 | 1 |
| 2 | 岗位津贴 | fixed | 1000 | 2 |
| 3 | 绩效工资 | percentage | 20 | 3 |
| 4 | 综合工资 | formula | ${基本工资} + ${岗位津贴} + ${基本工资} * ${绩效工资} / 100 | 4 |

计算过程：

1. 基本工资 = 5000
2. 岗位津贴 = 1000
3. 绩效工资 = 20%
4. 综合工资 = 5000 + 1000 + 5000 * 20 / 100 = 7000

## 四、开发注意事项

### 4.1 公式验证

在保存薪酬组时，需要验证以下内容：

1. 公式中引用的变量是否存在于薪酬组中
2. 引用的变量是否在计算顺序上位于当前项之前
3. 公式语法是否正确

### 4.2 公式解析与计算

公式计算过程：

1. 解析公式中的变量引用，替换为实际值
2. 使用安全的方式计算公式结果（避免使用 eval）
3. 按照计算顺序依次计算各个薪酬项

### 4.3 UI交互

1. 在薪酬组编辑界面，应提供薪酬项拖拽排序功能，方便调整计算顺序
2. 公式编辑器应提供变量提示和语法高亮功能
3. 应显示公式验证结果，提示用户修正错误

## 五、示例代码

### 5.1 公式解析示例

```typescript
// 解析公式中的变量引用
function parseFormula(formula: string, variables: Record<string, number>): string {
  return formula.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
    if (variables[variableName] !== undefined) {
      return variables[variableName].toString();
    }
    return '0'; // 默认值
  });
}

// 安全计算公式
function calculateFormula(formula: string, variables: Record<string, number>): number {
  try {
    const parsedFormula = parseFormula(formula, variables);
    // 使用 Function 构造函数安全地计算公式
    const result = new Function(`return ${parsedFormula}`)();
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('公式计算错误:', error);
    return 0;
  }
}
```

### 5.2 公式验证示例

```typescript
// 验证薪酬组公式
async function validateSalaryGroupFormulas(salaryGroup: SalaryGroup): Promise<{isValid: boolean; errors: string[]}> {
  const errors: string[] = [];
  
  // 获取薪酬组中的所有薪酬项
  const salaryItems: Record<number, SalaryItem> = {};
  // ... 获取薪酬项数据 ...
  
  // 检查计算顺序
  const calculationOrder = new Map<number, number>();
  for (const item of salaryGroup.items) {
    calculationOrder.set(item.salaryItemId, item.calculationOrder);
  }
  
  // 检查公式类型的薪酬项
  for (const item of salaryGroup.items) {
    const salaryItem = salaryItems[item.salaryItemId];
    if (!salaryItem) continue;
    
    if (salaryItem.type === 'formula') {
      // 解析公式中的变量引用
      const formula = String(salaryItem.value);
      const variablePattern = /\$\{([^}]+)\}/g;
      let match;
      
      while ((match = variablePattern.exec(formula)) !== null) {
        const variableName = match[1];
        
        // 查找变量对应的薪酬项
        let found = false;
        let referencedItemId = -1;
        
        for (const [id, item] of Object.entries(salaryItems)) {
          if (item.name === variableName) {
            found = true;
            referencedItemId = Number(id);
            break;
          }
        }
        
        if (!found) {
          errors.push(`薪酬项 "${salaryItem.name}" 的公式引用了不存在的变量: ${variableName}`);
          continue;
        }
        
        // 检查引用的薪酬项是否在当前项之前计算
        const currentOrder = calculationOrder.get(item.salaryItemId) || 0;
        const referencedOrder = calculationOrder.get(referencedItemId) || 0;
        
        if (referencedOrder >= currentOrder) {
          errors.push(`薪酬项 "${salaryItem.name}" 引用了计算顺序在其后的薪酬项 "${variableName}"，可能导致计算错误`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```