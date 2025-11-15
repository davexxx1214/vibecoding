# VibeCoding - VS Code 知识图谱插件

> 将你的代码库转化为智能知识网络，让 AI 编程更高效

一个基于知识图谱和 SQLite 的 VS Code 插件，帮助开发者理解和管理代码库中的复杂关系，同时为 AI 编程提供持久化的项目上下文。

## 📋 目录

- [核心理念](#核心理念)
- [当前状态](#当前状态)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
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

**项目已完成所有核心功能！** 🎉

VibeCoding 是一个功能完整的 VS Code 知识图谱插件，包含三大核心模块：

### 1️⃣ 知识图谱管理
- ✅ 实体、关系、观察记录的完整 CRUD
- ✅ SQLite 本地持久化存储
- ✅ 交互式可视化图谱（vis-network）
- ✅ 完整的 VS Code UI 集成

### 2️⃣ AI 协同功能
- ✅ Cursor 和 GitHub Copilot 深度集成
- ✅ 知识图谱导出（Markdown / JSON）
- ✅ 依赖链分析和循环依赖检测
- ✅ 技术栈自动检测（JS/TS 项目）
- ✅ 快速上下文导出

### 3️⃣ 持久知识库（RAG）
- ✅ Google Gemini File Search 云端托管
- ✅ 自动索引文档到云端（增量）
- ✅ 智能问答（Ask Question）
- ✅ 多格式支持（100+ 种格式）
- ✅ 项目完全隔离

**代码量**：约 5000+ 行 TypeScript

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

## ✨ 核心功能

### 🗂️ 知识图谱管理

#### 基础图谱功能
- ✅ **实体管理**：手动创建和管理代码实体（Function、Class、Interface、Variable 等）
- ✅ **关系管理**：建立实体间的关系（uses、calls、extends、implements、depends_on）
- ✅ **观察记录**：为实体添加笔记、警告、TODO、设计决策等观察记录
- ✅ **模糊搜索**：快速搜索实体和观察记录
- ✅ **数据持久化**：基于 SQLite 的本地数据库存储

#### UI 集成
- ✅ **侧边栏树视图**：按类型分组显示所有实体和关系
- ✅ **悬浮提示**：鼠标悬停显示实体信息、观察记录、关系网络
- ✅ **CodeLens**：代码上方显示实体统计信息
- ✅ **右键菜单**：快速创建实体、添加观察、建立关系
- ✅ **命令面板**：完整的命令集合，快速访问所有功能

#### 可视化
- ✅ **交互式图谱**：基于 vis-network 的图形化展示
- ✅ **自动布局**：节点自动排列，避免重叠
- ✅ **多重边分离**：同方向的多条关系自动以不同弧线显示
- ✅ **循环依赖检测**：自动识别并标记循环依赖
- ✅ **双击跳转**：双击节点直接跳转到代码位置
- ✅ **拖拽交互**：支持节点拖拽、缩放、平移

---

### 🤖 AI 协同功能

#### 知识图谱导出
- ✅ **Markdown 导出**：生成适合 AI 阅读的格式化文档
- ✅ **JSON 导出**：结构化数据导出
- ✅ **依赖链分析**：递归构建依赖树，检测循环依赖，统计传递依赖
- ✅ **按类型分组**：实体、关系、观察记录分类展示

#### AI 工具集成
- ✅ **Cursor 集成**：自动生成 `.cursorrules` 配置文件
- ✅ **GitHub Copilot 集成**：自动生成 `.github/copilot-instructions.md`
- ✅ **技术栈检测**：自动从 `package.json` 提取依赖信息（支持 JS/TS 项目）
- ✅ **一键生成**：同时生成所有 AI 配置文件
- ✅ **智能分类**：自动分类警告、TODO、已知问题

#### 快速上下文导出
- ✅ **实体上下文**：复制单个实体的完整上下文到剪贴板
- ✅ **文件上下文**：导出当前文件的所有实体和关系
- ✅ **AI 摘要**：生成项目整体摘要，供 AI 理解

---

### ☁️ 持久知识库（RAG）

#### 云端 RAG 系统
- ✅ **Google Gemini File Search**：使用 Gemini 托管的向量搜索服务
- ✅ **自动索引**：监听 `Knowledge/` 文件夹，新增文档自动上传到云端
- ✅ **增量索引**：已索引文档不会重复上传，启动速度快
- ✅ **多格式支持**：原生支持 PDF、TXT、MD、DOCX、JSON、代码等 100+ 种格式
- ✅ **语义搜索**：Gemini 自动分块、嵌入和检索

#### 智能问答
- ✅ **Ask Question**：基于文档内容的智能问答
- ✅ **来源追溯**：显示答案的来源文档（Grounding Metadata）
- ✅ **Markdown 展示**：问答结果以格式化 Markdown 文档展示
- ✅ **可复制保存**：支持复制内容或保存为文件

#### 项目管理
- ✅ **项目隔离**：每个项目独立的 File Search Store，多项目完全隔离
- ✅ **API Key 配置**：通过 VS Code 设置管理 Gemini API Key
- ✅ **自动重连**：API Key 更新后自动重新初始化
- ✅ **Store 信息查看**：实时查看云端和本地的文档统计
- ✅ **索引重建**：Rebuild RAG Index 命令，完全同步本地和云端

#### 侧边栏管理
- ✅ **Documents (RAG) 视图**：显示已索引的文档列表
- ✅ **快捷操作**：问号图标（Ask Question）、信息图标（查看 Store 信息）、刷新图标（重建索引）
- ✅ **连接测试**：测试 Gemini API 连接状态

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
