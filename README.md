# VibeCoding - VS Code 知识图谱插件

> 将你的代码库转化为智能知识网络，让 AI 编程更高效

一个基于知识图谱和 SQLite 的 VS Code 插件，帮助开发者理解和管理代码库中的复杂关系，同时为 AI 编程提供持久化的项目上下文。

## 📋 目录

- [核心理念](#核心理念)
- [当前状态](#当前状态)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [三阶段路线图](#三阶段路线图)
- [技术架构](#技术架构)
- [开发指南](#开发指南)
- [演示文档](#演示文档)

---

## 🎯 核心理念

VibeCoding 将 VS Code 工作区本身变成一个**智能知识图谱**，通过三个核心概念构建项目知识：

### 1. 实体 (Entities)
代码库中的各种元素，具有精确的代码位置：
- 代码元素：Function、Class、Interface、Variable
- 文件系统：File、Directory
- 业务概念：API、Service、Component、Database

### 2. 关系 (Relations)
实体之间的连接：
- `uses` - 使用关系
- `calls` - 调用关系
- `extends` - 继承关系
- `implements` - 实现关系
- `depends_on` - 依赖关系

### 3. 观察记录 (Observations)
关于实体的笔记和注释，这是知识图谱的核心价值：
- 性能警告和优化建议
- 设计决策说明
- Bug 记录和修复历史
- 重构待办事项
- 团队协作笔记

**核心价值**：
- 🧠 **代码理解助手** - 可视化代码关系，快速理解复杂系统
- 📝 **项目记忆系统** - 持久化保存设计决策、重构笔记、性能警告
- 🤖 **AI 编程加速器** - 深度集成 Cursor 和 GitHub Copilot，为 AI 提供项目上下文
- 👥 **团队知识共享** - 知识图谱可被 Git 追踪，团队协作更顺畅

---

## ✅ 当前状态

### 第一阶段 MVP - 已完成 ✅

根据 [STAGE1_COMPLETE.md](./STAGE1_COMPLETE.md)，已完成基础知识图谱管理工具：

**核心服务层**：
- ✅ SQLite 数据库服务（基于 sql.js）
- ✅ 实体管理服务（CRUD、查询、过滤）
- ✅ 关系管理服务（创建、查询、验证）
- ✅ 观察记录服务（添加、模糊搜索）

**VS Code UI 集成**：
- ✅ 侧边栏树视图（按类型分组显示实体）
- ✅ 悬浮提示（显示实体信息、观察记录、关系）
- ✅ CodeLens（代码上方显示统计信息）
- ✅ 右键菜单（创建实体、添加观察记录）
- ✅ 命令面板（搜索、查看详情、跳转）

**基础功能**：
- ✅ 手动创建实体
- ✅ 添加观察记录
- ✅ 查看实体详情
- ✅ 模糊搜索功能
- ✅ 点击跳转到代码

**代码量**：约 2500+ 行 TypeScript

**额外功能**（超出计划）：
- ✅ 图谱可视化（vis-network）
- ✅ 完整的删除功能（实体/关系/观察记录）

---

## 🚀 快速开始

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/vibecoding.git
cd vibecoding

# 2. 安装依赖
npm install

# 3. 编译
npm run compile

# 4. 在 VS Code 中按 F5 启动调试
```

### 基本使用

#### 知识图谱功能
1. **创建实体**：选中代码 → 右键 → "Knowledge: Create Entity from Selection"
2. **添加观察记录**：鼠标悬停在实体上 → 点击"Add Observation"
3. **查看知识图谱**：点击侧边栏的"Knowledge Graph"图标
4. **搜索**：命令面板 → "Knowledge: Search Graph"

#### RAG 知识库功能 🆕
1. **配置 API Key**：设置 → 搜索 "Gemini API Key" → 填入你的密钥
2. **添加文档**：在项目根目录创建 `Knowledge/` 文件夹，添加文档（支持 PDF、MD、TXT 等）
3. **自动索引**：文档自动上传到 Gemini，无需手动操作
4. **智能问答**：侧边栏 → Documents (RAG) → 点击问号图标 → 输入问题
5. **查看 Store 信息**：侧边栏 → Documents (RAG) → 点击信息图标
6. **重建索引**：侧边栏 → Documents (RAG) → 点击刷新图标（删除云端索引并重新上传）

---

## 📁 项目结构

```
vibecoding/
├── src/
│   ├── extension.ts                  # ✅ 插件入口
│   ├── services/                     # ✅ 核心服务层
│   │   ├── database.ts               # 数据库服务
│   │   ├── entityService.ts          # 实体管理
│   │   ├── relationService.ts        # 关系管理
│   │   └── observationService.ts     # 观察记录管理
│   ├── providers/                    # ✅ VS Code UI 提供者
│   │   ├── hoverProvider.ts          # 悬浮提示
│   │   ├── codeLensProvider.ts       # CodeLens
│   │   └── treeDataProvider.ts       # 树视图
│   ├── ui/                          # ✅ 命令处理器
│   │   └── commands/
│   │       └── entityCommands.ts
│   └── utils/                       # ✅ 工具函数
│       └── types.ts                 # 类型定义
├── package.json                      # 插件配置
├── tsconfig.json                     # TypeScript 配置
├── README.md                         # 项目说明（本文件）
├── Demo.md                           # 演示指南
└── STAGE1_COMPLETE.md                # 阶段一完成总结

图例：
  ✅ 已实现
  🔜 计划中
```

### 数据存储

```
项目根目录/
├── .vscode/
│   └── .knowledge/
│       └── graph.sqlite              # 知识图谱数据库（包含 RAG 索引）
└── Knowledge/                        # ✅ RAG 文档知识库
    ├── architecture.md               # 架构文档
    ├── api-guide.md                  # API 指南
    └── decisions/                    # 设计决策
        └── adr-001.md
```

**RAG Store 隔离机制**：
- 每个项目自动生成唯一的 Store ID（基于项目路径 hash）
- 多个项目可以使用同一个 Gemini API Key
- 文档索引完全隔离，不会混淆
- Store 信息存储在本地 SQLite 数据库

---

## 🗺️ 三阶段路线图

### 第一阶段：MVP - 基础知识图谱 ✅ **已完成**

**目标**：可用的手动知识图谱管理工具

**核心功能**：
- ✅ SQLite 数据库（实体、关系、观察记录）
- ✅ 基础 CRUD 操作
- ✅ VS Code UI 集成（侧边栏、悬浮、CodeLens、菜单）
- ✅ 手动创建实体和关系
- ✅ 模糊搜索（LIKE 查询）

**验收标准**：
- ✅ 开发者可以手动标记代码实体
- ✅ 可以通过 UI 浏览和搜索
- ✅ 悬浮提示能显示观察记录

**时间**：已完成（约 2500+ 行代码）

---

### 第二阶段：AI 协同增强 🔥 **进行中**

**目标**：让知识图谱和文档成为 AI 编程的"外部记忆"，深度集成主流 AI 编程工具

**核心功能**：

#### 2.1 知识图谱导出 ✅
- ✅ Markdown 格式导出（适合 AI 阅读）
- ✅ JSON 格式导出（结构化数据）
- ✅ 按类型分组显示
- ✅ 完整的实体、关系、观察记录
- ✅ 依赖链分析（完整依赖树）
  - 递归构建依赖树
  - 检测循环依赖
  - 全局依赖统计
  - 传递依赖查找

#### 2.2 AI 编程工具深度集成 🔥
- ✅ Cursor 集成
  - ✅ 自动生成 `.cursorrules`
  - ✅ 自动检测并包含技术栈信息（JS/TS 项目）
  - 包含项目概览、关键组件、观察记录
  - 智能分类警告、TODO、已知问题
- ✅ GitHub Copilot 集成
  - ✅ 自动生成 `.github/copilot-instructions.md`
  - ✅ 自动检测并包含技术栈信息（JS/TS 项目）
  - 英文格式，符合 Copilot 规范
  - 架构概览和编码指南
- ✅ 技术栈自动检测（Phase 1）
  - ✅ 从 `package.json` 提取依赖信息
  - ✅ 识别框架、数据库、测试工具等
  - ✅ 版本号自动提取和格式化
  - 📝 当前仅支持 JavaScript/TypeScript 项目
- ✅ 一键生成所有 AI 配置
- ✅ 快速上下文导出（Phase 2）
  - ✅ 复制实体上下文到剪贴板
  - ✅ 导出当前文件上下文
  - ✅ 生成 AI 摘要
- [ ] 项目知识库文档生成（Phase 3）
  - Knowledge/ 文件夹自动生成
  - 架构文档、组件文档
  - ADR（架构决策记录）

#### 2.3 需求文档自动转换 🆕
- [ ] 支持 PDF、Word、Excel 转 Markdown
- [ ] 使用 MarkItDown（优先）或 Node.js 库
- [ ] 自动监听 `specs/` 文件夹变更
- [ ] 增量转换和格式优化

#### 2.4 持久知识库（托管式 RAG）🆕 ✅ **已完成**
- ✅ 使用 **Google Gemini File Search Store API**（`@google/genai` SDK）
- ✅ 监听 `Knowledge/` 文件夹，新增文档自动上传到云端（增量索引）
- ✅ **真正的语义搜索**：Gemini 自动分块、嵌入和检索
- ✅ **统一智能问答**：基于 Gemini File Search 工具的 RAG 问答（Ask Question）
- ✅ 侧边栏文档管理（Documents RAG 视图）
- ✅ API Key 配置管理（VS Code 设置 + 自动重连）
- ✅ **项目隔离**：每个项目独立的 File Search Store，多项目文档完全隔离
- ✅ **结果展示优化**：Markdown 文档展示，包含 AI 答案和来源引用（Grounding）
- ✅ **多格式支持**：Gemini 原生支持 PDF、TXT、MD、DOCX、JSON、代码等 100+ 种格式
- ✅ **增量索引**：已索引文档不会重复上传，启动速度快
- ✅ **索引重建**：Rebuild RAG Index 命令，完全同步本地和云端

**验收标准**：
- ✅ 可以一键导出知识图谱供 AI 使用
- ✅ Cursor 和 GitHub Copilot 能自动获取项目上下文
- ✅ 自动生成 AI 配置文件（.cursorrules, copilot-instructions.md）
- ✅ AI 能基于导出的上下文理解项目
- ✅ Knowledge 文件夹的文档自动索引到云端
- ✅ 智能问答功能完整可用（Ask Question）
- ✅ 多项目使用同一 API Key 时文档完全隔离
- ✅ 问答结果以 Markdown 文档展示，包含来源引用
- ✅ 已索引文档不会重复上传（增量索引）
- ✅ 支持 Rebuild RAG Index 完全同步本地和云端

**时间**：已完成（约 3 周）

---

### 第三阶段：智能增强 🚀 **规划中**

**目标**：从手动维护到自动化

**核心功能**：

#### 3.1 代码自动解析
- [ ] TypeScript/JavaScript 自动解析
- [ ] 自动识别函数、类、接口、变量
- [ ] 自动建立调用关系、继承关系
- [ ] 增量更新机制

#### 3.2 智能建议系统
- [ ] 缺失实体提醒
- [ ] 关系补全建议
- [ ] 观察记录推荐

#### 3.3 全自动扫描
- [ ] 初次扫描整个项目
- [ ] 定期扫描新增代码
- [ ] 支持白名单/黑名单配置

**验收标准**：
- [ ] 打开项目后自动扫描生成基础图谱
- [ ] 代码修改后自动更新相关实体
- [ ] 智能建议帮助补全知识图谱

**时间估计**：3-4 周

---

## 🏗️ 技术架构

### 技术栈

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| **插件框架** | VS Code Extension API | 官方插件开发框架 |
| **语言** | TypeScript | 类型安全，开发体验好 |
| **数据库** | sql.js | WebAssembly SQLite，跨平台兼容 |
| **搜索** | LIKE 模糊查询 | 简单高效，适合中小型项目 |
| **可视化** | vis-network | 交互式图谱可视化 |
| **文档转换** | MarkItDown (Python CLI) | 阶段二，支持多种格式 |
| **RAG 系统** | Google Gemini File Search API | 阶段二，托管式 RAG |
| **代码解析** | TypeScript Compiler API | 阶段三使用 |

### 核心数据流

```
用户操作
  ↓
VS Code UI (TreeView / Hover / CodeLens / Menu)
  ↓
Commands (entityCommands.ts)
  ↓
Services (entityService / relationService / observationService)
  ↓
Database (database.ts → SQLite)
  ↓
存储在 .vscode/.knowledge/graph.sqlite
```

### 数据库 Schema

```sql
-- 实体表
CREATE TABLE entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 关系表
CREATE TABLE relations (
    id TEXT PRIMARY KEY,
    source_entity_id TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    verb TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 观察记录表
CREATE TABLE observations (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 索引优化
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_file_path ON entities(file_path);
CREATE INDEX idx_entities_name ON entities(name);
```

---

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.x
- VS Code >= 1.80.0
- TypeScript >= 4.9.0

### 开发命令

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式（开发时使用）
npm run watch

# 运行测试
npm test

# 打包插件
npm run package

# 代码检查
npm run lint
```

### 调试

1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试
3. 会打开一个新的 VS Code 窗口（Extension Development Host）
4. 在新窗口中测试插件功能

### 代码规范

- 使用 TypeScript strict 模式
- 使用 async/await 而非 callback
- 错误处理使用 try/catch
- 命名规范：
  - 文件名：camelCase.ts
  - 类名：PascalCase
  - 函数/变量：camelCase
  - 常量：UPPER_SNAKE_CASE

---

## 📖 演示文档

详细的演示指南和使用场景，请查看：

- **[Demo.md](./Demo.md)** - 完整演示指南
  - 基于 NestJS RealWorld Example App 的演示
  - 包含 5 个实际使用场景
  - 从基础功能到 AI 协同的完整演示脚本
  - 持久知识库和需求文档转换演示

---

## 📚 参考资料

### 官方文档
- [VS Code Extension API](https://code.visualstudio.com/api)
- [sql.js 文档](https://sql.js.org/)
- [vis-network 文档](https://visjs.github.io/vis-network/)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)

### 相关项目
- [memory-mcp-server-go](https://github.com/okooo5km/memory-mcp-server-go) - 知识图谱 MCP 服务器
- [MarkItDown](https://github.com/microsoft/markitdown) - Microsoft 文档转换工具

