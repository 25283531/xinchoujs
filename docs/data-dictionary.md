# 薪酬管理系统数据字典

## 一、数据库表结构

### 1. 员工表 (Employee)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| employee_no | VARCHAR | 员工编号 | 唯一 |
| name | VARCHAR | 姓名 | 必填 |
| department | VARCHAR | 部门 | 必填 |
| position | VARCHAR | 职位 | 必填 |
| entry_date | DATE | 入职日期 | 必填 |
| status | INTEGER | 状态 | 1-在职, 0-离职 |
| social_insurance_group_id | INTEGER | 社保组ID | 外键 |
| salary_group_id | INTEGER | 薪酬组ID | 外键 |
| created_at | DATETIME | 创建时间 | 自动生成 |
| updated_at | DATETIME | 更新时间 | 自动更新 |

### 2. 自定义字段表 (CustomField)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| field_name | VARCHAR | 字段名称 | 必填 |
| field_type | VARCHAR | 字段类型 | text, number, date, select |
| field_options | TEXT | 选项值 | JSON格式，用于select类型 |
| is_required | BOOLEAN | 是否必填 | 默认false |
| display_order | INTEGER | 显示顺序 | 排序用 |

### 3. 员工自定义字段值表 (EmployeeCustomFieldValue)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| employee_id | INTEGER | 员工ID | 外键 |
| custom_field_id | INTEGER | 自定义字段ID | 外键 |
| field_value | TEXT | 字段值 | 根据字段类型存储 |

### 4. 社保组表 (SocialInsuranceGroup)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 社保组名称 | 必填 |
| pension_personal | DECIMAL | 养老个人比例 | 百分比 |
| pension_company | DECIMAL | 养老公司比例 | 百分比 |
| medical_personal | DECIMAL | 医疗个人比例 | 百分比 |
| medical_company | DECIMAL | 医疗公司比例 | 百分比 |
| unemployment_personal | DECIMAL | 失业个人比例 | 百分比 |
| unemployment_company | DECIMAL | 失业公司比例 | 百分比 |
| injury_company | DECIMAL | 工伤公司比例 | 百分比 |
| maternity_company | DECIMAL | 生育公司比例 | 百分比 |
| housing_personal | DECIMAL | 公积金个人比例 | 百分比 |
| housing_company | DECIMAL | 公积金公司比例 | 百分比 |

### 5. 个税设置表 (TaxSetting)

该表存储个税计算相关的设置，包括不同的税率方案和计算公式。

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 设置名称 | 必填，用于区分不同的税率方案（如：2023年税率） |
| is_default | BOOLEAN | 是否默认 | 默认false，标记当前使用的税率方案 |
| formula | TEXT | 计算公式 | JSON格式，存储税率分级、税率、速算扣除数等信息 |



### 6. 薪酬项表 (SalaryItem)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 薪酬项名称 | 必填 |
| type | VARCHAR | 类型 | fixed, percentage, formula |
| value | TEXT | 值或公式 | 根据类型存储 |
| subsidy_cycle | INTEGER | 补贴周期 | 默认1（每月），可设置为多月一次 |
| is_preset | BOOLEAN | 是否预置 | 默认false，预置项不可删除 |
| description | TEXT | 描述 | 可选 |

### 7. 薪酬组表 (SalaryGroup)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 薪酬组名称 | 必填 |
| description | TEXT | 描述 | 可选 |

### 8. 薪酬组项目表 (SalaryGroupItem)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| salary_group_id | INTEGER | 薪酬组ID | 外键 |
| salary_item_id | INTEGER | 薪酬项ID | 外键 |
| calculation_order | INTEGER | 计算顺序 | 排序用 |

### 9. 考勤异常设置表 (AttendanceExceptionSetting)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| name | VARCHAR | 异常名称 | 如迟到、早退 |
| deduction_type | VARCHAR | 扣款类型 | fixed, daily_wage |
| deduction_rules | TEXT | 扣款规则 | JSON格式，多段式规则 |

### 10. 考勤记录表 (AttendanceRecord)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| employee_id | INTEGER | 员工ID | 外键 |
| record_date | DATE | 记录日期 | 必填 |
| exception_type_id | INTEGER | 异常类型ID | 外键 |
| exception_count | INTEGER | 异常次数 | 默认1 |
| remark | TEXT | 备注 | 可选 |

### 11. 奖惩记录表 (RewardPunishmentRecord)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| employee_id | INTEGER | 员工ID | 外键 |
| record_date | DATE | 记录日期 | 必填 |
| type | VARCHAR | 类型 | reward, punishment |
| amount | DECIMAL | 金额 | 正数为奖励，负数为惩罚 |
| reason | TEXT | 原因 | 必填 |

### 12. 工资记录表 (PayrollRecord)

| 字段名 | 类型 | 描述 | 备注 |
| ----- | ---- | ---- | ---- |
| id | INTEGER | 主键 | 自增 |
| employee_id | INTEGER | 员工ID | 外键 |
| year_month | VARCHAR | 年月 | 格式：YYYY-MM |
| base_salary | DECIMAL | 基本工资 | 必填 |
| total_salary | DECIMAL | 总工资 | 计算得出 |
| social_insurance | DECIMAL | 社保扣除 | 计算得出 |
| tax | DECIMAL | 个税扣除 | 计算得出 |
| attendance_deduction | DECIMAL | 考勤扣款 | 计算得出 |
| reward_punishment | DECIMAL | 奖惩金额 | 计算得出 |
| net_salary | DECIMAL | 实发工资 | 计算得出 |
| details | TEXT | 详细计算项 | JSON格式，包含各项收入、扣除、个税、社保等明细 |
| status | VARCHAR | 状态 | calculated, pending |
| created_at | DATETIME | 创建时间 | 自动生成 |
| updated_at | DATETIME | 更新时间 | 自动更新 |

## 四、个税计算业务规则

1.  **计算基础**：个税计算通常基于“税前工资”减去各项允许扣除项（如社保、公积金、专项附加扣除、起征点）后的“应纳税所得额”。
2.  **税率应用**：根据应纳税所得额，对照当前生效的个税税率表（分级累进税率）计算税款。
3.  **速算扣除数**：应用速算扣除数简化计算。
4.  **专项附加扣除**：系统需支持录入和管理员工的专项附加扣除信息（如子女教育、继续教育、大病医疗、住房贷款利息、住房租金、赡养老人），并在计算个税时予以扣除。
5.  **税率表管理**：系统应允许配置和更新不同年度或地区的个税税率表。

## 二、核心数据关系

1. 员工与社保组：多对一关系，一个社保组可以分配给多个员工
2. 员工与薪酬组：多对一关系，一个薪酬组可以分配给多个员工
3. 员工与自定义字段：多对多关系，通过员工自定义字段值表关联
4. 薪酬组与薪酬项：多对多关系，通过薪酬组项目表关联
5. 员工与考勤记录：一对多关系，一个员工可以有多条考勤记录
6. 员工与奖惩记录：一对多关系，一个员工可以有多条奖惩记录
7. 员工与工资记录：一对多关系，一个员工可以有多条工资记录（按月）

## 三、数据流向

1. 员工数据导入 → 员工表 + 自定义字段值表
2. 考勤数据导入 → 考勤记录表
3. 奖惩数据导入 → 奖惩记录表
4. 工资计算：员工表 + 社保组表 + 个税设置表 + 薪酬组表 + 薪酬项表 + 考勤记录表 + 奖惩记录表 → 工资记录表
5. 报表导出：工资记录表 → Excel/PDF报表
6. 数据看板：工资记录表 → 可视化图表