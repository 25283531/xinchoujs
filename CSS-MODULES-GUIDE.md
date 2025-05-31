# CSS模块化指南

本项目已经实现了CSS模块化，以解决样式冲突和提高样式管理的可维护性。

## 什么是CSS模块？

CSS模块是一种CSS文件，其中所有的类名和动画名称默认都是局部作用域的。这意味着每个组件的样式都是隔离的，不会影响其他组件。

## 如何使用CSS模块

### 1. 创建CSS模块文件

创建以 `.module.css` 结尾的CSS文件：

```css
/* ComponentName.module.css */
.container {
  padding: 20px;
  background-color: #f0f0f0;
}

.title {
  font-size: 24px;
  color: #333;
}

.button {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
}
```

### 2. 在React组件中导入和使用

```tsx
import React from 'react';
import styles from './ComponentName.module.css';

const ComponentName: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>标题</h1>
      <button className={styles.button}>按钮</button>
    </div>
  );
};

export default ComponentName;
```

### 3. 条件类名和组合类名

```tsx
// 条件类名
<div className={`${styles.item} ${isActive ? styles.active : ''}`}>
  内容
</div>

// 多个类名组合
<div className={`${styles.container} ${styles.highlighted}`}>
  内容
</div>
```

## 项目中的实现

### 构建配置

项目使用自定义的esbuild插件来处理CSS模块：

- `build-ui.js`: 包含CSS模块处理逻辑
- 自动为每个类名添加唯一的作用域标识符
- 生成对应的JavaScript对象供组件使用

### 类型支持

项目包含TypeScript类型声明：

- `src/types/css-modules.d.ts`: 全局CSS模块类型声明
- `*.module.css.d.ts`: 特定组件的类型声明文件

## 最佳实践

### 1. 命名约定

- 使用camelCase命名类名：`.primaryButton` 而不是 `.primary-button`
- 使用语义化的类名：`.submitButton` 而不是 `.blueButton`
- 避免使用全局样式类名

### 2. 文件组织

```
src/
  ui/
    components/
      ComponentName/
        ComponentName.tsx
        ComponentName.module.css
        ComponentName.module.css.d.ts
        index.ts
```

### 3. 样式复用

对于需要复用的样式，可以创建共享的CSS模块：

```css
/* shared/common.module.css */
.primaryButton {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
}

.secondaryButton {
  background-color: white;
  color: #666;
  border: 1px solid #d9d9d9;
  padding: 10px 20px;
  border-radius: 4px;
}
```

### 4. 避免的做法

- ❌ 不要在CSS模块中使用全局选择器（除非必要）
- ❌ 不要在多个组件中重复相同的样式代码
- ❌ 不要使用内联样式替代CSS模块（除非是动态样式）

## 迁移指南

### 从传统CSS迁移到CSS模块

1. **重命名CSS文件**：将 `.css` 改为 `.module.css`
2. **更新导入语句**：
   ```tsx
   // 之前
   import './styles.css';
   
   // 之后
   import styles from './styles.module.css';
   ```
3. **更新类名引用**：
   ```tsx
   // 之前
   <div className="container">
   
   // 之后
   <div className={styles.container}>
   ```
4. **创建类型声明文件**（可选，用于更好的TypeScript支持）

## 故障排除

### 常见问题

1. **样式没有应用**
   - 检查CSS模块文件是否正确导入
   - 确认类名是否正确引用
   - 检查构建是否成功

2. **TypeScript类型错误**
   - 确保 `src/types/css-modules.d.ts` 文件存在
   - 检查 `tsconfig.json` 是否包含类型声明文件

3. **构建失败**
   - 检查 `build-ui.js` 文件是否存在
   - 确认Node.js版本兼容性

## 优势

1. **样式隔离**：避免全局样式冲突
2. **可维护性**：每个组件的样式独立管理
3. **类型安全**：TypeScript支持，编译时检查类名
4. **性能优化**：只加载需要的样式
5. **重构友好**：重命名类名时有IDE支持

## 示例项目

参考 `ImportEmployeesWizard` 组件的实现：

- `ImportEmployeesWizard.tsx`: React组件
- `ImportEmployeesWizard.module.css`: CSS模块样式
- `ImportEmployeesWizard.module.css.d.ts`: TypeScript类型声明

这个实现展示了如何将传统的CSS样式迁移到CSS模块，解决了样式冲突问题并提高了代码的可维护性。