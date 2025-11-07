# VibeCoding 演示指南

> 基于 [NestJS RealWorld Example App](https://github.com/lujakob/nestjs-realworld-example-app) 的完整演示

---

## 📋 目录

- [项目介绍](#项目介绍)
- [为什么选择这个项目](#为什么选择这个项目)
- [准备工作](#准备工作)
- [演示场景](#演示场景)
- [完整演示脚本](#完整演示脚本)
- [预期效果](#预期效果)

---

## 🎯 项目介绍

### NestJS RealWorld Example App

这是一个遵循 [RealWorld](https://github.com/gothinkster/realworld) 规范的完整后端 API 实现，使用 NestJS + TypeORM 构建。

**项目地址**：https://github.com/lujakob/nestjs-realworld-example-app

**技术栈**：
- **框架**：NestJS（类似 Spring Boot 的 Node.js 框架）
- **数据库**：TypeORM + MySQL
- **语言**：TypeScript
- **架构**：分层架构（Controller → Service → Repository → Entity）

**功能模块**：
```
src/
├── user/                    # 用户模块
│   ├── user.controller.ts   # 用户控制器
│   ├── user.service.ts      # 用户服务
│   ├── user.entity.ts       # 用户实体
│   └── user.module.ts       # 用户模块
├── article/                 # 文章模块
│   ├── article.controller.ts
│   ├── article.service.ts
│   ├── article.entity.ts
│   └── article.module.ts
├── profile/                 # 个人资料模块
├── tag/                     # 标签模块
└── app.module.ts           # 根模块
```

**业务功能**：
- 用户注册、登录、认证（JWT）
- 文章 CRUD（创建、阅读、更新、删除）
- 文章点赞（Favorite）
- 评论系统
- 用户关注（Follow）
- 标签管理

---

## 💡 为什么选择这个项目

### 1. **清晰的分层架构**
```
API 层 (Controllers)
  ↓ uses
业务层 (Services)
  ↓ uses
数据层 (Repositories/Entities)
```

这种分层非常适合展示知识图谱的**关系追踪**能力。

### 2. **真实的业务逻辑**

不是简单的 CRUD，包含复杂的业务关系：
- User ← → Article（用户创建文章）
- Article ← → Comment（文章有评论）
- User ← → User（用户关注关系）
- Article ← → Tag（文章标签关系）

### 3. **适中的代码规模**

- 约 3000-5000 行代码
- 不会太简单（失去演示价值）
- 不会太复杂（难以理解）

### 4. **易于理解**

基于 Medium.com 克隆，业务逻辑容易理解：
- 用户发表文章
- 其他用户点赞、评论
- 用户互相关注

---

## 🛠️ 准备工作

### 步骤 1：Clone 项目

```bash
# 克隆项目
git clone https://github.com/lujakob/nestjs-realworld-example-app.git
cd nestjs-realworld-example-app

# 安装依赖
npm install

# 配置数据库（可选，仅用于演示代码结构）
cp src/config.ts.example src/config.ts
```

**注意**：演示 VibeCoding 插件不需要运行项目，只需要代码文件。

### 步骤 2：在 VS Code 中打开项目

```bash
code .
```

### 步骤 3：启动 VibeCoding 插件

1. 在你的 `vibecoding` 项目中按 `F5` 启动插件调试
2. 在新打开的 Extension Development Host 窗口中打开 `nestjs-realworld-example-app` 项目

---

## 🎬 演示场景

### 场景 1：新人接手项目 👶

**背景**：一个新开发者刚加入团队，需要快速理解项目结构。

**问题**：
- 😵 不知道从哪里看起
- 😵 不知道 UserService 被哪些地方调用
- 😵 不知道修改 ArticleService 会影响哪些功能

**使用 VibeCoding 解决**：
1. 快速标记核心实体
2. 建立关系图谱
3. 导出给 AI 生成项目概览

---

### 场景 2：重构前的影响分析 🔧

**背景**：需要给 `ArticleService.create` 方法增加参数。

**问题**：
- 😵 不知道有多少地方调用了这个方法
- 😵 修改后可能破坏哪些功能

**使用 VibeCoding 解决**：
1. 查看 ArticleService 的依赖链
2. 显示所有调用点
3. 评估影响范围

---

### 场景 3：团队知识沉淀 📚

**背景**：团队在开发过程中积累了很多经验和教训。

**问题**：
- 😵 经验散落在 Slack 聊天记录中
- 😵 新人不知道哪些代码有坑
- 😵 性能优化经验无法传承

**使用 VibeCoding 解决**：
1. 添加观察记录到关键实体
2. 记录性能问题和优化方案
3. 知识图谱随代码提交到 Git

---

### 场景 4：AI 辅助开发 🤖

**背景**：使用 Cursor AI 开发新功能。

**问题**：
- 😵 AI 不了解项目结构
- 😵 每次都要重新解释上下文
- 😵 AI 不知道团队的编码规范

**使用 VibeCoding 解决**：
1. 导出知识图谱为 Markdown
2. 生成 `.cursorrules` 配置
3. AI 自动学习项目知识

---

### 场景 5：持久知识库（使用 Gemini）☁️

**背景**：项目有详细的架构文档和设计决策文档。

**问题**：
- 😵 文档和代码脱节
- 😵 AI 无法访问文档内容
- 😵 搜索文档效率低

**使用 VibeCoding 解决**：
1. 在 `Knowledge/` 文件夹添加文档
2. 自动上传到 Gemini File Search
3. 编辑代码时自动检索相关文档
4. AI 基于文档回答问题

---

## 📖 完整演示脚本

### 第一部分：基础功能演示（10 分钟）

#### 1.1 创建第一个实体（2 分钟）

**操作**：
```
1. 打开 src/user/user.service.ts
2. 选中 UserService 类（整个类定义）
3. 右键 → "Knowledge: Create Entity from Selection"
4. 插件自动识别：
   - 名称：UserService
   - 类型：Class
   - 位置：src/user/user.service.ts:15-120
5. 添加描述："用户管理核心服务"
6. 确认创建
```

**预期效果**：
- ✅ 侧边栏出现 "Classes (1)" 分组
- ✅ 显示 UserService 实体
- ✅ 鼠标悬停在代码上显示实体信息

---

#### 1.2 添加观察记录（2 分钟）

**操作**：
```
1. 鼠标悬停在 UserService 上
2. 点击 "Add Observation"
3. 输入观察记录：
   "⚠️ 注意：findOne 方法没有缓存，高并发场景可能有性能问题"
4. 保存
```

**预期效果**：
- ✅ 悬浮提示显示观察记录
- ✅ CodeLens 显示：`[KG: 1 observation]`

---

#### 1.3 批量创建实体（3 分钟）

**操作**：依次创建以下实体

| 实体 | 类型 | 文件 | 描述 |
|------|------|------|------|
| `UserController` | Class | src/user/user.controller.ts | 用户 API 端点 |
| `ArticleService` | Class | src/article/article.service.ts | 文章管理服务 |
| `ArticleController` | Class | src/article/article.controller.ts | 文章 API 端点 |
| `User` | Entity | src/user/user.entity.ts | 用户数据模型 |
| `Article` | Entity | src/article/article.entity.ts | 文章数据模型 |

**技巧**：
- 可以快速选中类名 → 右键创建
- 描述可以留空，后续补充

**预期效果**：
- ✅ 侧边栏显示 6 个实体
- ✅ 按类型分组显示

---

#### 1.4 建立关系（3 分钟）

**操作**：使用命令面板添加关系

```
关系 1：UserController → UserService
  命令面板 → "Knowledge: Add Relation"
  From: UserController
  To: UserService
  Type: uses
  
关系 2：ArticleController → ArticleService
  From: ArticleController
  To: ArticleService
  Type: uses
  
关系 3：ArticleService → UserService
  From: ArticleService
  To: UserService
  Type: uses （需要获取文章作者信息）
```

**预期效果**：
- ✅ 悬浮在 UserService 上显示：
  ```
  被调用 ← UserController, ArticleService
  ```

---

### 第二部分：知识图谱导出（5 分钟）

#### 2.1 导出为 Markdown（2 分钟）

**操作**：
```
1. 命令面板 → "Knowledge: Export as Markdown"
2. 自动生成 Markdown 格式的知识图谱
3. 复制内容
```

**生成示例**：
```markdown
# NestJS RealWorld Example App - Knowledge Graph

## 核心实体

### UserService (Class)
**位置**：src/user/user.service.ts:15-120
**描述**：用户管理核心服务

**观察记录**：
- ⚠️ 注意：findOne 方法没有缓存，高并发场景可能有性能问题

**依赖关系**：
- 被调用 ← UserController, ArticleService

### ArticleService (Class)
**位置**：src/article/article.service.ts:20-200
**描述**：文章管理服务

**依赖关系**：
- 调用 → UserService
- 被调用 ← ArticleController
```

---

#### 2.2 生成 Cursor Rules（3 分钟）

**操作**：
```
1. 命令面板 → "Knowledge: Generate Cursor Rules"
2. 在项目根目录生成 .cursorrules 文件
```

**生成的 .cursorrules 示例**：
```markdown
# NestJS RealWorld Example App

## 项目架构

这是一个标准的 NestJS 分层架构项目：
- Controllers 处理 HTTP 请求
- Services 包含业务逻辑
- Entities 定义数据模型

## 核心服务

### UserService (src/user/user.service.ts)
- **职责**：用户管理核心服务
- **⚠️ 性能问题**：findOne 方法没有缓存，高并发场景可能有性能问题
- **被调用**：UserController, ArticleService

### ArticleService (src/article/article.service.ts)
- **职责**：文章管理服务
- **依赖**：UserService

## 编码规范

1. **分层规范**
   - Controller 只处理请求响应，不包含业务逻辑
   - Service 包含所有业务逻辑
   - Entity 仅定义数据模型

2. **依赖注入**
   - 使用 NestJS 的依赖注入系统
   - 通过构造函数注入依赖
```

**使用效果**：
- Cursor AI 自动读取这个文件
- AI 了解项目结构和编码规范
- 提供更准确的代码建议

---

### 第三部分：AI 协同演示（10 分钟）

#### 3.1 向 AI 提问（使用知识图谱）

**场景**：询问如何优化性能

**操作**：
```
1. 复制导出的 Markdown 知识图谱
2. 打开 Cursor AI
3. 粘贴知识图谱 + 提问
```

**示例对话**：
```
[粘贴的知识图谱内容]

我的问题：
UserService 的 findOne 方法有性能问题，
如何优化？注意：它被 UserController 和 ArticleService 调用。
```

**AI 回复**（基于完整上下文）：
```
基于你的知识图谱，我看到：
1. UserService.findOne 被两个地方调用
2. 你已经标记了性能问题

优化方案：
1. 添加 Redis 缓存层
2. 实现缓存策略：
   - 缓存时间：5 分钟
   - 更新用户信息时清除缓存
   
3. 修改点：
   - UserService：添加缓存装饰器
   - ArticleService：无需修改（透明缓存）
   
代码示例：
[AI 生成具体代码]
```

---

#### 3.2 影响分析演示

**场景**：要修改 ArticleService.create 方法签名

**操作**：
```
1. 选中 ArticleService
2. 右键 → "Knowledge: Show Dependency Chain"
```

**显示结果**：
```
ArticleService 依赖链分析

📤 直接依赖 (ArticleService 调用)
└─ UserService

📥 直接被依赖 (被 ArticleService 调用)
└─ ArticleController (3 处调用)

⚠️ 影响评估
• 修改接口会影响 1 个直接调用者
• 建议：先检查 ArticleController 的调用方式
```

**复制到 AI**：
```
我要给 ArticleService.create 方法增加一个 publishDate 参数。
依赖链分析显示它被 ArticleController 调用。
请帮我生成修改方案。
```

**AI 回复**：
```
基于依赖链分析，修改方案：

1. ArticleService.create 方法：
   - 添加 publishDate?: Date 参数（可选，默认当前时间）
   
2. ArticleController：
   - 从请求体提取 publishDate
   - 传递给 ArticleService.create
   
3. 向后兼容：
   - publishDate 可选参数，不会破坏现有调用
   
代码示例：
[AI 生成具体代码]
```

---

### 第四部分：持久知识库演示（15 分钟）

#### 4.1 创建 Knowledge 文件夹

**操作**：
```bash
# 在项目根目录
mkdir Knowledge
cd Knowledge

# 创建架构文档
```

**创建文件**：`Knowledge/architecture.md`

```markdown
# NestJS RealWorld 项目架构

## 概览

这是一个标准的三层架构：

### 表现层 (Controllers)
- 处理 HTTP 请求和响应
- 数据验证和转换
- 不包含业务逻辑

**核心 Controllers**：
- `UserController`: 用户相关 API (`/users`, `/user`)
- `ArticleController`: 文章相关 API (`/articles`)
- `ProfileController`: 个人资料 API (`/profiles`)

### 业务层 (Services)
- 包含所有业务逻辑
- 协调多个服务
- 处理事务

**核心 Services**：
- `UserService`: 用户注册、登录、更新
- `ArticleService`: 文章 CRUD、点赞逻辑
- `CommentService`: 评论管理

### 数据层 (Entities + Repositories)
- 定义数据模型
- 数据库访问

**核心 Entities**：
- `User`: 用户表
- `Article`: 文章表
- `Comment`: 评论表
- `Tag`: 标签表

## 数据关系

```
User ─┬─ creates ─→ Article ─┬─ has ─→ Comment
      │                      │
      └─ favorites ─→ ────────┘
      │
      └─ follows ─→ User
```

## 认证机制

使用 JWT (JSON Web Token)：
- Token 在 Header 中传递：`Authorization: Token <jwt>`
- 有效期：7 天
- 包含用户 ID 和邮箱
```

**创建文件**：`Knowledge/decisions/001-auth-strategy.md`

```markdown
# 决策 001: 认证策略

**日期**: 2024-11-06
**决策者**: Tech Team

## 背景

需要实现用户认证和授权机制。

## 决策

使用 JWT (JSON Web Token) 而非 Session

## 理由

### 优点
1. **无状态**：服务器不需要存储 Session
2. **可扩展**：适合分布式部署
3. **跨域友好**：可以用于多个前端应用

### 缺点
1. **无法主动失效**：Token 在有效期内始终有效
2. **Token 较大**：包含用户信息

## 实现细节

- **密钥**：存储在环境变量 `SECRET`
- **有效期**：7 天
- **Payload**：`{ email, id, username }`
- **算法**：HS256

## 安全注意事项

⚠️ **重要**：
- 不要在 JWT 中存储敏感信息（如密码）
- 定期轮换密钥
- HTTPS only
```

---

#### 4.2 配置 Gemini API

**操作**：
```
1. 打开 VS Code 设置
2. 搜索 "VibeCoding"
3. 输入 Gemini API Key
   （获取地址：https://aistudio.google.com/apikey）
4. 保存
```

**或使用命令**：
```
命令面板 → "VibeCoding: Configure Gemini API"
  → 输入 API Key
  → 自动创建 File Search Store
  → 完成！
```

---

#### 4.3 自动索引文档

**操作**：
```
保存文档后，插件自动：
1. 检测文件变更
2. 上传到 Gemini
3. 等待索引完成
```

**状态栏显示**：
```
☁️ 正在上传 architecture.md...
⏳ 索引中...
✅ 已索引 2 个文档
```

---

#### 4.4 使用智能问答

**场景 A：询问架构问题**

**操作**：
```
命令面板 → "VibeCoding: Ask Documents"
输入："这个项目使用什么认证机制？"
```

**Gemini 回复**（基于文档）：
```
根据项目决策文档¹，这个项目使用 JWT (JSON Web Token) 作为认证机制。

**选择理由**：
1. 无状态：服务器不需要存储 Session
2. 可扩展：适合分布式部署
3. 跨域友好：可以用于多个前端应用

**实现细节**：
- 有效期：7 天
- Token 在 Header 中传递：`Authorization: Token <jwt>`
- 算法：HS256

**安全注意事项**：
⚠️ 不要在 JWT 中存储敏感信息（如密码）

---
引用来源：
¹ decisions/001-auth-strategy.md [查看源文档 →]
```

---

**场景 B：编辑代码时自动提示**

**操作**：
```
1. 打开 src/user/user.service.ts
2. 鼠标悬停在 UserService 类上
```

**悬浮提示显示**：
```
📦 UserService (Class)
📄 src/user/user.service.ts:15-120

💭 观察记录 (1)
  • ⚠️ findOne 方法没有缓存，高并发场景可能有性能问题

📄 相关文档（来自 Knowledge/architecture.md）:
  "UserService 负责用户注册、登录、更新等核心业务逻辑。
   属于业务层，不应包含 HTTP 相关代码..."
  [查看完整文档 →]
```

---

#### 4.5 生成增强版 Cursor Rules

**操作**：
```
命令面板 → "Knowledge: Generate Cursor Rules"
```

**生成的 .cursorrules**（增强版，包含文档内容）：

```markdown
# NestJS RealWorld Example App

## 项目架构（来自 architecture.md）

### 三层架构
- **表现层 (Controllers)**: 处理 HTTP 请求，不包含业务逻辑
- **业务层 (Services)**: 包含所有业务逻辑
- **数据层 (Entities)**: 数据模型和数据库访问

### 核心服务
- **UserService**: 用户注册、登录、更新
- **ArticleService**: 文章 CRUD、点赞逻辑
- **CommentService**: 评论管理

## 技术决策（来自 decisions/）

### 认证机制
- **决策**: 使用 JWT (JSON Web Token)
- **理由**: 无状态、可扩展、跨域友好
- **有效期**: 7 天
- **⚠️ 安全注意**: 不要在 JWT 中存储敏感信息

## 编码规范

### Controller 层
```typescript
// ✅ 正确：只处理请求响应
@Post()
create(@Body() dto: CreateArticleDto) {
  return this.articleService.create(dto);
}

// ❌ 错误：包含业务逻辑
@Post()
create(@Body() dto: CreateArticleDto) {
  // 不要在这里写业务逻辑！
  if (dto.title.length < 5) { ... }
}
```

### Service 层
```typescript
// ✅ 正确：使用依赖注入
constructor(
  private readonly userService: UserService,
  private readonly articleRepo: Repository<Article>
) {}

// ❌ 错误：直接 new
const userService = new UserService();
```

## 已知问题和注意事项

⚠️ **性能问题**（来自知识图谱观察）:
- UserService.findOne 没有缓存，高并发场景需要注意

⚠️ **安全注意**（来自决策文档）:
- JWT 不要存储敏感信息
- 生产环境必须使用 HTTPS

## 快速参考

- **新增 API**: 在对应 Controller 中添加路由
- **新增业务逻辑**: 在 Service 中实现
- **数据库操作**: 使用 Repository 模式
- **认证保护**: 使用 @UseGuards(AuthGuard) 装饰器
```

**效果**：
- Cursor AI 自动学习项目架构
- AI 知道编码规范
- AI 了解已知问题和注意事项
- 开发效率提升 3-5 倍

---

### 第五部分：团队协作演示（5 分钟）

#### 5.1 提交到 Git

**操作**：
```bash
# 1. 提交知识图谱
git add .vscode/.knowledge/
git commit -m "feat: 添加项目知识图谱"

# 2. 提交知识库文档
git add Knowledge/
git commit -m "docs: 添加架构文档和技术决策"

# 3. 提交 Cursor Rules（可选）
git add .cursorrules
git commit -m "docs: 添加 Cursor AI 配置"

# 4. 推送
git push
```

---

#### 5.2 团队成员同步

**操作**：
```bash
# 其他开发者
git pull

# 插件自动：
# 1. 检测到新的知识图谱数据
# 2. 检测到新的 Knowledge/ 文档
# 3. 自动上传文档到 Gemini（如果配置了共享 Store）
# 4. 所有人都能访问相同的知识库
```

**效果**：
- ✅ 知识图谱同步
- ✅ 文档自动索引
- ✅ 团队知识共享
- ✅ 新人快速上手

---

## 🎯 预期效果总结

### 对于新开发者

#### 没有 VibeCoding
```
第 1 天：阅读代码，不知道从哪里看起
第 2 天：理解 User 模块
第 3 天：理解 Article 模块
第 4 天：理解模块间关系
第 5 天：开始写代码

耗时：5 天才能上手
```

#### 使用 VibeCoding
```
第 1 天上午：
  - 查看知识图谱（30 分钟）
  - 让 AI 基于图谱解释架构（30 分钟）
  
第 1 天下午：
  - 阅读关键代码（2 小时）
  - 开始写代码（1 小时）

耗时：1 天即可上手
效率提升：5 倍
```

---

### 对于重构任务

#### 没有 VibeCoding
```
1. 全局搜索调用点（10 分钟）
2. 手动检查每个调用（30 分钟）
3. 担心遗漏某些调用
4. 小心翼翼地修改
5. 测试（1 小时）
6. 发现遗漏，再次修改

耗时：2-3 小时
风险：高
```

#### 使用 VibeCoding
```
1. 查看依赖链（1 分钟）
2. 看到所有调用点和影响范围
3. 复制上下文给 AI 生成修改方案（5 分钟）
4. 按 AI 建议修改（30 分钟）
5. 测试（30 分钟）

耗时：1 小时
风险：低
效率提升：2-3 倍
```

---

### 对于 AI 辅助开发

#### 没有知识图谱
```
开发者: "帮我优化 UserService 的性能"

AI: "我需要先看看 UserService 的代码..."
    [需要手动复制代码]
    
开发者: [复制代码]

AI: "这个方法被哪些地方调用？"
    
开发者: [再次搜索和复制]

效率：低，需要反复复制粘贴上下文
```

#### 使用 VibeCoding
```
开发者: [复制知识图谱上下文]
       "帮我优化 UserService 的性能"

AI: [一次性获得完整上下文]
    "我看到 UserService 被 2 处调用，
     已有性能问题标记，建议..."
     
开发者: [直接采纳建议]

效率：高，AI 一次性理解完整上下文
准确度：显著提升
```

---

### 对于团队协作

#### 没有知识图谱
```
场景：新人询问"为什么使用 JWT？"

老员工: "让我想想...当时是因为..."
       [口头解释，可能记不清]
       
新人: "能给我看看相关代码吗？"

老员工: [花时间找代码和文档]

知识传承：依赖口头交流，容易遗失
```

#### 使用 VibeCoding
```
场景：新人询问"为什么使用 JWT？"

新人: [打开 Knowledge/decisions/001-auth-strategy.md]
      [或者问 AI："为什么使用 JWT？"]
      
AI: "根据技术决策文档，使用 JWT 的原因是..."
    [附带完整的决策背景和理由]

知识传承：文档化、可追溯、永不遗失
```

---

## 📊 ROI 分析（投资回报率）

### 时间投入

**初期投入**：
- 标记核心实体：30 分钟（10-15 个实体）
- 建立关系：20 分钟（20-30 个关系）
- 添加观察记录：10 分钟
- 创建文档：1 小时（架构文档、决策文档）
- **总计**：约 2 小时

**日常维护**：
- 新功能添加实体：5 分钟/功能
- 添加观察记录：2 分钟/次
- **总计**：几乎零成本（自动化）

---

### 收益

**新人 onboarding**：
- 传统方式：5 天
- 使用 VibeCoding：1 天
- **节省时间**：4 天 × 8 小时 = 32 小时

**AI 辅助开发效率**：
- 传统方式：需要反复解释上下文
- 使用 VibeCoding：一次性提供完整上下文
- **效率提升**：3-5 倍

**重构风险降低**：
- 传统方式：可能遗漏影响点
- 使用 VibeCoding：清晰显示所有依赖
- **质量提升**：显著

**团队知识沉淀**：
- 传统方式：经验散落在聊天记录
- 使用 VibeCoding：知识永久保存
- **价值**：无价

---

## 🎓 最佳实践建议

### 1. 渐进式采用

**不要一开始就标记所有代码**，而是：
```
Week 1: 标记 5 个核心实体（User, Article 相关）
Week 2: 添加 10 个关系
Week 3: 添加观察记录和文档
Week 4: 全面使用
```

### 2. 关注核心模块

**优先标记**：
- ✅ 核心业务逻辑（Services）
- ✅ 频繁修改的代码
- ✅ 复杂的依赖关系

**可以忽略**：
- ❌ 简单的工具函数
- ❌ 配置文件
- ❌ 测试代码（除非特别重要）

### 3. 观察记录要具体

**❌ 不好的观察**：
```
"这个方法有问题"
```

**✅ 好的观察**：
```
"⚠️ 性能问题：findOne 方法在高并发场景（>1000 QPS）
响应时间超过 500ms。建议添加 Redis 缓存。
测试环境复现：运行 load-test.sh"
```

### 4. 文档保持更新

**建议**：
- 重大架构变更 → 更新 `architecture.md`
- 技术决策 → 新增 `decisions/xxx.md`
- 编码规范 → 更新 `guides/coding-style.md`

### 5. 利用 Gemini 的强大能力

**除了文档，还可以索引**：
- API 文档（Swagger/OpenAPI）
- 测试用例（作为使用示例）
- 第三方库的使用说明
- 会议记录和讨论总结

---

## 🚀 后续扩展

### 阶段二功能（即将到来）

- [ ] **自动代码解析**：自动识别函数、类、接口
- [ ] **自动建立关系**：自动分析调用关系
- [ ] **可视化图谱**：React Flow 图形展示
- [ ] **更多 AI 集成**：与 Cursor、GitHub Copilot 深度集成

### 社区贡献

欢迎贡献：
- 更多演示案例
- 最佳实践总结
- 集成第三方工具
- 新功能建议

---

## 📞 获取帮助

- **项目主页**：https://github.com/yourusername/vibecoding
- **问题反馈**：[GitHub Issues](https://github.com/yourusername/vibecoding/issues)
- **演示项目**：https://github.com/lujakob/nestjs-realworld-example-app

---

### 第六部分：需求文档自动转换演示（10 分钟）🆕

#### 6.1 准备工作（2 分钟）

**前置条件**：
```bash
# 确保已安装 Python 3.10+
python --version

# 安装 MarkItDown
pip install 'markitdown[all]'
```

**创建 specs 文件夹**：
```bash
# 在 NestJS RealWorld 项目根目录
mkdir specs
```

**准备演示文档**（模拟真实场景）：

创建以下测试文件（可以使用实际文档或创建简单示例）：

1. **specs/API-Specification.md**（临时创建一个示例，后续转为 DOCX）
   ```markdown
   # RealWorld API 规范

   ## 用户接口

   ### POST /api/users/login
   - 描述：用户登录
   - 请求体：
     ```json
     {
       "user": {
         "email": "test@example.com",
         "password": "password"
       }
     }
     ```
   - 响应：JWT Token
   
   ### GET /api/user
   - 描述：获取当前用户信息
   - 需要认证：是
   - 响应：用户对象
   ```

2. **specs/test-scenarios.txt**（纯文本格式）
   ```txt
   测试场景清单
   
   1. 用户注册流程
      - 输入邮箱和密码
      - 验证邮箱格式
      - 创建用户账号
      
   2. 用户登录流程
      - 输入凭据
      - 验证密码
      - 返回 JWT Token
   
   3. 文章创建流程
      - 需要登录
      - 填写标题和内容
      - 发布文章
   ```

---

#### 6.2 检测和安装 MarkItDown（2 分钟）

**操作**：
```
步骤 1：插件启动时自动检测
  ↓
VS Code 显示通知：
  "✅ 检测到 MarkItDown v0.0.1"
  
（如果未安装）
VS Code 显示通知：
  "⚠️ 未检测到 MarkItDown，需要安装才能转换需求文档"
  [立即安装] [稍后]
  ↓
点击"立即安装"
  ↓
状态栏显示：正在安装 MarkItDown...
  ↓
命令行执行：pip install 'markitdown[all]'
  ↓
安装完成通知：✅ MarkItDown 安装成功！
```

**手动检查版本**（可选）：
```bash
markitdown --version
# 输出：markitdown 0.0.1
```

---

#### 6.3 批量转换演示（3 分钟）

**操作**：
```
步骤 1：命令面板
  Ctrl+Shift+P → "VibeCoding: Convert Specs to Markdown"
  
步骤 2：插件扫描 specs/ 文件夹
  找到 2 个文件：
  - API-Specification.md
  - test-scenarios.txt
  
步骤 3：显示确认对话框
  "找到 2 个文件，开始批量转换？"
  [确定] [取消]
  
步骤 4：开始转换
  状态栏显示：
  ☁️ 正在转换: API-Specification.md
  
步骤 5：转换完成
  通知：
  ✅ 转换成功: API-Specification.md → Knowledge/API-Specification.md (0.5s)
  ✅ 转换成功: test-scenarios.txt → Knowledge/test-scenarios.md (0.2s)
  
步骤 6：查看结果
  打开 Knowledge/ 文件夹：
  Knowledge/
  ├── API-Specification.md     # 已转换
  └── test-scenarios.md        # 已转换
```

**预期效果**：
```markdown
<!-- Knowledge/API-Specification.md -->
# RealWorld API 规范

## 用户接口

### POST /api/users/login
- 描述：用户登录
- 请求体：
  ```json
  {
    "user": {
      "email": "test@example.com",
      "password": "password"
    }
  }
  ```
...
```

---

#### 6.4 自动监听演示（3 分钟）

**操作**：
```
步骤 1：启动自动监听
  命令面板 → "VibeCoding: Auto-Watch Specs Folder"
  ↓
通知：👁️ 开始监听 specs/ 文件夹
  ↓
状态栏显示：👁️ 正在监听 specs/
```

**创建新文件测试**：
```
步骤 2：在 specs/ 创建新文件
  右键 specs/ → 新建文件 → design-decisions.md
  
步骤 3：添加内容
  # 设计决策

  ## 决策 001: 使用 TypeORM
  
  **日期**: 2024-11-07
  **决策者**: Tech Team
  
  **背景**:
  需要选择一个 Node.js ORM 框架
  
  **决策**:
  使用 TypeORM
  
  **原因**:
  1. TypeScript 原生支持
  2. 装饰器语法简洁
  3. 社区活跃，文档完善
  
步骤 4：保存文件（Ctrl+S）
  ↓
插件自动检测到文件变更
  ↓
状态栏显示：☁️ 正在转换: design-decisions.md
  ↓
转换完成通知：
  ✅ 转换成功: design-decisions.md → Knowledge/design-decisions.md (0.3s)
  ↓
Gemini 自动索引（后台进行）：
  ☁️ 正在上传到 Gemini...
  ✅ 已索引 1 个文档
```

**修改文件测试**：
```
步骤 5：修改 design-decisions.md
  添加新内容：
  
  ## 决策 002: 使用 JWT 认证
  
  **日期**: 2024-11-07
  **决策**: 使用 JWT 而非 Session
  
步骤 6：保存文件
  ↓
插件检测到文件哈希变更
  ↓
自动重新转换
  ↓
通知：✅ 已更新 Knowledge/design-decisions.md
  ↓
Gemini 自动重新索引
```

**删除文件测试**：
```
步骤 7：删除 specs/test-scenarios.txt
  ↓
VS Code 显示确认对话框：
  "源文件 test-scenarios.txt 已删除，
   是否同时删除转换后的 test-scenarios.md？"
  [是] [否]
  ↓
点击"是"
  ↓
通知：✅ 已删除 Knowledge/test-scenarios.md
```

---

#### 6.5 高级功能演示（可选，如果有真实文档）

**PDF 转换演示**（如果有 PDF 文件）：
```
步骤 1：复制一个 PDF 文件到 specs/
  例如：specs/Product-Requirements.pdf
  
步骤 2：自动监听检测到新文件
  ↓
调用 MarkItDown 转换
  ↓
状态栏显示：☁️ 正在转换: Product-Requirements.pdf
  （PDF 转换可能需要 5-10 秒）
  ↓
转换完成：
  ✅ 转换成功: Product-Requirements.pdf → Knowledge/Product-Requirements.md (8.5s)
  
步骤 3：查看转换结果
  打开 Knowledge/Product-Requirements.md
  → 查看是否保留了标题、列表、表格等结构
```

**Excel 转换演示**（如果有 Excel 文件）：
```
步骤 1：创建简单的 Excel 文件
  specs/feature-list.xlsx
  
  内容：
  | 功能ID | 功能名称 | 优先级 | 状态 |
  | F001 | 用户注册 | P0 | 完成 |
  | F002 | 用户登录 | P0 | 完成 |
  | F003 | 文章发布 | P1 | 开发中 |
  
步骤 2：自动转换
  ↓
转换结果（Knowledge/feature-list.md）：
  
  # feature-list
  
  ## Sheet1
  
  | 功能ID | 功能名称 | 优先级 | 状态 |
  |--------|---------|--------|------|
  | F001 | 用户注册 | P0 | 完成 |
  | F002 | 用户登录 | P0 | 完成 |
  | F003 | 文章发布 | P1 | 开发中 |
  
  ✅ 表格结构完美保留！
```

---

#### 6.6 与 AI 协同演示（2 分钟）

**场景：询问设计决策**

```
步骤 1：打开 Cursor AI
  
步骤 2：提问
  "为什么这个项目使用 TypeORM？"
  
步骤 3：插件后台工作
  - 检索 Knowledge/design-decisions.md
  - 提取相关内容
  - 调用 Gemini File Search API
  
步骤 4：AI 回复（基于转换后的文档）
  "根据团队的设计决策文档¹，选择 TypeORM 的原因是：
   
   1. **TypeScript 原生支持**：与项目技术栈完美匹配
   2. **装饰器语法简洁**：代码更易读易维护
   3. **社区活跃，文档完善**：降低学习成本
   
   该决策由 Tech Team 在 2024-11-07 做出。
   
   ---
   引用来源：
   ¹ design-decisions.md - 决策 001"
```

**场景：根据 API 规范生成代码**

```
步骤 1：提问
  "根据 API 规范，帮我实现用户登录接口"
  
步骤 2：AI 检索 Knowledge/API-Specification.md
  
步骤 3：AI 生成代码（符合规范）
  "根据 API 规范文档¹，登录接口应该这样实现：
   
   ```typescript
   @Post('/users/login')
   async login(@Body() loginDto: LoginDto) {
     const { email, password } = loginDto.user;
     
     // 验证用户凭据
     const user = await this.authService.validateUser(email, password);
     
     // 生成 JWT Token
     const token = await this.authService.generateToken(user);
     
     return {
       user: {
         ...user,
         token
       }
     };
   }
   ```
   
   请求体格式符合文档定义：
   ```json
   {
     "user": {
       "email": "test@example.com",
       "password": "password"
     }
   }
   ```
   
   ---
   引用来源：
   ¹ API-Specification.md - POST /api/users/login"
```

---

### 演示效果总结

#### 转换前 vs 转换后

**转换前** ❌：
```
specs/
├── Product-Requirements.pdf    # AI 无法读取
├── API-Design.docx             # AI 无法读取
├── feature-list.xlsx           # AI 无法读取
└── design-decisions.md         # AI 可以读取，但未索引
```

**转换后** ✅：
```
Knowledge/
├── Product-Requirements.md     # ✅ AI 可读取 + 已索引
├── API-Design.md              # ✅ AI 可读取 + 已索引
├── feature-list.md            # ✅ AI 可读取 + 已索引（表格保留）
└── design-decisions.md        # ✅ AI 可读取 + 已索引
```

#### 效率对比

**手动管理** ❌：
- 📄 需求文档散落在邮件、云盘
- 🤷 AI 无法理解 PDF/Word/Excel
- 🔄 需求更新后需要手动复制给 AI
- 🕐 查找信息耗时 10+ 分钟

**自动转换** ✅：
- 📁 统一存放在 specs/ 文件夹
- 🤖 AI 直接理解转换后的 Markdown
- 🔄 需求更新自动同步（监听 + 增量转换）
- ⚡ AI 2 秒内检索到相关需求
- 💰 转换免费（本地 Python CLI）

---

### 完整工作流演示

```
产品经理提供 PRD
  → 保存到 specs/PRD-v1.0.pdf
  ↓
VibeCoding 自动转换
  → 输出 Knowledge/PRD-v1.0.md
  ↓
Gemini 自动索引
  → 文档可被 AI 检索
  ↓
开发者询问 AI
  "用户资料页面需要哪些字段？"
  ↓
AI 基于 PRD 回答
  "根据 PRD v1.0 第 3.2 节，需要以下字段..."
  ↓
开发者直接实现
  → 符合需求规范
  ↓
产品经理更新 PRD
  → 替换 specs/PRD-v2.0.pdf
  ↓
VibeCoding 自动重新转换
  → 更新 Knowledge/PRD-v2.0.md
  ↓
Gemini 自动重新索引
  → AI 自动使用最新需求
  ↓
完美协作！🎉
```

---

### 常见问题解答

**Q1: MarkItDown 安装失败怎么办？**

A: 检查 Python 环境：
```bash
# 检查 Python 版本（需要 3.10+）
python --version

# 手动安装
pip install 'markitdown[all]'

# 如果使用 pip3
pip3 install 'markitdown[all]'

# 如果遇到权限问题
pip install --user 'markitdown[all]'
```

**Q2: 转换速度慢怎么办？**

A: 
- PDF 转换通常需要 5-10 秒（正常）
- 大文件（> 10MB）可能需要更长时间
- 建议：先转换小文件测试，确认功能正常

**Q3: 转换后的 Markdown 格式不理想？**

A: 
- MarkItDown 会尽力保留原始结构
- 复杂的 PDF 排版可能无法完美转换
- 建议：转换后手动微调格式
- 插件会自动清理多余空行

**Q4: 可以转换图片中的文字吗？**

A: 
- 可以！MarkItDown 支持 OCR（需要额外依赖）
- 安装完整版：`pip install 'markitdown[all]'`
- 支持格式：PNG, JPG, JPEG

**Q5: 可以转换音频吗？**

A:
- 可以！MarkItDown 支持语音转文字
- 支持格式：MP3, WAV
- 需要网络连接（使用在线语音识别服务）

---

**现在开始你的 VibeCoding 之旅吧！** 🎉

