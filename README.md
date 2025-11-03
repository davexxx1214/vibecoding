# VS Code 知识图谱插件

一个基于知识图谱和 SQLite 的 VS Code 插件，将工作区转化为智能知识网络，帮助开发者管理和理解代码库中的复杂关系。

## 📋 目录

- [项目概述](#项目概述)
- [核心设计理念](#核心设计理念)
- [功能模块设计](#功能模块设计)
- [技术选型](#技术选型)
- [实现步骤](#实现步骤)
- [用户使用场景](#用户使用场景)
- [数据库 Schema 设计](#数据库-schema-设计)

## 🎯 项目概述

### 核心目标

将 VS Code 工作区本身变成一个智能知识图谱，为开发者提供：
- **项目专属的知识网络**：扫描、索引并关联代码库中的各种实体（函数、类、文件、API端点、配置项等）
- **可视化代码关系**：通过交互式图谱展示代码之间的依赖和调用关系
- **持久化记忆**：使用 SQLite 本地存储，知识图谱随项目版本控制
- **无缝开发体验**：深度集成 VS Code，最小化工作流中断

### 核心价值

1. **为开发者自己服务**：不再是为外部 AI 提供记忆，而是帮助开发者理解和管理自己的代码库
2. **项目级知识管理**：知识图谱存储在项目目录中，可以被 Git 追踪或忽略
3. **可交互的知识网络**：支持可视化、搜索、编辑和管理

## 💡 核心设计理念

### 知识图谱的三个核心概念

1. **实体 (Entities)**：代码库中的各种元素
   - 函数、类、接口、变量
   - 文件、目录
   - API 端点、配置项
   - 数据库表、服务等

2. **关系 (Relations)**：实体之间的连接
   - `uses`：使用关系
   - `calls`：调用关系
   - `extends`：继承关系
   - `implements`：实现关系
   - `depends_on`：依赖关系
   - 自定义关系类型

3. **观察记录 (Observations)**：关于实体的笔记和注释
   - 性能警告
   - 设计决策说明
   - Bug 记录
   - 重构建议
   - 任何开发者想要记住的信息

## 🏗️ 功能模块设计

### 1. 存储层（本地化实现）

#### 数据库设计
- **位置**：项目工作区的 `.vscode/.knowledge/` 目录
- **文件**：`graph.sqlite`（SQLite 数据库文件）
- **版本控制**：可被 Git 追踪或添加到 `.gitignore`

#### 技术实现
- **库选择**：`better-sqlite3`（推荐）或 `sqlite3`
  - `better-sqlite3` 优势：性能好，支持同步操作，适合插件逻辑
- **全文搜索**：启用 SQLite 的 FTS5 扩展

#### 数据库 Schema

详见 [数据库 Schema 设计](#数据库-schema-设计) 章节。

### 2. 知识图谱核心服务（插件内部逻辑）

TypeScript/JavaScript 模块，负责所有与数据库的交互，实现核心 CRUD 操作：

#### 核心 API

```typescript
// 实体管理
createEntity(name: string, type: string, location: CodeLocation): Entity
updateEntity(entityId: string, updates: Partial<Entity>): Entity
deleteEntity(entityId: string): void
getEntity(entityId: string): Entity | null
listEntities(filters?: EntityFilters): Entity[]

// 关系管理
addRelation(sourceId: string, targetId: string, verb: string): Relation
removeRelation(relationId: string): void
getRelations(entityId: string): Relation[]
getRelatedEntities(entityId: string, relationType?: string): Entity[]

// 观察记录管理
addObservation(entityId: string, content: string): Observation
updateObservation(observationId: string, content: string): Observation
deleteObservation(observationId: string): void
getObservations(entityId: string): Observation[]

// 搜索功能
searchNodes(query: string): SearchResult[]
searchByType(type: string): Entity[]
searchByFile(filePath: string): Entity[]
```

### 3. 用户界面与交互层（VS Code Integration）

#### 3.1 侧边栏视图 (Activity Bar View)

**功能描述**：
- 创建新的 Activity Bar 图标（如 🧠 或 📊）
- 点击后展开"知识图谱"面板

**面板内容**：
- **搜索框**：全文搜索实体、关系和观察记录
- **实体列表**：树状视图或列表展示
  - 最近访问的实体
  - 收藏的实体
  - 按类型分组的实体
- **快速操作**：点击实体跳转到代码位置

**实现要点**：
- 使用 VS Code TreeDataProvider API
- 支持虚拟滚动（处理大量实体）
- 实时搜索过滤

#### 3.2 右键上下文菜单 (Context Menu)

**代码编辑器中的菜单项**：
```
Knowledge: Create Entity from Selection
  └─ 从选中的代码创建实体（自动识别类型和位置）

Knowledge: Link Selection to Entity...
  └─ 将选中代码链接到已存在的实体

Knowledge: Add Observation to Entity...
  └─ 为关联实体添加笔记

Knowledge: View Entity Details
  └─ 查看当前实体的详细信息
```

**文件浏览器中的菜单项**：
```
Knowledge: Create Entity for this File
Knowledge: Create Entity for this Folder
Knowledge: View File Relations
```

**实现要点**：
- 使用 `vscode.commands.registerCommand`
- 菜单项通过 `contributes.menus` 注册
- 智能识别选中代码的类型（函数、类、变量等）

#### 3.3 命令面板 (Command Palette)

**暴露的核心命令**：
```
Knowledge: Create new Entity
Knowledge: Search Graph
Knowledge: Visualize Relations
Knowledge: Export Graph
Knowledge: Import Graph
Knowledge: Clear Graph
Knowledge: Settings
```

**实现要点**：
- 所有命令通过 `contributes.commands` 注册
- 支持键盘快捷键绑定
- 命令参数通过 QuickPick 或 InputBox 收集

#### 3.4 悬浮提示 (Hover Provider)

**功能描述**：
当鼠标悬停在已创建为"实体"的代码上时，显示增强信息：

**显示内容**：
- **观察记录**：`"Note: Handles payment processing via Stripe."`
- **关系信息**：
  - `Used by: OrderController, PaymentService`
  - `Calls: PaymentGateway.charge, Logger.info`
  - `Extends: BaseService`
- **统计信息**：`3 observations, 2 relations`

**实现要点**：
- 使用 `vscode.languages.registerHoverProvider`
- 解析当前光标位置的代码符号
- 查询数据库获取关联信息
- Markdown 格式展示

#### 3.5 代码内联装饰/CodeLens

**功能描述**：
在已成为实体的函数或类定义上方显示可点击的装饰文本。

**显示格式**：
```typescript
// [KG: 3 observations, 2 relations]  ← 可点击
export class UserService {
  // ...
}
```

**点击行为**：
- 打开快速预览面板
- 显示该实体的所有观察记录和关系
- 提供快速编辑入口

**实现要点**：
- 使用 `vscode.languages.registerCodeLensProvider`
- 异步加载实体信息
- 支持命令执行

#### 3.6 Webview 可视化面板

**功能描述**：
最亮眼的功能。提供一个命令 `Knowledge: Visualize Graph`，打开新的 Tab 页面（Webview），以图形方式展示知识图谱。

**可视化特性**：
- **节点**：代表实体，不同颜色/形状表示不同类型
- **连线**：代表关系，不同颜色/样式表示不同关系类型
- **交互**：
  - 拖拽节点
  - 缩放和平移画布
  - 点击节点查看详情
  - 点击节点跳转到代码
  - 右键菜单添加关系
  - 搜索高亮

**视图模式**：
- **全局视图**：显示整个图谱
- **局部视图**：以某个实体为中心，显示其邻居
- **时间线视图**：按创建时间排序

**实现要点**：
- 使用 VS Code Webview API
- 图形库选择：
  - **React Flow**（推荐）：React 组件，易集成，性能好
  - **D3.js**：功能强大，但集成复杂
  - **Vis.js**：简单易用，适合快速原型
- 数据导出/导入（JSON、GraphML 等）

## 🛠️ 技术选型

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **语言** | TypeScript | VS Code 插件标准，类型安全 |
| **框架** | VS Code Extension API | 官方插件开发框架 |
| **数据库** | better-sqlite3 | 性能好，同步操作，适合插件逻辑 |
| **图可视化** | React Flow | React 组件，易集成，性能好 |
| **UI 框架** | VS Code Tree View API | 原生支持，样式统一 |
| **构建工具** | webpack / esbuild | 打包插件代码 |

## 📝 实现步骤

### 阶段一：项目基础搭建（Week 1-2）

#### 步骤 1.1：初始化 VS Code 插件项目
- [ ] 使用 `yo code` 或手动创建插件项目结构
- [ ] 配置 `package.json`：
  - 插件名称、描述、版本
  - 激活事件（activationEvents）
  - 命令注册（contributes.commands）
  - 菜单注册（contributes.menus）
- [ ] 配置 TypeScript 编译选项
- [ ] 配置 webpack 或 esbuild 打包
- [ ] 创建基本的扩展入口文件 `extension.ts`

#### 步骤 1.2：安装和配置依赖
- [ ] 安装 `better-sqlite3`：`npm install better-sqlite3`
- [ ] 安装类型定义：`npm install --save-dev @types/better-sqlite3`
- [ ] 配置 native 模块编译（如果需要）
- [ ] 创建 `.vscodeignore` 排除不必要的文件

#### 步骤 1.3：创建项目目录结构
```
.vscode/
  └─ .knowledge/
      └─ graph.sqlite (运行时创建)

src/
  ├─ extension.ts           # 插件入口
  ├─ services/
  │   ├─ database.ts        # 数据库服务
  │   ├─ entityService.ts   # 实体管理服务
  │   ├─ relationService.ts # 关系管理服务
  │   └─ observationService.ts # 观察记录服务
  ├─ providers/
  │   ├─ hoverProvider.ts   # 悬浮提示提供者
  │   ├─ codeLensProvider.ts # CodeLens 提供者
  │   └─ treeDataProvider.ts # 树视图提供者
  ├─ ui/
  │   ├─ webview/
  │   │   ├─ graphView.ts   # 可视化 Webview
  │   │   └─ components/    # React 组件
  │   └─ commands/          # 命令处理器
  └─ utils/
      ├─ codeParser.ts      # 代码解析工具
      └─ types.ts           # 类型定义
```

### 阶段二：数据库层实现（Week 2-3）

#### 步骤 2.1：数据库初始化
- [ ] 创建 `database.ts` 服务类
- [ ] 实现数据库连接和初始化逻辑
- [ ] 创建工作区 `.vscode/.knowledge/` 目录（如果不存在）
- [ ] 实现数据库迁移机制（版本管理）

#### 步骤 2.2：实现数据库 Schema
- [ ] 创建 `entities` 表
- [ ] 创建 `relations` 表
- [ ] 创建 `observations` 表
- [ ] 创建索引（提升查询性能）
- [ ] 启用 FTS5 扩展（全文搜索）

#### 步骤 2.3：实现核心数据库操作
- [ ] 实现 CRUD 操作的基础方法
- [ ] 实现事务处理
- [ ] 实现错误处理和日志记录
- [ ] 编写单元测试

### 阶段三：核心服务层实现（Week 3-4）

#### 步骤 3.1：实体服务 (EntityService)
- [ ] 实现 `createEntity` 方法
- [ ] 实现 `updateEntity` 方法
- [ ] 实现 `deleteEntity` 方法
- [ ] 实现 `getEntity` 和 `listEntities` 方法
- [ ] 实现按类型、文件路径过滤

#### 步骤 3.2：关系服务 (RelationService)
- [ ] 实现 `addRelation` 方法
- [ ] 实现 `removeRelation` 方法
- [ ] 实现 `getRelations` 方法
- [ ] 实现 `getRelatedEntities` 方法
- [ ] 实现关系类型验证

#### 步骤 3.3：观察记录服务 (ObservationService)
- [ ] 实现 `addObservation` 方法
- [ ] 实现 `updateObservation` 方法
- [ ] 实现 `deleteObservation` 方法
- [ ] 实现 `getObservations` 方法

#### 步骤 3.4：搜索服务
- [ ] 实现全文搜索（FTS5）
- [ ] 实现按类型搜索
- [ ] 实现按文件路径搜索
- [ ] 实现组合搜索和过滤

### 阶段四：VS Code UI 集成（Week 4-6）

#### 步骤 4.1：侧边栏视图实现
- [ ] 创建 Activity Bar 图标和视图
- [ ] 实现 TreeDataProvider
- [ ] 实现搜索框和过滤逻辑
- [ ] 实现实体列表展示
- [ ] 实现点击跳转到代码位置
- [ ] 实现右键菜单操作

#### 步骤 4.2：右键上下文菜单
- [ ] 注册代码编辑器菜单项
- [ ] 注册文件浏览器菜单项
- [ ] 实现代码选择识别（函数、类、变量等）
- [ ] 实现"创建实体"命令
- [ ] 实现"链接到实体"命令
- [ ] 实现"添加观察记录"命令

#### 步骤 4.3：命令面板集成
- [ ] 注册所有核心命令
- [ ] 实现命令的参数收集（QuickPick、InputBox）
- [ ] 实现命令的错误处理和用户反馈
- [ ] 配置键盘快捷键（可选）

#### 步骤 4.4：悬浮提示实现
- [ ] 注册 HoverProvider
- [ ] 实现代码符号解析
- [ ] 查询数据库获取实体信息
- [ ] 格式化 Markdown 显示内容
- [ ] 实现缓存机制（提升性能）

#### 步骤 4.5：CodeLens 实现
- [ ] 注册 CodeLensProvider
- [ ] 识别代码中的实体定义位置
- [ ] 显示统计信息（观察记录数、关系数）
- [ ] 实现点击命令（打开详情面板）

### 阶段五：可视化面板实现（Week 6-8）

#### 步骤 5.1：Webview 基础搭建
- [ ] 创建 Webview 面板类
- [ ] 实现 HTML/CSS/JS 加载
- [ ] 实现消息传递机制（插件 ↔ Webview）
- [ ] 实现数据序列化/反序列化

#### 步骤 5.2：React Flow 集成
- [ ] 搭建 React 开发环境
- [ ] 安装 React Flow 依赖
- [ ] 创建基础图形组件
- [ ] 实现节点和边的渲染
- [ ] 实现布局算法（力导向图、层次布局等）

#### 步骤 5.3：交互功能实现
- [ ] 实现节点拖拽
- [ ] 实现画布缩放和平移
- [ ] 实现节点点击（显示详情）
- [ ] 实现节点双击（跳转到代码）
- [ ] 实现右键菜单（添加关系、删除实体等）
- [ ] 实现搜索高亮

#### 步骤 5.4：视图模式实现
- [ ] 实现全局视图（显示所有实体）
- [ ] 实现局部视图（以实体为中心）
- [ ] 实现过滤视图（按类型、关系类型）
- [ ] 实现时间线视图

#### 步骤 5.5：数据导出/导入
- [ ] 实现 JSON 格式导出
- [ ] 实现 GraphML 格式导出（可选）
- [ ] 实现导入功能
- [ ] 实现数据验证

### 阶段六：代码解析和自动化（Week 8-9）

#### 步骤 6.1：代码解析工具
- [ ] 集成 TypeScript/JavaScript 解析器（如 `@typescript-eslint/parser`）
- [ ] 实现函数识别
- [ ] 实现类识别
- [ ] 实现变量识别
- [ ] 实现导入/导出关系识别

#### 步骤 6.2：自动索引功能（可选）
- [ ] 实现文件监听（onDidChangeFiles）
- [ ] 实现自动创建实体（可配置）
- [ ] 实现自动创建关系（如导入关系）
- [ ] 提供开关控制（避免过度索引）

### 阶段七：优化和测试（Week 9-10）

#### 步骤 7.1：性能优化
- [ ] 实现数据库查询缓存
- [ ] 优化大量实体的列表渲染（虚拟滚动）
- [ ] 优化图谱渲染性能（节点数量限制）
- [ ] 实现懒加载机制

#### 步骤 7.2：错误处理
- [ ] 完善错误处理逻辑
- [ ] 添加用户友好的错误提示
- [ ] 实现错误日志记录

#### 步骤 7.3：测试
- [ ] 编写单元测试（核心服务）
- [ ] 编写集成测试（UI 交互）
- [ ] 手动测试各种使用场景
- [ ] 性能测试（大量数据）

#### 步骤 7.4：文档和示例
- [ ] 编写用户使用文档
- [ ] 创建示例项目演示
- [ ] 录制演示视频（可选）
- [ ] 编写开发者文档（API 文档）

### 阶段八：发布准备（Week 10+）

#### 步骤 8.1：打包和发布
- [ ] 配置发布脚本
- [ ] 创建 VSIX 包
- [ ] 准备 Marketplace 清单
- [ ] 提交到 VS Code Marketplace

#### 步骤 8.2：后续迭代
- [ ] 收集用户反馈
- [ ] 修复 Bug
- [ ] 添加新功能
- [ ] 性能持续优化

## 📊 数据库 Schema 设计

### entities 表

存储代码库中的实体信息。

```sql
CREATE TABLE entities (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,                     -- 实体名称（如函数名、类名）
    type TEXT NOT NULL,                     -- 实体类型（function, class, file, api, etc.）
    file_path TEXT NOT NULL,                -- 文件路径（相对于工作区根目录）
    start_line INTEGER NOT NULL,            -- 起始行号
    end_line INTEGER NOT NULL,              -- 结束行号
    description TEXT,                       -- 描述（可选）
    created_at INTEGER NOT NULL,            -- 创建时间戳
    updated_at INTEGER NOT NULL,            -- 更新时间戳
    metadata TEXT                           -- JSON 格式的额外元数据
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_file_path ON entities(file_path);
CREATE INDEX idx_entities_name ON entities(name);
```

### relations 表

存储实体之间的关系。

```sql
CREATE TABLE relations (
    id TEXT PRIMARY KEY,                    -- UUID
    source_entity_id TEXT NOT NULL,         -- 源实体 ID
    target_entity_id TEXT NOT NULL,         -- 目标实体 ID
    verb TEXT NOT NULL,                     -- 关系类型（uses, calls, extends, etc.）
    created_at INTEGER NOT NULL,            -- 创建时间戳
    metadata TEXT,                          -- JSON 格式的额外元数据
    FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_relations_source ON relations(source_entity_id);
CREATE INDEX idx_relations_target ON relations(target_entity_id);
CREATE INDEX idx_relations_verb ON relations(verb);
```

### observations 表

存储关于实体的观察记录和笔记。

```sql
CREATE TABLE observations (
    id TEXT PRIMARY KEY,                    -- UUID
    entity_id TEXT NOT NULL,                -- 关联的实体 ID
    content TEXT NOT NULL,                  -- 观察内容
    created_at INTEGER NOT NULL,            -- 创建时间戳
    updated_at INTEGER NOT NULL,            -- 更新时间戳
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_observations_entity ON observations(entity_id);
```

### FTS5 全文搜索表

启用 SQLite FTS5 扩展进行全文搜索。

```sql
-- 实体全文搜索
CREATE VIRTUAL TABLE entities_fts USING fts5(
    id UNINDEXED,
    name,
    description,
    content='entities',
    content_rowid='rowid'
);

-- 观察记录全文搜索
CREATE VIRTUAL TABLE observations_fts USING fts5(
    id UNINDEXED,
    entity_id UNINDEXED,
    content,
    content='observations',
    content_rowid='rowid'
);

-- 创建触发器保持 FTS5 表同步
CREATE TRIGGER entities_fts_insert AFTER INSERT ON entities BEGIN
    INSERT INTO entities_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
END;

CREATE TRIGGER entities_fts_delete AFTER DELETE ON entities BEGIN
    INSERT INTO entities_fts(entities_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
END;

CREATE TRIGGER entities_fts_update AFTER UPDATE ON entities BEGIN
    INSERT INTO entities_fts(entities_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
    INSERT INTO entities_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
END;

CREATE TRIGGER observations_fts_insert AFTER INSERT ON observations BEGIN
    INSERT INTO observations_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER observations_fts_delete AFTER DELETE ON observations BEGIN
    INSERT INTO observations_fts(observations_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;

CREATE TRIGGER observations_fts_update AFTER UPDATE ON observations BEGIN
    INSERT INTO observations_fts(observations_fts, rowid, content) VALUES('delete', old.rowid, old.content);
    INSERT INTO observations_fts(rowid, content) VALUES (new.rowid, new.content);
END;
```

## 🎬 用户使用场景

### 场景一：创建和维护实体

**步骤**：
1. 开发者选中 `UserService` 类名
2. 右键选择 `Knowledge: Create Entity from Selection`
3. 插件自动填充名称和代码位置
4. 开发者设置类型为 `Class`
5. 实体创建完成

**结果**：
- 实体被保存到数据库
- 在侧边栏视图中可见
- 鼠标悬停时显示相关信息

### 场景二：添加观察记录

**步骤**：
1. 开发者发现 `UserService.getUsersWithPermissions` 存在性能问题
2. 通过命令面板或右键菜单为 `UserService` 实体添加观察记录
3. 输入内容：`"Warning: getUsersWithPermissions has N+1 query problem. Needs optimization."`
4. 保存

**结果**：
- 观察记录关联到实体
- 其他开发者悬停该实体时能看到警告
- 可以通过搜索找到所有性能警告

### 场景三：建立代码关系

**步骤**：
1. 开发者创建 `AuthController` 实体
2. 打开可视化图谱面板
3. 找到 `AuthController` 和 `UserService` 节点
4. 拖拽 `AuthController` 节点连接到 `UserService`
5. 定义关系类型为 `uses`

**结果**：
- 关系被保存到数据库
- 图谱中显示连线
- 悬停时显示"Used by: AuthController"

### 场景四：新成员接手项目

**步骤**：
1. 新开发者打开项目
2. 插件自动加载知识图谱
3. 鼠标悬停在 `UserService` 上
4. 立即看到性能警告和依赖关系
5. 打开可视化图谱，了解整体架构

**结果**：
- 快速理解代码库结构
- 避免重复踩坑
- 做出更明智的重构决策

## 🚀 未来扩展方向

1. **AI 辅助**：集成 AI 自动识别代码关系和生成观察记录
2. **团队协作**：支持多人编辑和冲突解决
3. **版本历史**：记录知识图谱的变更历史
4. **导入导出**：支持更多格式（GraphML、Neo4j 等）
5. **插件生态**：提供 API 供其他插件扩展
6. **云端同步**：可选的多设备同步功能

## 📚 参考资料

- [VS Code Extension API 文档](https://code.visualstudio.com/api)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [React Flow 文档](https://reactflow.dev/)
- [VS Code Extension 开发指南](https://code.visualstudio.com/api/get-started/your-first-extension)

## 📄 许可证

待定

---

**开始开发**：按照 [实现步骤](#实现步骤) 中的阶段一逐步进行，每个阶段完成后进行测试和代码审查，确保质量后再进入下一阶段。

