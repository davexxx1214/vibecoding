# VibeCoding - VS Code 知识图谱插件

> 将你的代码库转化为智能知识网络，让 AI 编程更高效

一个基于知识图谱和 SQLite 的 VS Code 插件，帮助开发者理解和管理代码库中的复杂关系，同时为 AI 编程提供持久化的项目上下文。

## 📋 目录

- [项目概述](#项目概述)
- [核心价值](#核心价值)
- [当前状态](#当前状态)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [三阶段路线图](#三阶段路线图)
- [AI 协同设计](#ai-协同设计)
- [技术架构](#技术架构)
- [数据库设计](#数据库设计)
- [开发指南](#开发指南)

---

## 🎯 项目概述

### 核心理念

VibeCoding 将 VS Code 工作区本身变成一个**智能知识图谱**，为开发者和 AI 提供：

- **🧠 代码理解助手**：可视化代码关系，快速理解复杂系统
- **📝 项目记忆系统**：持久化保存设计决策、重构笔记、性能警告
- **🤖 AI 编程加速器**：为 AI 提供项目上下文，避免重复解释
- **👥 团队知识共享**：知识图谱可被 Git 追踪，团队协作更顺畅

### 三个核心概念

#### 1. 实体 (Entities)
代码库中的各种元素，**关键特性：具有精确的代码位置**

```typescript
{
  id: "uuid-123",
  name: "UserService",
  type: "Class",
  filePath: "src/services/user.ts",  // ← 可跳转
  startLine: 15,                      // ← 精确定位
  endLine: 120,
  description: "用户管理核心服务",
  observations: [...]
}
```

支持的类型：
- 代码元素：`Function`、`Class`、`Interface`、`Variable`
- 文件系统：`File`、`Directory`
- 业务概念：`API`、`Service`、`Component`、`Database`
- 自定义类型

#### 2. 关系 (Relations)
实体之间的连接，支持多种关系类型

```typescript
{
  from: "AuthController",
  to: "UserService",
  verb: "uses"  // calls, extends, implements, depends_on 等
}
```

#### 3. 观察记录 (Observations)
关于实体的笔记和注释，这是**知识图谱的核心价值**

```typescript
{
  entityId: "uuid-123",
  content: "⚠️ 性能警告：存在 N+1 查询问题，待优化",
  createdAt: "2024-11-06T10:30:00Z"
}
```

用途：
- 性能警告和优化建议
- 设计决策说明
- Bug 记录和修复历史
- 重构待办事项
- 团队协作笔记

---

## 💎 核心价值

### 为开发者

```
传统开发：
  😵 代码库复杂，不知道从哪里改起
  😵 修改一个函数，不知道影响哪些地方
  😵 团队成员的经验分散在聊天记录里
  😵 新人接手项目，理解成本极高

使用 VibeCoding：
  ✅ 悬浮提示显示实体的观察记录和关系
  ✅ 关系图谱显示完整的影响链
  ✅ 观察记录保存团队知识
  ✅ 可视化图谱快速理解项目结构
```

### 为 AI 编程

```
传统 AI 编程：
  😵 AI 每次都要重新理解项目
  😵 上下文窗口有限，无法加载整个项目
  😵 历史决策和笔记容易丢失
  😵 AI 不知道哪些代码有坑

使用 VibeCoding：
  ✅ 导出知识图谱供 AI 阅读（Markdown/JSON）
  ✅ 一键复制实体上下文到 AI 对话
  ✅ 观察记录告诉 AI 哪些代码需要注意
  ✅ 关系图谱帮助 AI 理解依赖链
```

---

## ✅ 当前状态

### 已完成：阶段一 MVP（2000+ 行代码）

根据 [STAGE1_COMPLETE.md](./STAGE1_COMPLETE.md)，我们已经完成：

#### ✅ 核心服务层
- [x] SQLite 数据库服务（FTS5 全文搜索）
- [x] 实体管理服务（CRUD、查询、过滤）
- [x] 关系管理服务（创建、查询、验证）
- [x] 观察记录服务（添加、搜索）

#### ✅ VS Code UI 集成
- [x] **侧边栏树视图**：按类型分组显示实体
- [x] **悬浮提示**：显示实体信息、观察记录、关系
- [x] **CodeLens**：代码上方显示统计信息
- [x] **右键菜单**：创建实体、添加观察记录
- [x] **命令面板**：搜索、查看详情、跳转

#### ✅ 基础功能
- [x] 手动创建实体
- [x] 添加观察记录
- [x] 查看实体详情
- [x] 搜索功能
- [x] 点击跳转到代码

### 下一步：阶段二和三

详见 [三阶段路线图](#三阶段路线图)

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

#### 1️⃣ 创建第一个实体

```
1. 打开一个项目文件（如 user.ts）
2. 选中一个类或函数
3. 右键 → "Knowledge: Create Entity from Selection"
4. 输入描述（可选）
5. 完成！
```

#### 2️⃣ 添加观察记录

```
1. 鼠标悬停在已创建的实体上
2. 点击"Add Observation"
3. 输入笔记内容，如：
   "⚠️ 这个函数有性能问题，需要优化"
4. 保存
```

#### 3️⃣ 查看知识图谱

```
1. 点击侧边栏的"Knowledge Graph"图标（🧠）
2. 浏览按类型分组的实体
3. 点击任意实体跳转到代码位置
```

#### 4️⃣ 搜索

```
1. 命令面板（Ctrl+Shift+P）
2. 输入 "Knowledge: Search Graph"
3. 搜索实体名称、类型或观察记录内容
```

---

## 🎯 核心功能

### 1. 实体管理

#### 创建实体
- **方式一**：选中代码 → 右键菜单 → "Create Entity from Selection"
- **方式二**：命令面板 → "Knowledge: Create new Entity"
- **方式三**：文件浏览器 → 右键 → "Create Entity for this File"

#### 智能识别
插件会自动识别选中代码的类型：
- 类声明 → `Class`
- 函数声明 → `Function`
- 接口定义 → `Interface`
- 其他 → 手动选择类型

### 2. 悬浮提示增强

鼠标悬停在实体上时，显示：

```markdown
📦 UserService (Class)
📄 src/services/user.ts:15-120

💭 观察记录 (3)
  • ⚠️ 性能警告：存在 N+1 查询问题
  • ✅ 已添加 Redis 缓存提升性能
  • 📝 团队决策：所有用户操作必须通过此类

🔗 关系 (5)
  → 调用：DatabasePool, RedisCache
  ← 被调用：AuthController, OrderService

[查看详情] [添加观察] [复制上下文]
```

### 3. CodeLens 装饰

在函数/类定义上方显示：

```typescript
// [KG: 3 observations, 2 relations] ← 可点击
export class UserService {
  // ...
}
```

点击后打开快速预览面板。

### 4. 侧边栏视图

按类型分组展示：

```
📁 Classes (12)
  📦 UserService
  📦 AuthController
  📦 DatabasePool

📁 Functions (25)
  ⚡ validateUser
  ⚡ hashPassword
  
📁 Interfaces (8)
  📋 UserDTO
  📋 AuthToken

🔍 搜索框
```

### 5. 搜索功能

支持 FTS5 全文搜索：
- 搜索实体名称
- 搜索实体类型
- 搜索观察记录内容
- 支持中英文

---

## 🗺️ 三阶段路线图

### 第一阶段：MVP - 基础知识图谱 ✅ **已完成**

**目标**：可用的手动知识图谱管理工具

**核心功能**：
- ✅ SQLite 数据库（实体、关系、观察记录）
- ✅ 基础 CRUD 操作
- ✅ VS Code UI 集成（侧边栏、悬浮、CodeLens、菜单）
- ✅ 手动创建实体和关系
- ✅ 基础搜索功能

**验收标准**：
- ✅ 开发者可以手动标记代码实体
- ✅ 可以通过 UI 浏览和搜索
- ✅ 悬浮提示能显示观察记录

**时间**：已完成（约 2000+ 行代码）

---

### 第二阶段：AI 协同 🔥 **进行中**

**目标**：让知识图谱成为 AI 编程的"外部记忆"

**核心功能**：

#### 2.1 知识图谱导出 🎯
- [ ] **Markdown 格式导出**（最适合 AI 阅读）
  - 命令：`Knowledge: Export as Markdown`
  - 格式化输出：实体描述 + 观察记录 + 关系链
  - 可直接复制到 AI 对话框
  
- [ ] **JSON 格式导出**（结构化数据）
  - 命令：`Knowledge: Export as JSON`
  - 适合数据分析和备份
  
- [ ] **项目摘要文档**
  - 自动生成项目概览
  - 包含关键实体和设计决策
  - 适合新人 onboarding

#### 2.2 快速上下文注入 🎯
- [ ] **复制实体上下文**
  - 快捷键：`Ctrl+K Ctrl+C`
  - 一键复制实体的完整信息（代码 + 观察 + 关系）
  - 自动格式化为 AI 友好的文本
  
- [ ] **生成文件摘要**
  - 命令：`Knowledge: Generate File Summary`
  - 列出文件中的所有实体和关键笔记
  
- [ ] **依赖链分析**
  - 命令：`Knowledge: Show Dependency Chain`
  - 生成实体的完整依赖树
  - 显示直接依赖和间接影响

#### 2.3 Cursor 深度集成 🎯
- [ ] **自动生成 .cursorrules**
  - 命令：`Knowledge: Generate Cursor Rules`
  - 将知识图谱转化为 Cursor 规则
  - 包含项目结构、关键实体、编码规范
  
- [ ] **项目知识库文档**
  - 在项目根目录生成 `KNOWLEDGE.md`
  - 作为 Cursor 的 context file
  - 随代码更新自动刷新

**验收标准**：
- ✅ 可以一键导出知识图谱供 AI 使用
- ✅ AI 能基于导出的上下文理解项目
- ✅ 开发者能快速将图谱注入 AI 对话
- ✅ Cursor 能读取项目知识图谱

**时间估计**：1-2 周

---

### 第三阶段：智能增强 🚀 **规划中**

**目标**：从手动维护到自动化

**核心功能**：

#### 3.1 代码自动解析 🚀
- [ ] **TypeScript/JavaScript 解析**
  - 使用 TypeScript Compiler API
  - 自动识别函数、类、接口、变量
  - 提取 JSDoc 注释作为描述
  
- [ ] **关系自动建立**
  - 分析函数调用 → `calls` 关系
  - 分析类继承 → `extends` 关系
  - 分析接口实现 → `implements` 关系
  - 分析导入依赖 → `imports` 关系
  
- [ ] **增量更新机制**
  - 监听文件变更（onDidChangeTextDocument）
  - 只重新解析变更的部分
  - 智能合并手动和自动数据

#### 3.2 智能建议系统 🚀
- [ ] **缺失实体提醒**
  - 检测到重要的导出函数/类未记录
  - 在 CodeLens 中显示建议："💡 添加到知识图谱"
  
- [ ] **关系补全建议**
  - 检测到函数调用但图谱中没有关系记录
  - 提供一键添加按钮
  
- [ ] **观察记录推荐**
  - 基于代码复杂度建议添加说明
  - 检测 TODO、FIXME 注释并建议记录
  - 发现性能问题（大循环、递归）时提醒

#### 3.3 全自动扫描（可选） 🚀
- [ ] **初次扫描**
  - 首次启用插件时扫描整个项目
  - 生成基础知识图谱
  - 用户审核后保存
  
- [ ] **定期扫描**
  - 后台扫描新增代码
  - 发现变更时通知用户
  - 支持白名单/黑名单配置

#### 3.4 AI 辅助生成观察记录（实验性） 🧪
- [ ] 集成本地 LLM 或调用 API
- [ ] 自动为复杂函数生成说明
- [ ] 用户审核后保存

**验收标准**：
- ✅ 打开项目后自动扫描生成基础图谱
- ✅ 代码修改后自动更新相关实体
- ✅ 智能建议帮助补全知识图谱
- ✅ 手动和自动数据无缝合并

**时间估计**：3-4 周

---

## 🤖 AI 协同设计详解

> 这是第二阶段的核心内容，让知识图谱成为 AI 的"外部记忆"

### 设计理念

**不依赖特定 AI 工具**，而是通过**数据导出 + 快捷命令**让任何 AI 工具都能访问知识图谱。

### 功能一：知识图谱导出

#### 1. Markdown 格式（最适合 AI 阅读）

**命令**：`Knowledge: Export as Markdown`

**输出示例**：

```markdown
# MyProject Knowledge Graph

**项目概览**
- 实体数量：156
- 关系数量：243
- 最后更新：2024-11-06

---

## 核心实体

### UserService (Class)

**位置**：`src/services/user.ts:15-120`

**描述**：用户管理核心服务

**观察记录**：
- ⚠️ **性能警告**：存在 N+1 查询问题（2024-11-01）
- ✅ **优化完成**：已添加 Redis 缓存（2024-11-03）
- 📝 **团队决策**：所有用户操作必须通过此类

**依赖关系**：
- **调用** → DatabasePool, RedisCache, Logger
- **被调用** ← AuthController, OrderService, AdminPanel

**代码片段**：
```typescript
export class UserService {
  constructor(
    private db: DatabasePool,
    private cache: RedisCache
  ) {}
  
  async getUsers() {
    // 实现...
  }
}
```

---

### AuthController (Class)

**位置**：`src/controllers/auth.ts:20-85`

**描述**：认证控制器

**观察记录**：
- 🔒 **安全**：JWT token 存储在 Redis，过期 24h
- 📝 **规范**：所有 API 路由必须经过 AuthMiddleware

**依赖关系**：
- **使用** → UserService, JWTService
- **被调用** ← API Routes

---

## 关系图谱

### 核心依赖链
```
API Routes
  └─> AuthController
      └─> UserService
          ├─> DatabasePool
          └─> RedisCache
```

### 数据流
```
Client Request
  → AuthController (JWT 验证)
  → UserService (业务逻辑)
  → DatabasePool (数据访问)
  → RedisCache (缓存)
```

---

## 重要设计决策

1. **用户服务集中化**
   - 所有用户相关操作必须通过 UserService
   - 不允许直接访问 User 表
   - 原因：统一权限控制和缓存策略

2. **缓存策略**
   - 用户信息缓存 5 分钟
   - 使用 Redis 存储 session
   - 原因：减少数据库压力

3. **已知问题**
   - UserService.getUsers 有 N+1 查询问题
   - 计划使用 DataLoader 优化
   - 影响：高并发场景性能下降

---

**生成时间**：2024-11-06 10:30:00  
**插件版本**：VibeCoding v0.1.0
```

**使用场景**：
```
1. 复制整个 Markdown
2. 粘贴到 AI 对话框
3. 提问："基于这个项目知识图谱，帮我优化 UserService"

AI 现在有了完整上下文！
```

#### 2. JSON 格式（结构化数据）

**命令**：`Knowledge: Export as JSON`

**输出示例**：

```json
{
  "metadata": {
    "project": "MyProject",
    "exportDate": "2024-11-06T10:30:00Z",
    "entityCount": 156,
    "relationCount": 243,
    "pluginVersion": "0.1.0"
  },
  "entities": [
    {
      "id": "uuid-123",
      "name": "UserService",
      "type": "Class",
      "file": "src/services/user.ts",
      "location": {
        "startLine": 15,
        "endLine": 120
      },
      "description": "用户管理核心服务",
      "observations": [
        {
          "content": "⚠️ 性能警告：存在 N+1 查询问题",
          "createdAt": "2024-11-01T10:00:00Z"
        },
        {
          "content": "✅ 已添加 Redis 缓存",
          "createdAt": "2024-11-03T15:30:00Z"
        }
      ],
      "relations": {
        "calls": ["DatabasePool", "RedisCache"],
        "calledBy": ["AuthController", "OrderService"]
      }
    }
  ],
  "relations": [
    {
      "from": "AuthController",
      "to": "UserService",
      "type": "uses"
    }
  ]
}
```

**使用场景**：
- 供其他工具解析
- 数据分析和可视化
- 备份和版本控制
- 与其他系统集成

### 功能二：快速上下文注入

#### 命令 1：复制实体上下文

**触发方式**：
- 鼠标悬停 → 点击"复制上下文"按钮
- 右键菜单 → "Knowledge: Copy Entity Context"
- 快捷键：`Ctrl+K Ctrl+C`（选中实体后）

**输出内容**：

```
📦 实体：UserService (Class)
📄 位置：src/services/user.ts:15-120

💭 关键观察：
  • ⚠️ 性能警告：存在 N+1 查询问题
  • ✅ 已添加 Redis 缓存提升性能
  • 📝 团队决策：所有用户操作必须通过此类

🔗 依赖关系：
  调用 → DatabasePool, RedisCache, Logger
  被调用 ← AuthController (3处), OrderService (2处), AdminPanel (1处)

📋 代码片段：
```typescript
export class UserService {
  constructor(
    private db: DatabasePool,
    private cache: RedisCache
  ) {}
  
  async getUsers(): Promise<User[]> {
    const cached = await this.cache.get('users');
    if (cached) return cached;
    
    const users = await this.db.query('SELECT * FROM users');
    await this.cache.set('users', users, 300);
    return users;
  }
}
```

---
💡 提示：此上下文由 VibeCoding 生成，包含实体的完整信息和团队笔记。
```

**使用流程**：

```
场景：你要让 AI 帮你优化一个函数

步骤 1：鼠标悬停在 UserService 上
步骤 2：点击"复制上下文"（或 Ctrl+K Ctrl+C）
步骤 3：打开 Cursor/ChatGPT
步骤 4：粘贴上下文 + 提问

示例对话：
---
[粘贴的上下文]
📦 实体：UserService (Class)
观察：存在 N+1 查询问题
依赖：DatabasePool, RedisCache
被调用：AuthController, OrderService
---

我的问题：
如何优化 UserService 的查询性能？
注意：它被 AuthController 和 OrderService 调用，改动不能破坏现有接口。

AI 回复：
✅ 基于你的上下文，我看到：
   1. 已经用了 Redis 缓存 ✓
   2. 存在 N+1 问题（主要在 getUsers 方法）
   3. AuthController 和 OrderService 依赖它
   
   建议方案：使用 DataLoader 批量加载...
```

#### 命令 2：生成文件摘要

**命令**：`Knowledge: Generate File Summary`

**输出示例**：

```
📄 文件摘要：src/services/user.ts

包含实体 (3)：
  📦 UserService (Class, 行 15-120)
  📋 UserDTO (Interface, 行 5-10)
  ⚡ validateUser (Function, 行 125-140)

关键关系：
  • UserService → 调用 DatabasePool, RedisCache
  • AuthController → 使用 UserService
  • OrderService → 使用 UserDTO

重要笔记 (2)：
  ⚠️ UserService 有性能问题待优化
  ✅ 已添加 Redis 缓存提升查询性能

建议操作：
  💡 UserService 被 3 个地方调用，修改需谨慎
  💡 validateUser 函数可以提取到独立的 util 文件
```

**使用场景**：
- 快速了解一个文件的核心内容
- 在 AI 对话中解释文件结构
- Code Review 时的参考

#### 命令 3：依赖链分析

**命令**：`Knowledge: Show Dependency Chain`

选中实体后触发，生成完整的依赖树：

```
🔗 UserService 依赖链分析

📤 直接依赖 (UserService 调用)
├─ DatabasePool
├─ RedisCache
└─ Logger

📥 直接被依赖 (被 UserService 调用)
├─ AuthController (3 处调用)
├─ OrderService (2 处调用)
└─ AdminPanel (1 处调用)

🌐 间接影响范围
├─ API Routes (通过 AuthController)
├─ PaymentProcessor (通过 OrderService)
├─ NotificationService (通过 OrderService)
└─ AdminDashboard (通过 AdminPanel)

⚠️ 影响评估
  • 修改 UserService 接口会影响 6 个直接调用
  • 间接影响 10+ 个下游服务
  • 建议：先在测试环境验证变更

📊 统计
  • 直接依赖：3 个
  • 被依赖：3 个
  • 影响范围：10+ 个服务
  • 风险等级：🔴 高
```

**使用场景**：
- 重构前的影响分析
- 告诉 AI 完整的依赖关系
- 团队讨论技术方案

### 功能三：Cursor 深度集成

#### 1. 自动生成 .cursorrules

**命令**：`Knowledge: Generate Cursor Rules`

在项目根目录生成 `.cursorrules` 文件：

```markdown
# VibeCoding Knowledge Graph Context

> 本文件由 VibeCoding 自动生成，包含项目知识图谱的关键信息。
> 最后更新：2024-11-06 10:30:00

## 项目概览

- **实体数量**：156 个
- **关系数量**：243 个
- **主要技术栈**：TypeScript, Node.js, SQLite
- **架构模式**：分层架构（Controller → Service → Repository）

---

## 核心实体速查

### UserService (src/services/user.ts)
- **职责**：用户管理核心服务
- **⚠️ 注意**：存在 N+1 查询问题，使用时注意性能
- **✅ 优化**：已添加 Redis 缓存
- **依赖**：DatabasePool, RedisCache
- **团队规范**：所有用户操作必须通过此类

### AuthController (src/controllers/auth.ts)
- **职责**：认证控制器
- **🔒 安全**：JWT token 存储在 Redis，过期 24h
- **依赖**：UserService, JWTService
- **团队规范**：所有 API 路由必须经过 AuthMiddleware

### DatabasePool (src/database/pool.ts)
- **职责**：数据库连接池
- **⚠️ 配置**：连接池大小 20（经过压测）
- **⚠️ 重要**：不要启用自动重连，会导致死锁
- **被依赖**：UserService, OrderService 等 15+ 服务

---

## 架构约束

### 数据访问规范
```
❌ 不允许：直接访问数据库表
✅ 必须：通过 Service 层访问
原因：统一权限控制和缓存策略
```

### 用户权限处理
```
❌ 不允许：在 Controller 中检查权限
✅ 必须：在 AuthMiddleware 中统一处理
原因：集中管理，避免遗漏
```

### 缓存策略
```
✅ 用户信息：缓存 5 分钟
✅ 配置数据：缓存 1 小时
✅ 静态内容：缓存 24 小时
```

---

## 已知问题

### 🔴 高优先级
1. **UserService.getUsers**
   - 问题：N+1 查询
   - 影响：高并发场景性能下降
   - 计划：使用 DataLoader 优化
   - 负责人：@team

### 🟡 中优先级
2. **AuthController.login**
   - 问题：缺少频率限制
   - 影响：可能被暴力破解
   - 计划：添加 rate limiting
   
---

## 重要设计决策

### 为什么用 Redis 而不是内存缓存？
- **决策日期**：2024-10-15
- **原因**：支持多实例部署，缓存一致性
- **权衡**：增加了 Redis 依赖，但提升了扩展性

### 为什么不用 ORM？
- **决策日期**：2024-10-01
- **原因**：项目查询复杂，ORM 性能不佳
- **权衡**：手写 SQL 维护成本更高，但性能好 50%

---

## 编码规范（基于知识图谱）

### 修改 UserService 时
- ⚠️ 注意：被 3 个 Controller 调用
- ⚠️ 注意：已知性能问题
- ✅ 建议：先写测试再改代码
- ✅ 建议：修改后更新知识图谱观察记录

### 添加新 API 时
- ✅ 必须：经过 AuthMiddleware
- ✅ 必须：调用 Service 层而非直接访问数据库
- ✅ 建议：在知识图谱中记录 API 实体

---

## 快速参考

### 实体类型统计
- Classes: 45
- Functions: 67
- Interfaces: 28
- APIs: 16

### 关系类型统计
- calls: 156
- uses: 45
- implements: 23
- extends: 19

---

**生成时间**：2024-11-06 10:30:00  
**插件版本**：VibeCoding v0.1.0  
**自动更新**：每次知识图谱变更时自动重新生成
```

**效果**：
- Cursor 在每次对话时自动读取这个文件
- AI 了解项目的架构、约束、已知问题
- 开发效率显著提升

#### 2. 生成项目知识库文档

**命令**：`Knowledge: Export Project Knowledge Base`

生成 `KNOWLEDGE.md` 作为 Cursor 的 context file：

```markdown
# Project Knowledge Base

> 本文档是项目的知识中心，包含关键实体、设计决策、已知问题。
> 由 VibeCoding 自动生成和维护。

[内容同上，但更详细]
```

---

## 🏗️ 技术架构

### 技术栈

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| **插件框架** | VS Code Extension API | 官方插件开发框架 |
| **语言** | TypeScript | 类型安全，开发体验好 |
| **数据库** | better-sqlite3 | 同步 API，性能好 |
| **全文搜索** | SQLite FTS5 | 内置，无需额外依赖 |
| **UI 框架** | VS Code Native Components | TreeView, Webview 等 |
| **构建工具** | esbuild | 快速打包 |
| **代码解析** | TypeScript Compiler API | 阶段三使用 |
| **图可视化** | React Flow | 阶段五使用 |

### 项目结构

```
vibecoding/
├── src/
│   ├── extension.ts                  # ✅ 插件入口
│   ├── services/
│   │   ├── database.ts               # ✅ 数据库服务
│   │   ├── entityService.ts          # ✅ 实体管理
│   │   ├── relationService.ts        # ✅ 关系管理
│   │   └── observationService.ts     # ✅ 观察记录管理
│   ├── providers/
│   │   ├── hoverProvider.ts          # ✅ 悬浮提示
│   │   ├── codeLensProvider.ts       # ✅ CodeLens
│   │   └── treeDataProvider.ts       # ✅ 树视图
│   ├── ui/
│   │   ├── commands/
│   │   │   └── entityCommands.ts     # ✅ 命令处理器
│   │   └── webview/
│   │       └── graphView.ts          # 🔜 可视化面板（阶段五）
│   ├── utils/
│   │   ├── types.ts                  # ✅ 类型定义
│   │   ├── codeParser.ts             # 🔜 代码解析（阶段三）
│   │   └── exporter.ts               # 🔜 导出工具（阶段二）
│   └── ai/
│       ├── contextBuilder.ts         # 🔜 上下文构建（阶段二）
│       └── cursorIntegration.ts      # 🔜 Cursor 集成（阶段二）
├── package.json                      # ✅ 插件配置
├── tsconfig.json                     # ✅ TypeScript 配置
├── esbuild.js                        # ✅ 构建脚本
├── README.md                         # 本文件
├── STAGE1_COMPLETE.md                # 阶段一完成总结
├── INSTALL.md                        # 安装指南
└── QUICKSTART.md                     # 快速入门

图例：
  ✅ 已实现
  🔜 计划中
  🧪 实验性
```

### 数据流

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

---

## 💾 数据库设计

### Schema 概览

#### entities 表（实体）

```sql
CREATE TABLE entities (
    id TEXT PRIMARY KEY,                -- UUID
    name TEXT NOT NULL,                 -- 实体名称
    type TEXT NOT NULL,                 -- 实体类型（function, class, file, etc.）
    file_path TEXT NOT NULL,            -- 文件路径（相对于工作区根目录）
    start_line INTEGER NOT NULL,        -- 起始行号
    end_line INTEGER NOT NULL,          -- 结束行号
    description TEXT,                   -- 描述
    created_at INTEGER NOT NULL,        -- 创建时间戳
    updated_at INTEGER NOT NULL,        -- 更新时间戳
    metadata TEXT                       -- JSON 格式的额外元数据
);

-- 索引
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_file_path ON entities(file_path);
CREATE INDEX idx_entities_name ON entities(name);
```

#### relations 表（关系）

```sql
CREATE TABLE relations (
    id TEXT PRIMARY KEY,                -- UUID
    source_entity_id TEXT NOT NULL,     -- 源实体 ID
    target_entity_id TEXT NOT NULL,     -- 目标实体 ID
    verb TEXT NOT NULL,                 -- 关系类型（uses, calls, extends, etc.）
    created_at INTEGER NOT NULL,        -- 创建时间戳
    metadata TEXT,                      -- JSON 格式的额外元数据
    
    FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_relations_source ON relations(source_entity_id);
CREATE INDEX idx_relations_target ON relations(target_entity_id);
CREATE INDEX idx_relations_verb ON relations(verb);
```

#### observations 表（观察记录）

```sql
CREATE TABLE observations (
    id TEXT PRIMARY KEY,                -- UUID
    entity_id TEXT NOT NULL,            -- 关联的实体 ID
    content TEXT NOT NULL,              -- 观察内容
    created_at INTEGER NOT NULL,        -- 创建时间戳
    updated_at INTEGER NOT NULL,        -- 更新时间戳
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_observations_entity ON observations(entity_id);
```

### FTS5 全文搜索

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

-- 触发器保持 FTS5 表同步
CREATE TRIGGER entities_fts_insert AFTER INSERT ON entities BEGIN
    INSERT INTO entities_fts(rowid, name, description) 
    VALUES (new.rowid, new.name, new.description);
END;

-- 更多触发器... (详见 src/services/database.ts)
```

### 存储位置

```
项目根目录/
  └── .vscode/
      └── .knowledge/
          └── graph.sqlite  (约 1-10MB，取决于项目大小)
```

**注意**：
- 可以被 Git 追踪（团队共享知识）
- 也可以添加到 `.gitignore`（个人笔记）
- 建议：添加到 Git，但排除临时表和缓存

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

### 添加新命令

```typescript
// 1. 在 package.json 中注册命令
{
  "contributes": {
    "commands": [
      {
        "command": "knowledge.myNewCommand",
        "title": "Knowledge: My New Command"
      }
    ]
  }
}

// 2. 在 extension.ts 中注册处理器
context.subscriptions.push(
  vscode.commands.registerCommand('knowledge.myNewCommand', () => {
    // 命令实现
  })
);
```

### 添加新的实体类型

```typescript
// 在 src/utils/types.ts 中添加
export type EntityType = 
  | 'function'
  | 'class'
  | 'interface'
  | 'file'
  | 'myNewType';  // ← 新类型

// 在 TreeDataProvider 中添加对应图标
private getIcon(type: EntityType): string {
  const icons = {
    function: '⚡',
    class: '📦',
    interface: '📋',
    file: '📄',
    myNewType: '🆕'  // ← 新图标
  };
  return icons[type] || '📌';
}
```

### 代码规范

- 使用 TypeScript strict 模式
- 使用 async/await 而非 callback
- 错误处理使用 try/catch
- 命名规范：
  - 文件名：camelCase.ts
  - 类名：PascalCase
  - 函数/变量：camelCase
  - 常量：UPPER_SNAKE_CASE

### 测试建议

```typescript
// 单元测试示例
describe('EntityService', () => {
  it('should create entity', async () => {
    const entity = await entityService.createEntity({
      name: 'TestClass',
      type: 'class',
      filePath: 'test.ts',
      startLine: 1,
      endLine: 10
    });
    
    expect(entity.id).toBeDefined();
    expect(entity.name).toBe('TestClass');
  });
});
```

---

## 📚 参考资料

### 官方文档

- [VS Code Extension API](https://code.visualstudio.com/api)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [React Flow 文档](https://reactflow.dev/)

### 相关项目

- [memory-mcp-server-go](https://github.com/okooo5km/memory-mcp-server-go) - 知识图谱 MCP 服务器（Go 实现）
- [TypeScript Language Service](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API) - 代码解析参考

### 社区

- [GitHub Issues](https://github.com/yourusername/vibecoding/issues) - 问题反馈
- [GitHub Discussions](https://github.com/yourusername/vibecoding/discussions) - 功能讨论

---

## 🎯 使用场景示例

### 场景一：理解复杂项目

**问题**：新人接手一个 10 万行代码的项目，不知道从哪里看起。

**解决方案**：
1. 查看知识图谱侧边栏，按类型浏览实体
2. 点击核心类（如 `UserService`），跳转到代码
3. 悬浮提示显示观察记录："这是用户管理的入口"
4. 查看关系：被 `AuthController` 和 `OrderService` 调用
5. 导出 Markdown，让 AI 解释整体架构

**效果**：1 小时内理解项目核心结构，而非花 1 周阅读代码。

### 场景二：安全重构

**问题**：要修改 `UserService.getUsers` 方法，但不知道会影响哪些地方。

**解决方案**：
1. 右键 `getUsers` → "Knowledge: Show Dependency Chain"
2. 看到被 3 个 Controller 调用，间接影响 10+ 服务
3. 查看观察记录："⚠️ 存在 N+1 查询问题"
4. 复制上下文到 AI，询问如何优化
5. AI 基于完整上下文给出建议
6. 实施优化后，更新观察记录："✅ 已使用 DataLoader 优化"

**效果**：零破坏性重构，团队知识得以保留。

### 场景三：团队协作

**问题**：团队成员的经验散落在 Slack、邮件、口头交流中。

**解决方案**：
1. 发现性能问题时，添加观察记录到知识图谱
2. 做出设计决策时，记录原因和权衡
3. 知识图谱随代码提交到 Git
4. 其他成员拉取代码时，自动获得最新知识

**效果**：团队知识沉淀，新人快速上手。

### 场景四：AI 辅助编程

**问题**：AI 不了解项目，每次都要重新解释上下文。

**解决方案**：
1. 导出知识图谱为 Markdown
2. 生成 `.cursorrules` 配置
3. AI 自动读取项目知识图谱
4. 开发时，一键复制实体上下文到 AI 对话

**效果**：AI 成为真正懂项目的编程助手。

---

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)（待创建）。

**贡献方式**：
- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- 感谢 [memory-mcp-server-go](https://github.com/okooo5km/memory-mcp-server-go) 项目的启发
- 感谢 VS Code 社区的支持

---

## 📞 联系方式

- **项目主页**：https://github.com/yourusername/vibecoding
- **问题反馈**：[GitHub Issues](https://github.com/yourusername/vibecoding/issues)
- **功能讨论**：[GitHub Discussions](https://github.com/yourusername/vibecoding/discussions)

---

**开始使用 VibeCoding，让你的代码库更智能！** 🚀

