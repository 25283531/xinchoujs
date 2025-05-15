# 薪酬管理系统

> 本地化薪酬管理工具，支持社保、个税、薪酬项、考勤、奖惩管理，一键计算与报表导出。

## 功能概览

- **自定义字段与模板**：动态生成员工导入模板，自由映射字段。
- **社保 & 个税**：社保组管理含公司/个人比例，预置常见地区个税公式并支持自定义。
- **薪酬项与薪酬组**：固定、百分比、公式三种类型，支持跨项引用。
- **考勤异常扣款**：多段式规则、按天/小时扣款、自动标记待重新计算。
- **一键计算 & 导出**：Excel & PDF 导出（按部门/个人/总表），自定义模板。
- **看板展示**：当月人力成本与环比变动。
- **部署易用**：EXE/MSI 一键安装，自动更新，SQLite 本地存储，备份与恢复。

## 环境要求

- Windows 10 及以上
- .NET 6.0 Runtime / Node.js 16+ (Electron)
- 最低 4GB 内存，100MB 可用磁盘空间

## 安装与运行

1. 下载最新安装包 [Release 页面]
2. 双击执行安装程序，按提示完成安装
3. 启动桌面快捷方式，进入主界面

## 自动更新

- 软件会在启动时检查更新，并提示一键下载与安装。

## 备份与恢复

- 数据库文件位于 `%USERPROFILE%\AppData\Local\HRPayroll\data.db`。
- 在「设置」→「备份恢复」中，一键导出或导入数据库文件。

## 配置与模板

- 导入模板保存在安装目录 `config/templates/`。
- 支持自定义模板文件，可通过「设置」→「模板管理」界面上传。

## 技术架构

详见 `docs/technical-spec.md`。核心模块：

- `src/services/payrollService.ts`：工资计算逻辑
- `src/services/importService.ts`：数据导入
- `src/services/exportService.ts`：报表导出

## 项目结构

```
hr/
├── src/
│   ├── ui/                         # 界面层（WPF/XAML 或 Electron + React）
│   │   ├── components/             # 公共组件
│   │   ├── views/                  # 页面视图
│   │   ├── styles/                 # 样式 (vflat)
│   │   └── assets/                 # 静态资源
│   ├── services/                   # 业务服务 (工资计算、导入/导出)
│   │   ├── payrollService.ts       # 工资计算核心逻辑
│   │   ├── importService.ts        # 导入员工/考勤/奖惩
│   │   ├── exportService.ts        # 导出报表
│   │   ├── socialInsuranceService.ts  # 社保组管理
│   │   └── taxService.ts           # 个税速算管理
│   ├── store/                      # 全局状态管理 (Redux/MobX 或 MVVM 模式)
│   ├── db/                         # SQLite 数据访问 (ORM 或 原生)
│   ├── utils/                      # 通用工具函数
│   └── main.ts                     # 应用入口
├── build/                          # 构建与打包配置 (Electron 打包或 MSI 脚本)
├── scripts/                        # 自动更新与安装脚本
├── config/                         # 默认配置与模板 (导入模板 Excel)
├── docs/                           # 文档目录
│   ├── user-manual.md             # 用户手册
│   ├── technical-spec.md          # 技术规格说明
│   └── data-dictionary.md         # 数据字典
├── backup/                         # 默认备份目录 (本地数据库备份)
├── logs/                           # 日志输出
├── tests/                          # 单元测试与集成测试
├── .gitignore
├── package.json / project.sln      # 项目配置
├── README.md                       # 项目说明
└── LICENSE
```

## 贡献指南

- Fork 本仓库后，提交 PR 至 `develop` 分支。
- 编写单元测试并确保通过。
- 代码风格遵循项目 ESLint/StyleCop 规范。

## 许可证

MIT © 薪酬管理系统