# 更新日志

本文档记录 Knowledge Graph VS Code 插件的所有重要变更。

## [0.1.0] - 2025-11-04

### 🎉 初始版本 - 阶段一完成

#### ✨ 新增功能

**核心功能**
- ✅ 实体管理系统
  - 创建、更新、删除实体
  - 支持多种实体类型（function, class, interface, variable, etc.）
  - 代码位置追踪
  - 元数据支持

- ✅ 观察记录系统
  - 为实体添加笔记和注释
  - 支持多条观察记录
  - 全文搜索支持

- ✅ 关系管理系统
  - 创建实体间关系（uses, calls, extends, etc.）
  - 查询出边和入边关系
  - 关联实体查询

**用户界面**
- ✅ 侧边栏树视图
  - 按类型分组显示实体
  - 显示实体统计
  - 点击跳转到代码位置
  - 支持搜索和过滤

- ✅ 悬浮提示（Hover）
  - 显示实体基本信息
  - 显示所有观察记录
  - 显示关系信息
  - Markdown 格式化

- ✅ CodeLens
  - 代码上方显示统计信息
  - 可点击查看详情

- ✅ 右键菜单
  - 编辑器：创建实体、添加观察、查看详情
  - 文件浏览器：创建文件/文件夹实体

- ✅ 命令面板
  - Knowledge: Create Entity from Selection
  - Knowledge: Add Observation to Entity
  - Knowledge: View Entity Details
  - Knowledge: Search Graph
  - Knowledge: Jump to Entity
  - 以及更多命令（部分占位）

**数据存储**
- ✅ SQLite 本地数据库
  - 存储在 `.vscode/.knowledge/graph.sqlite`
  - 支持版本控制（可选）
  - 外键约束和级联删除
  - 自动创建表结构

- ✅ FTS5 全文搜索
  - 实体名称和描述搜索
  - 观察记录内容搜索
  - 高性能索引

**开发工具**
- ✅ TypeScript 支持
  - 完整的类型定义
  - 严格模式编译
  - 源码映射

- ✅ 构建工具
  - esbuild 快速打包
  - 开发和生产模式
  - 监听模式支持

- ✅ 调试配置
  - VS Code 调试配置
  - 任务配置
  - ESLint 规则

#### 📦 依赖

- `better-sqlite3`: ^9.2.2
- `@types/vscode`: ^1.80.0
- `typescript`: ^5.2.0
- `esbuild`: ^0.19.0

#### 📁 项目结构

```
src/
├── extension.ts              # 插件入口
├── services/                 # 核心服务层
│   ├── database.ts          # 数据库服务
│   ├── entityService.ts     # 实体管理
│   ├── relationService.ts   # 关系管理
│   └── observationService.ts # 观察记录管理
├── providers/               # VS Code 提供者
│   ├── hoverProvider.ts    # 悬浮提示
│   ├── codeLensProvider.ts # CodeLens
│   └── treeDataProvider.ts # 树视图
├── ui/                     # 用户界面
│   ├── commands/           # 命令处理器
│   └── webview/            # Webview（占位）
└── utils/                  # 工具函数
    ├── types.ts            # 类型定义
    └── codeParser.ts       # 代码解析
```

#### 📝 文档

- ✅ README.md - 完整项目规划
- ✅ INSTALL.md - 安装指南
- ✅ QUICKSTART.md - 快速入门
- ✅ STAGE1_COMPLETE.md - 阶段一总结
- ✅ 如何开始.md - 使用指南
- ✅ CHANGELOG.md - 更新日志

#### 🎯 性能

- ⚡ 同步数据库操作（better-sqlite3）
- ⚡ 索引优化查询
- ⚡ 事务支持批量操作
- ⚡ FTS5 全文搜索

#### 🐛 已知限制

- ⚠️ 关系创建需要手动实现（阶段四）
- ⚠️ 图谱可视化未实现（阶段五）
- ⚠️ 代码自动解析未实现（阶段六）
- ⚠️ 导出/导入功能未实现
- ⚠️ 单元测试未编写

#### 📊 统计

- 总代码行数: ~2000+
- 源文件数: 13
- 配置文件数: 7
- Linter 错误: 0

---

## 未来计划

### [0.2.0] - 阶段二/三（可选）
- [ ] 数据库迁移系统
- [ ] 批量操作 API
- [ ] 性能优化

### [0.3.0] - 阶段四
- [ ] 关系创建界面
- [ ] 导出/导入功能
- [ ] 清空图谱功能
- [ ] 更多命令实现

### [0.4.0] - 阶段五 🌟
- [ ] React Flow 集成
- [ ] 交互式图谱可视化
- [ ] 多种视图模式
- [ ] 节点拖拽和编辑

### [0.5.0] - 阶段六
- [ ] TypeScript/JavaScript 代码解析
- [ ] 自动识别函数和类
- [ ] 自动创建依赖关系
- [ ] 文件监听自动更新

### [0.6.0] - 阶段七
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 文档完善

### [1.0.0] - 阶段八
- [ ] 打包发布
- [ ] Marketplace 上架
- [ ] 演示视频
- [ ] 用户反馈收集

---

## 版本说明

- **主版本号**: 重大功能变更或破坏性更改
- **次版本号**: 新功能添加
- **修订号**: Bug 修复和小改进

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

