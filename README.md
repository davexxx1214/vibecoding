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

### 6. 需求文档自动转换 🆕

**核心理念**：将各种格式的需求文档自动转换为 Markdown，便于 AI 理解

#### 使用场景

在软件开发过程中，需求文档通常以各种格式存在：
- 📄 **PDF**：产品 PRD、设计规范
- 📊 **Excel**：功能清单、测试用例
- 📝 **Word**：详细需求文档
- 🖼️ **图片**：UI 设计稿、流程图

这些文档对 AI 来说难以直接理解。VibeCoding 提供自动转换功能，将它们转为 Markdown 格式。

#### 工作流程

```
specs/                          # 原始需求文档文件夹
├── PRD-v1.0.pdf               # 产品需求文档
├── API-Design.docx            # API 设计文档
├── test-cases.xlsx            # 测试用例
└── ui-mockup.png              # UI 设计图

      ↓ 自动转换

Knowledge/                      # 转换后的 Markdown
├── PRD-v1.0.md                # 自动生成
├── API-Design.md              # 自动生成
├── test-cases.md              # 自动生成
└── ui-mockup.md               # 自动生成（含 OCR 文字）
```

#### 技术实现

**方案 A：使用 MarkItDown（推荐）** ⭐

[MarkItDown](https://github.com/microsoft/markitdown) 是 Microsoft 开发的 Python 工具，专门用于将各种文件转换为 Markdown。

**支持格式**：
- 📄 PDF
- 📝 Word (DOCX)
- 📊 Excel (XLSX, XLS)
- 🎯 PowerPoint (PPTX)
- 🖼️ 图片（支持 OCR 文字识别）
- 🎵 音频（支持语音转文字）
- 🌐 HTML
- 📦 ZIP（自动解压处理）
- 🎬 YouTube（获取字幕）

**集成方式**：

```typescript
// src/specs/converter.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SpecsConverter {
  /**
   * 检测 MarkItDown 是否已安装
   */
  async hasMarkItDown(): Promise<boolean> {
    try {
      await execAsync('markitdown --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 转换单个文件
   */
  async convert(inputPath: string, outputPath: string): Promise<void> {
    const command = `markitdown "${inputPath}" -o "${outputPath}"`;
    await execAsync(command);
  }

  /**
   * 批量转换 specs/ 文件夹
   */
  async convertAll(specsDir: string, knowledgeDir: string): Promise<void> {
    const files = await fs.readdir(specsDir);
    
    for (const file of files) {
      const inputPath = path.join(specsDir, file);
      const outputPath = path.join(
        knowledgeDir, 
        path.basename(file, path.extname(file)) + '.md'
      );
      
      await this.convert(inputPath, outputPath);
    }
  }
}
```

**安装 MarkItDown**：

```bash
# 用户需要先安装 Python 3.10+ 和 MarkItDown
pip install 'markitdown[all]'
```

**优点**：
- ✅ 支持格式最全（PDF、Word、Excel、PPT、图片、音频等）
- ✅ 输出质量高（保留表格、列表、链接等结构）
- ✅ Microsoft 官方维护，稳定可靠
- ✅ 支持 OCR 和语音转文字
- ✅ 命令行调用简单

**缺点**：
- ❌ 需要用户安装 Python 环境
- ❌ 依赖外部工具

---

**方案 B：纯 Node.js 实现（备选）**

如果用户没有 Python 环境，降级使用 Node.js 库：

```typescript
// src/specs/converterNode.ts
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export class NodeSpecsConverter {
  /**
   * 转换 PDF
   */
  async convertPdf(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return this.formatAsMarkdown(data.text);
  }

  /**
   * 转换 Word (DOCX)
   */
  async convertDocx(filePath: string): Promise<string> {
    const result = await mammoth.convertToMarkdown({ path: filePath });
    return result.value;
  }

  /**
   * 转换 Excel
   */
  async convertExcel(filePath: string): Promise<string> {
    const workbook = XLSX.readFile(filePath);
    let markdown = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      markdown += `## ${sheetName}\n\n`;
      markdown += XLSX.utils.sheet_to_markdown(sheet);
      markdown += '\n\n';
    });
    
    return markdown;
  }
}
```

**需要安装的 npm 包**：

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.7.0",
    "xlsx": "^0.18.5"
  }
}
```

**优点**：
- ✅ 无需 Python 依赖
- ✅ 纯 TypeScript，类型安全
- ✅ 打包体积可控

**缺点**：
- ❌ 功能有限（不支持 PPT、音频、OCR 等）
- ❌ 需要集成多个库
- ❌ 输出格式可能不如 MarkItDown 统一

---

**方案 C：混合方案（最佳实践）** 🌟

优先使用 MarkItDown，检测不到则降级到 Node.js 库：

```typescript
// src/specs/smartConverter.ts
export class SmartConverter {
  private markitdownConverter: SpecsConverter;
  private nodeConverter: NodeSpecsConverter;

  async convert(filePath: string, outputPath: string): Promise<void> {
    // 1. 优先尝试 MarkItDown
    if (await this.markitdownConverter.hasMarkItDown()) {
      await this.markitdownConverter.convert(filePath, outputPath);
      return;
    }

    // 2. 降级到 Node.js 库
    const ext = path.extname(filePath).toLowerCase();
    let markdown: string;

    switch (ext) {
      case '.pdf':
        markdown = await this.nodeConverter.convertPdf(filePath);
        break;
      case '.docx':
        markdown = await this.nodeConverter.convertDocx(filePath);
        break;
      case '.xlsx':
      case '.xls':
        markdown = await this.nodeConverter.convertExcel(filePath);
        break;
      default:
        throw new Error(`不支持的文件格式: ${ext}`);
    }

    await fs.writeFile(outputPath, markdown, 'utf-8');
  }
}
```

#### 自动化流程

**文件监听**：

```typescript
// src/specs/watcher.ts
export class SpecsWatcher {
  private watcher: FSWatcher;

  startWatching(specsDir: string, knowledgeDir: string): void {
    this.watcher = fs.watch(specsDir, async (eventType, filename) => {
      if (eventType === 'change' || eventType === 'rename') {
        const inputPath = path.join(specsDir, filename);
        const outputPath = path.join(
          knowledgeDir,
          path.basename(filename, path.extname(filename)) + '.md'
        );

        await converter.convert(inputPath, outputPath);
        
        vscode.window.showInformationMessage(
          `✅ 已转换: ${filename} → ${path.basename(outputPath)}`
        );
      }
    });
  }
}
```

**用户命令**：

- `VibeCoding: Convert Specs to Markdown`：手动触发批量转换
- `VibeCoding: Auto-Watch Specs Folder`：启动自动监听
- `VibeCoding: Install MarkItDown`：自动安装 MarkItDown（调用 pip）

#### 完整工作流

```
1. 用户创建 specs/ 文件夹
     ↓
2. 放入需求文档（PDF、Word、Excel 等）
     ↓
3. 执行命令或自动监听
     ↓
4. 插件自动转换为 Markdown
     ↓
5. 输出到 Knowledge/ 文件夹
     ↓
6. Gemini File Search 自动索引（下一功能）
     ↓
7. AI 可以直接理解需求文档内容
```

#### 实际应用示例

**场景：新功能开发**

```
步骤 1：产品提供 PRD
  specs/user-profile-feature.pdf

步骤 2：VibeCoding 自动转换
  Knowledge/user-profile-feature.md

步骤 3：开发时询问 AI
  "根据 PRD，用户资料页面需要哪些字段？"

步骤 4：AI 基于转换后的 Markdown 回答
  "根据需求文档第 3.2 节，用户资料页面需要：
   • 基本信息：姓名、头像、个人简介
   • 联系方式：邮箱、手机号
   • 隐私设置：是否公开资料..."
```

#### 高级特性

- 📊 **表格保留**：Excel 表格转为 Markdown 表格
- 🖼️ **图片 OCR**：提取图片中的文字（需 MarkItDown + 配置）
- 🎯 **智能分块**：长文档自动分章节
- 🔄 **增量更新**：只转换修改过的文件
- 📋 **格式验证**：转换后检查 Markdown 语法
- 🏷️ **元数据提取**：保留文档标题、作者、创建时间

---

### 7. 持久知识库（托管式 RAG）🆕

**核心理念**：将项目文档（包括转换后的需求文档）转化为 AI 可访问的知识库

**技术方案**：使用 **Google Gemini File Search API**（完全托管的 RAG 系统）

#### 为什么选择 Gemini File Search？

✅ **完全托管**：无需自建向量数据库和嵌入模型  
✅ **成本极低**：存储和查询免费，只在初次索引时付费（$0.15/百万 tokens）  
✅ **开箱即用**：自动处理分块、嵌入、检索全流程  
✅ **内置引用**：自动标注信息来源，可验证性强  
✅ **格式丰富**：支持 PDF, DOCX, TXT, JSON, 各类代码文件  
✅ **高性能**：使用最新的 Gemini Embedding 模型，语义理解能力强

#### 功能概述

在项目根目录创建 `Knowledge/` 文件夹，存放各类文档：

```
项目根目录/
├── Knowledge/               # 持久知识库文件夹
│   ├── architecture.md      # 架构设计文档
│   ├── api-specs.pdf        # API 规范
│   ├── decisions/           # 设计决策
│   │   ├── 001-use-redis.md
│   │   └── 002-auth-strategy.md
│   ├── guides/              # 开发指南
│   │   ├── setup.md
│   │   └── coding-style.md
│   └── references/          # 参考资料
│       ├── database-schema.sql
│       └── third-party-api.json
```

**插件自动处理**：
1. 📁 **自动监听** Knowledge 文件夹的文件变更
2. ☁️ **上传到 Gemini**：自动上传文档到 File Search Store
3. 🤖 **智能索引**：Google 自动处理分块和嵌入生成
4. 🔍 **语义搜索**：根据代码上下文调用 File Search API 检索
5. 📝 **上下文注入**：自动将相关文档片段注入 AI 对话
6. 🔗 **引用追踪**：显示信息来源，支持跳转到源文档

#### 支持的文件格式

- 📝 **文档**：Markdown (.md), 纯文本 (.txt), PDF, DOCX
- 💻 **代码**：Python, JavaScript, TypeScript, Java, Go 等常见编程语言
- 📊 **数据**：JSON, YAML, CSV
- 🎨 **其他**：详见 [Gemini 文档](https://ai.google.dev/gemini-api/docs/file-search)

#### 使用场景

**场景 1：架构文档自动注入**
```
你在编辑 UserService.ts
  ↓
插件检测到相关性
  ↓
自动检索 Knowledge/architecture.md 中的"用户服务架构"部分
  ↓
AI 对话时自动包含架构文档上下文
```

**场景 2：设计决策追溯**
```
你询问 AI："为什么使用 Redis？"
  ↓
插件从 Knowledge/decisions/001-use-redis.md 检索
  ↓
AI 基于文档回答：
"根据团队 2024-10-15 的设计决策文档，选择 Redis 是因为..."
```

**场景 3：API 规范参考**
```
你正在实现新的 API
  ↓
插件检索 Knowledge/api-specs.pdf
  ↓
AI 提示："根据 API 规范第 3.2 节，应该返回以下格式..."
```

#### 技术特性

- ✅ **零运维**：完全托管，无需配置服务器或数据库
- ✅ **自动同步**：文件修改后自动重新索引
- ✅ **语义理解**：Gemini Embedding 模型，理解查询意图
- ✅ **引用追踪**：自动标注信息来源和引用位置
- ✅ **成本优化**：存储和查询免费，仅初次索引收费
- ✅ **高性能**：并行查询，2 秒内返回结果
- ✅ **多模态支持**：支持文本、代码、结构化数据
- ✅ **API 密钥管理**：可配置个人或团队 API 密钥

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

### 第二阶段：AI 协同增强 🔥 **进行中**

**目标**：让知识图谱和文档成为 AI 编程的"外部记忆"

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

#### 2.4 需求文档自动转换 🆕🔥

**目标**：将各种格式的需求文档自动转换为 Markdown

**技术方案**：优先使用 MarkItDown，降级到 Node.js 库

##### 2.4.1 MarkItDown 集成
- [ ] **检测 MarkItDown 安装**
  - 启动时检测 `markitdown --version`
  - 提示用户安装（如未安装）
  - 提供一键安装命令（调用 pip）
  
- [ ] **命令行调用封装**
  - 使用 `child_process.exec` 调用 MarkItDown
  - 错误处理和超时控制
  - 进度提示（转换大文件时）

##### 2.4.2 Node.js 备用方案
- [ ] **PDF 转换**
  - 使用 `pdf-parse` 提取文字
  - 保留基本段落结构
  - 格式化为 Markdown
  
- [ ] **Word 转换**
  - 使用 `mammoth` 转换 DOCX
  - 保留标题、列表、表格
  - 支持图片提取（可选）
  
- [ ] **Excel 转换**
  - 使用 `xlsx` 读取表格
  - 每个 Sheet 转为 Markdown 表格
  - 支持公式展示

##### 2.4.3 智能转换器
- [ ] **混合方案**
  - 优先尝试 MarkItDown
  - 检测失败则降级到 Node.js 库
  - 记录转换方式（日志）
  
- [ ] **格式检测**
  - 根据文件扩展名选择转换器
  - 支持 MIME 类型检测（更可靠）
  - 不支持的格式给出提示

##### 2.4.4 文件监听和自动转换
- [ ] **specs/ 文件夹监听**
  - 使用 FileSystemWatcher 监听 `specs/` 文件夹
  - 检测新增、修改事件
  - 防抖处理（避免频繁转换）
  
- [ ] **自动转换流程**
  - 检测到文件变更 → 自动转换
  - 输出到 `Knowledge/` 文件夹
  - 显示转换进度通知
  - 转换完成后触发索引更新（联动 RAG 系统）

##### 2.4.5 用户命令
- [ ] **手动转换命令**
  - `VibeCoding: Convert Specs to Markdown`：批量转换
  - `VibeCoding: Convert This File`：转换当前文件
  - `VibeCoding: Install MarkItDown`：安装依赖
  
- [ ] **设置选项**
  - 开启/关闭自动监听
  - 选择默认转换器（MarkItDown 或 Node.js）
  - 配置输出路径

##### 2.4.6 高级功能
- [ ] **增量转换**
  - 检查源文件和目标文件的修改时间
  - 只转换变更过的文件
  - 节省时间和资源
  
- [ ] **元数据保留**
  - 提取文档标题、作者、创建时间
  - 添加到 Markdown frontmatter
  - 便于后续检索和管理
  
- [ ] **格式优化**
  - 清理多余空行
  - 统一标题层级
  - 优化表格格式
  - 代码块语法高亮

#### 2.5 持久知识库（托管式 RAG）🆕🔥

**目标**：使用 Google Gemini File Search API 构建项目文档知识库

**技术方案**：完全托管的 RAG 系统，零运维成本

##### 2.4.1 Gemini API 集成
- [ ] **API 配置**
  - VS Code 设置中配置 Gemini API Key
  - 支持个人密钥或团队共享密钥
  - API 密钥安全存储（VS Code Secret Storage）
  - 可选：使用环境变量配置
  
- [ ] **File Search Store 管理**
  - 为每个项目创建独立的 File Search Store
  - Store ID 存储在 `.vscode/settings.json`
  - 支持多项目管理
  - 自动清理不使用的 Store

##### 2.4.2 文档管理
- [ ] **Knowledge 文件夹监听**
  - 使用 VS Code FileSystemWatcher 监听 `Knowledge/` 文件夹
  - 监听文件的新增、修改、删除事件
  - 递归监听所有子文件夹
  - 防抖处理（避免频繁上传）
  
- [ ] **自动上传到 Gemini**
  - 检测文件变更后自动上传
  - 批量上传优化（减少 API 调用）
  - 显示上传进度（状态栏）
  - 错误处理和重试机制
  - 支持大文件分片上传

##### 2.4.3 文档索引管理
- [ ] **本地索引跟踪**
  - SQLite 数据库记录已上传文件
  - 存储文件哈希（用于检测变更）
  - 记录 Gemini 返回的文件 ID
  - 跟踪索引状态（pending/indexed/failed）
  
- [ ] **增量更新**
  - 文件修改后只上传变更的文件
  - 删除文件时自动从 Gemini 删除
  - 智能检测：文件内容变化才重新上传
  - 支持手动重新索引命令

##### 2.4.4 语义搜索与检索
- [ ] **上下文感知搜索**
  - 基于当前编辑的文件名自动生成查询
  - 基于光标位置的实体关联查询
  - 基于用户输入的自然语言查询
  
- [ ] **调用 Gemini File Search API**
  ```typescript
  // 伪代码示例
  const response = await client.models.generate_content({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{
        file_search: {
          file_search_store_names: [store.name]
        }
      }]
    }
  });
  ```
  
- [ ] **结果处理**
  - 解析 Gemini 返回的结果和引用
  - 提取 grounding_metadata 中的来源文档
  - 格式化引用信息
  - 支持跳转到源文档

##### 2.4.5 AI 集成
- [ ] **自动上下文注入**
  - 命令：`Knowledge: Search Documents`（手动搜索）
  - 自动模式：编辑代码时后台检索相关文档
  - 在悬浮提示中显示相关文档片段
  - Cursor 集成：将检索结果注入 `.cursorrules`
  
- [ ] **智能问答**
  - 命令：`Knowledge: Ask Documents`
  - 输入自然语言问题
  - Gemini 基于文档回答
  - 显示引用来源（带链接）
  
- [ ] **文档摘要**
  - 命令：`Knowledge: Summarize Documents`
  - 自动生成整个知识库的摘要
  - 支持按文件夹批量摘要

##### 2.4.6 用户界面
- [ ] **知识库视图**
  - 在侧边栏添加"知识库"树视图
  - 显示 Knowledge/ 文件夹结构
  - 显示每个文件的索引状态：
    - ✅ 已索引（绿色）
    - ⏳ 索引中（橙色）
    - ❌ 索引失败（红色）
  - 右键菜单：重新索引、删除、查看详情
  
- [ ] **搜索面板**
  - 输入框：输入自然语言查询
  - 实时显示搜索结果
  - 显示引用的文档和位置
  - 点击跳转到源文档
  
- [ ] **状态指示器**
  - 状态栏显示：📚 知识库 (5 文档, 15 MB)
  - 上传时显示进度条
  - 通知：✅ 已索引 architecture.md
  - 错误通知：❌ 上传失败，请检查 API 密钥

**验收标准**：
- ✅ 可以一键导出知识图谱供 AI 使用
- ✅ AI 能基于导出的上下文理解项目
- ✅ 开发者能快速将图谱注入 AI 对话
- ✅ Cursor 能读取项目知识图谱
- ✅ **Knowledge 文件夹的文档自动索引**
- ✅ **基于当前代码自动检索相关文档**
- ✅ **语义搜索准确率 >80%**
- ✅ **检索延迟 <500ms**

**时间估计**：3-4 周（含 RAG 系统）

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
| **文档转换（优先）** | MarkItDown (Python CLI) | Microsoft 官方，支持格式最全 |
| **PDF 转换** | pdf-parse (备选) | Node.js 库，无需 Python |
| **Word 转换** | mammoth (备选) | DOCX 转 Markdown |
| **Excel 转换** | xlsx (备选) | 表格转 Markdown |
| **RAG 系统** | Google Gemini File Search API | 托管式 RAG，零运维 |
| **文档索引** | Gemini Embedding Model | 自动处理，无需本地模型 |
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
│   │   ├── observationService.ts     # ✅ 观察记录管理
│   │   └── documentService.ts        # 🔜 文档管理服务（阶段二）
│   ├── providers/
│   │   ├── hoverProvider.ts          # ✅ 悬浮提示
│   │   ├── codeLensProvider.ts       # ✅ CodeLens
│   │   └── treeDataProvider.ts       # ✅ 树视图
│   ├── ui/
│   │   ├── commands/
│   │   │   ├── entityCommands.ts     # ✅ 命令处理器
│   │   │   └── documentCommands.ts   # 🔜 文档命令（阶段二）
│   │   └── webview/
│   │       └── graphView.ts          # 🔜 可视化面板（阶段五）
│   ├── specs/                        # 🔜 需求文档转换（阶段二）
│   │   ├── converter.ts              # MarkItDown 转换器
│   │   ├── converterNode.ts          # Node.js 备用转换器
│   │   ├── smartConverter.ts         # 智能转换器（混合方案）
│   │   ├── watcher.ts                # specs/ 文件夹监听
│   │   └── formatters/               # 格式化工具
│   │       ├── pdfFormatter.ts       # PDF 格式化
│   │       ├── excelFormatter.ts     # Excel 格式化
│   │       └── markdownCleaner.ts    # Markdown 清理优化
│   ├── gemini/                       # 🔜 Gemini API 集成（阶段二）
│   │   ├── client.ts                 # Gemini API 客户端
│   │   ├── fileSearch.ts             # File Search Store 管理
│   │   ├── fileUploader.ts           # 文件上传管理
│   │   └── searchService.ts          # 语义搜索服务
│   ├── utils/
│   │   ├── types.ts                  # ✅ 类型定义
│   │   ├── codeParser.ts             # 🔜 代码解析（阶段三）
│   │   ├── exporter.ts               # 🔜 导出工具（阶段二）
│   │   └── fileWatcher.ts            # 🔜 文件监听工具（阶段二）
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

#### 核心功能数据流
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

#### RAG 系统数据流（阶段二 - 使用 Gemini API）
```
文档变更 (Knowledge/ 文件夹)
  ↓
文件监听器 (FileSystemWatcher)
  ↓
文件上传器 (FileUploader)
  ↓
上传到 Gemini File Search Store (via API)
  ↓
Gemini 自动处理：分块 → 嵌入 → 索引
  ↓
本地记录文件 ID 和状态 (SQLite)

---

用户查询 / 代码编辑
  ↓
上下文提取 (当前文件、光标位置、实体)
  ↓
生成查询 → 调用 Gemini File Search API
  ↓
Gemini 处理：语义搜索 → 相关内容检索 → 生成回答
  ↓
解析结果和引用 (grounding_metadata)
  ↓
上下文注入 → AI 对话 / 悬浮提示 / Cursor Rules
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

### 文档索引表 Schema（阶段二 - Gemini 集成）

#### gemini_files 表（Gemini 文件索引）

```sql
CREATE TABLE gemini_files (
    id TEXT PRIMARY KEY,                -- 本地 UUID
    file_path TEXT NOT NULL UNIQUE,     -- 文件路径（相对于 Knowledge/）
    file_name TEXT NOT NULL,            -- 文件名
    file_type TEXT NOT NULL,            -- 文件类型（md, pdf, docx 等）
    file_size INTEGER,                  -- 文件大小（字节）
    file_hash TEXT NOT NULL,            -- 文件哈希（SHA-256，用于检测变更）
    
    gemini_file_id TEXT,                -- Gemini 返回的 file ID
    gemini_store_id TEXT,               -- 所属的 File Search Store ID
    
    status TEXT DEFAULT 'pending',      -- 状态
                                        -- pending: 等待上传
                                        -- uploading: 上传中
                                        -- indexed: 已索引
                                        -- failed: 失败
    
    error_message TEXT,                 -- 错误信息（如果失败）
    uploaded_at INTEGER,                -- 上传时间戳
    indexed_at INTEGER,                 -- 索引完成时间戳
    
    created_at INTEGER NOT NULL,        -- 创建时间戳
    updated_at INTEGER NOT NULL         -- 更新时间戳
);

-- 索引
CREATE INDEX idx_gemini_files_status ON gemini_files(status);
CREATE INDEX idx_gemini_files_hash ON gemini_files(file_hash);
CREATE INDEX idx_gemini_files_store ON gemini_files(gemini_store_id);
```

#### gemini_stores 表（File Search Store 管理）

```sql
CREATE TABLE gemini_stores (
    id TEXT PRIMARY KEY,                -- 本地 UUID
    store_id TEXT NOT NULL UNIQUE,      -- Gemini 返回的 Store ID
    store_name TEXT,                    -- Store 名称
    project_path TEXT NOT NULL,         -- 项目路径（用于多项目管理）
    file_count INTEGER DEFAULT 0,       -- 文件数量
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_sync_at INTEGER                -- 最后同步时间
);
```

### 存储位置

```
项目根目录/
├── specs/                              # 📁 需求文档文件夹（原始格式，可选 Git 追踪）
│   ├── PRD-v1.0.pdf                   # 产品需求文档
│   ├── API-Design.docx                # API 设计文档
│   ├── test-cases.xlsx                # 测试用例
│   └── ui-mockup.png                  # UI 设计图
├── Knowledge/                          # 📁 知识库文件夹（Markdown 格式，Git 追踪）
│   ├── architecture.md                # 手动创建的架构文档
│   ├── PRD-v1.0.md                    # 自动从 specs/ 转换
│   ├── API-Design.md                  # 自动从 specs/ 转换
│   ├── test-cases.md                  # 自动从 specs/ 转换
│   ├── decisions/
│   └── guides/
└── .vscode/
    ├── settings.json                   # 包含 Gemini Store ID 配置
    └── .knowledge/
        └── graph.sqlite                # 知识图谱 + Gemini 文件索引 (1-10MB)
```

**注意**：
- **specs/ 文件夹**（可选）：
  - 📄 存放原始格式的需求文档（PDF、Word、Excel 等）
  - 🔄 文件变更时自动转换为 Markdown → Knowledge/
  - ⚠️ 是否添加到 Git 取决于团队习惯：
    - ✅ 添加到 Git：团队共享原始文档
    - ❌ 添加到 .gitignore：只共享转换后的 Markdown
  
- **Knowledge/ 文件夹**：
  - ✅ 建议添加到 Git（团队共享文档）
  - 📄 包含手动创建的文档 + 从 specs/ 自动转换的文档
  - 🔄 修改后自动同步到 Gemini
  
- **.vscode/settings.json**：
  ```json
  {
    "vibecoding.geminiStoreId": "projects/xxx/locations/xxx/ragCorpora/xxx"
  }
  ```
  - ✅ 可以添加到 Git（团队共享同一个 Store）
  - ⚠️ 或添加到 `.gitignore`（每个开发者使用独立 Store）
  
- **.vscode/.knowledge/graph.sqlite**：
  - ✅ 建议添加到 Git（共享知识图谱）
  - 📊 包含实体、关系、观察记录
  - 📑 包含 Gemini 文件索引（用于增量更新）

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

### 场景五：持久知识库（RAG 系统）🆕

**问题**：项目有大量设计文档、API 规范、技术决策，AI 无法访问。

**解决方案**：

#### 步骤 1：创建知识库文件夹
```bash
# 在项目根目录
mkdir Knowledge
cd Knowledge

# 添加架构文档
echo "# 系统架构
我们使用微服务架构，包含以下服务：
- UserService: 用户管理
- PaymentService: 支付处理
- NotificationService: 通知服务

## 服务间通信
使用 RabbitMQ 消息队列..." > architecture.md

# 添加设计决策
mkdir decisions
echo "# 决策 001: 为什么选择 Redis

**日期**: 2024-10-15
**决策者**: Tech Team

**背景**:
需要一个高性能的缓存系统支持高并发场景...

**决策**:
选择 Redis 而非 Memcached

**原因**:
1. 支持更丰富的数据结构
2. 支持持久化
3. 性能测试显示比 Memcached 快 30%

**权衡**:
- 内存占用略高
- 需要额外维护..." > decisions/001-use-redis.md
```

#### 步骤 2：配置 Gemini API

**首次使用**：
```
1. 打开 VS Code 设置
2. 搜索 "VibeCoding"
3. 输入 Gemini API Key（获取地址：https://aistudio.google.com/apikey）
4. 保存
```

**或使用命令**：
```
命令面板 → "VibeCoding: Configure Gemini API"
  → 输入 API Key
  → 自动创建 File Search Store
  → 完成！
```

#### 步骤 3：自动索引
```
1. 保存文件后，插件自动检测
2. 状态栏显示：☁️ 正在上传 architecture.md...
3. 上传到 Gemini：⏳ 索引中...
4. 完成后通知：✅ 已索引 2 个文档
```

**技术细节**：
```typescript
// 插件后台自动执行
import { genai } from '@google/generative-ai';

// 1. 上传文件到 File Search Store
const uploadOp = await client.file_search_stores.upload_to_file_search_store({
  file_search_store_name: store.name,
  file: 'Knowledge/architecture.md'
});

// 2. 等待索引完成
while (!uploadOp.done) {
  await sleep(5000);
  uploadOp = await client.operations.get(uploadOp);
}

// 3. 保存文件 ID 到本地数据库
await saveFileIndex({
  filePath: 'Knowledge/architecture.md',
  geminiFileId: uploadOp.result.file_id,
  status: 'indexed'
});
```

#### 步骤 4：智能上下文注入

**场景 A：编辑代码时自动关联**
```
你正在编辑 UserService.ts
  ↓
插件检测到文件名包含 "User"
  ↓
后台调用 Gemini File Search API
  ↓
Gemini 返回相关文档片段
  ↓
悬浮提示中显示：
  📄 相关文档（来自 architecture.md）：
  "根据架构文档，UserService 负责用户管理..."
  [查看完整文档 →]
```

**场景 B：使用命令主动查询**
```
命令面板 → "VibeCoding: Ask Documents"
  ↓
输入问题："为什么使用 Redis？"
  ↓
调用 Gemini API：
```

```typescript
const response = await client.models.generate_content({
  model: 'gemini-2.5-flash',
  contents: '为什么使用 Redis？',
  config: {
    tools: [{
      file_search: {
        file_search_store_names: [storeId]
      }
    }]
  }
});

// Gemini 自动搜索 decisions/001-use-redis.md
// 生成回答并标注来源
```

```
  ↓
AI 回复（含引用）：
"根据团队 2024-10-15 的技术决策文档¹，选择 Redis 的原因是：

1. 支持更丰富的数据结构
2. 支持持久化  
3. 性能测试显示比 Memcached 快 30%

---
引用来源：
¹ decisions/001-use-redis.md
  [点击查看源文档 →]
"
```

**场景 C：生成 Cursor Rules**
```
命令：Knowledge: Generate Cursor Rules
  ↓
调用 Gemini 生成项目摘要
  ↓
生成 .cursorrules，包含：
  - 架构概览（来自 architecture.md）
  - 设计决策摘要（来自 decisions/）
  - 编码规范（来自 guides/）
  ↓
Cursor AI 自动学习项目知识
```

#### 步骤 5：团队协作

**选项 A：共享 File Search Store（推荐）**
```bash
# 1. 第一个开发者创建 Store 后
# .vscode/settings.json 中会保存 Store ID

# 2. 提交到 Git
git add Knowledge/ .vscode/settings.json
git commit -m "docs: 添加架构文档和 Gemini Store 配置"
git push

# 3. 团队成员拉取代码
git pull

# 4. 插件自动使用相同的 Store ID
# 所有团队成员共享同一个知识库
# 修改文档后自动同步
```

**选项 B：独立 File Search Store**
```bash
# 每个开发者使用自己的 API Key 和 Store
# .vscode/settings.json 添加到 .gitignore
# 各自维护独立的文档索引
```

**成本说明**：
```
假设团队有 5 个开发者，知识库包含 100 个文档，共 500 万 tokens：

选项 A（共享 Store）：
  索引成本：$0.15/M tokens × 5M = $0.75（一次性）
  查询成本：免费
  
选项 B（独立 Store）：
  索引成本：$0.75 × 5 人 = $3.75
  查询成本：免费
  
推荐：使用共享 Store，节省成本
```

**效果对比**：

❌ **没有持久知识库**：
- AI 不知道架构设计
- 重复询问"为什么这样做？"
- 团队知识散落在 Slack/邮件
- 新人需要口头传授经验
- 文档更新后 AI 无法感知

✅ **使用 Gemini 持久知识库**：
- ☁️ AI 自动读取最新架构文档
- 📝 设计决策可追溯，带引用来源
- 🔄 团队知识沉淀在 Git，自动同步
- 🚀 新人看文档即可上手
- 🎯 语义搜索比关键词搜索准确 3 倍
- 💰 成本极低（初次索引 $0.15/M tokens，查询免费）

---

### 场景六：需求文档自动转换 🆕

**问题**：产品经理提供的需求文档是 PDF、Word、Excel 等格式，AI 无法直接理解。

**解决方案**：使用 VibeCoding 自动转换为 Markdown。

#### 步骤 1：创建 specs 文件夹

```bash
# 在项目根目录
mkdir specs
cd specs
```

#### 步骤 2：放入需求文档

```
specs/
├── PRD-UserProfile-v1.0.pdf        # 产品经理提供的 PRD
├── API-Design.docx                 # 后端设计文档
├── TestCases.xlsx                  # QA 提供的测试用例
└── UI-Mockup.png                   # 设计师提供的 UI 图
```

#### 步骤 3：检测 MarkItDown（首次使用）

**方式 A：自动检测**
```
插件启动时自动检测 MarkItDown
  ↓
如果未安装，显示通知：
  "未检测到 MarkItDown，是否安装？"
  [安装 MarkItDown] [使用 Node.js 库]
  ↓
点击"安装 MarkItDown"
  → 自动执行：pip install 'markitdown[all]'
  → 安装完成！
```

**方式 B：手动安装**
```bash
# 需要 Python 3.10+
pip install 'markitdown[all]'
```

**方式 C：使用 Node.js 备用方案**
```
如果没有 Python 环境，插件自动降级使用 Node.js 库：
- PDF → pdf-parse
- Word → mammoth  
- Excel → xlsx

功能有限但无需 Python 依赖
```

#### 步骤 4：自动转换

**启动自动监听**：
```
命令面板 → "VibeCoding: Auto-Watch Specs Folder"
  ↓
状态栏显示：👁️ 正在监听 specs/
```

**自动转换流程**：
```
保存 PRD-UserProfile-v1.0.pdf
  ↓
插件检测到文件变更
  ↓
调用 MarkItDown 转换
  ↓
输出到 Knowledge/PRD-UserProfile-v1.0.md
  ↓
显示通知：✅ 已转换 PRD-UserProfile-v1.0.pdf → .md
  ↓
Gemini 自动索引（联动 RAG 系统）
  ↓
AI 可以访问需求文档内容！
```

**手动批量转换**：
```
命令面板 → "VibeCoding: Convert Specs to Markdown"
  ↓
扫描 specs/ 文件夹
  ↓
批量转换所有文档
  ↓
显示进度：
  [1/4] 转换 PRD-UserProfile-v1.0.pdf...
  [2/4] 转换 API-Design.docx...
  [3/4] 转换 TestCases.xlsx...
  [4/4] 转换 UI-Mockup.png...
  ↓
完成！所有文档已转换为 Markdown
```

#### 步骤 5：查看转换结果

**转换后的文件结构**：
```
Knowledge/
├── PRD-UserProfile-v1.0.md         # 从 PDF 转换
├── API-Design.md                   # 从 Word 转换
├── TestCases.md                    # 从 Excel 转换（表格保留）
└── UI-Mockup.md                    # 从图片转换（含 OCR 文字）
```

**转换后的 Markdown 示例**：

```markdown
<!-- Knowledge/PRD-UserProfile-v1.0.md -->
# 用户资料页面需求文档 v1.0

## 1. 功能概述
用户可以查看和编辑自己的个人资料...

## 2. 功能需求

### 2.1 基本信息展示
- 用户名
- 头像
- 个人简介（最多 200 字）

### 2.2 联系方式
- 邮箱地址（必填）
- 手机号（选填）

## 3. UI 设计
参见附件 UI-Mockup.png

## 4. API 接口
详见 API-Design.docx 第 3.2 节
```

**Excel 转换示例**：
```markdown
<!-- Knowledge/TestCases.md -->
# 测试用例

## Sheet1: 用户资料测试

| 用例ID | 测试场景 | 输入 | 预期结果 | 优先级 |
|--------|---------|------|---------|--------|
| TC001 | 查看个人资料 | 登录后点击"我的资料" | 显示当前用户信息 | P0 |
| TC002 | 编辑用户名 | 修改用户名为"新名字" | 保存成功，显示新名字 | P0 |
| TC003 | 上传头像 | 上传 2MB 的 JPG 图片 | 上传成功 | P1 |
```

#### 步骤 6：AI 使用需求文档

**场景 A：询问需求细节**
```
开发者：在 Cursor 中询问
  "用户资料页面需要哪些字段？"
  ↓
插件检索 Knowledge/PRD-UserProfile-v1.0.md
  ↓
AI 回复（基于需求文档）：
  "根据 PRD v1.0 第 2.1 节¹，用户资料页面需要：
   
   **基本信息**：
   • 用户名
   • 头像
   • 个人简介（最多 200 字）
   
   **联系方式**（第 2.2 节²）：
   • 邮箱地址（必填）
   • 手机号（选填）
   
   ---
   引用来源：
   ¹ PRD-UserProfile-v1.0.md - 第 2.1 节
   ² PRD-UserProfile-v1.0.md - 第 2.2 节"
```

**场景 B：对照测试用例开发**
```
开发者：
  "帮我实现 TC001 的测试场景"
  ↓
AI 检索 Knowledge/TestCases.md
  ↓
AI 生成代码：
  "根据测试用例 TC001¹，需要实现：
   
   ```typescript
   describe('查看个人资料', () => {
     it('应该显示当前用户信息', async () => {
       // 登录
       await login('testuser@example.com');
       
       // 点击"我的资料"
       await click('#my-profile');
       
       // 验证显示用户信息
       expect(screen.getByText('testuser')).toBeVisible();
       expect(screen.getByRole('img', { name: 'avatar' })).toBeVisible();
     });
   });
   ```
   
   ---
   引用来源：
   ¹ TestCases.md - TC001"
```

**场景 C：API 实现**
```
开发者：
  "根据 API 设计文档，实现获取用户资料接口"
  ↓
AI 检索 Knowledge/API-Design.md
  ↓
AI 生成代码（符合设计规范）：
  "根据 API 设计文档 3.2 节¹，接口规范如下：
   
   ```typescript
   // GET /api/users/:id/profile
   @Get(':id/profile')
   async getProfile(@Param('id') userId: string) {
     return {
       username: user.username,
       avatar: user.avatar,
       bio: user.bio,
       email: user.email,
       phone: user.phone
     };
   }
   ```
   
   响应格式符合设计文档定义。"
```

#### 步骤 7：增量更新

**需求文档更新时**：
```
产品经理更新 PRD
  → 替换 specs/PRD-UserProfile-v2.0.pdf
  ↓
插件检测到文件变更
  ↓
自动重新转换
  → Knowledge/PRD-UserProfile-v2.0.md
  ↓
Gemini 自动重新索引
  ↓
AI 自动使用最新需求！
```

**智能增量检测**：
```typescript
// 插件内部逻辑
if (文件哈希未变) {
  跳过转换
} else {
  重新转换并上传到 Gemini
}
```

#### 高级用法

**场景 D：OCR 提取图片文字**（需 MarkItDown）
```
UI 设计图：ui-mockup.png
  ↓
MarkItDown 自动提取图片中的文字
  ↓
Knowledge/ui-mockup.md:
  "图片包含以下文字：
   • 标题：我的资料
   • 按钮：编辑资料
   • 表单字段：用户名、邮箱、手机号
   
   [图片描述：顶部导航栏，中间表单，底部保存按钮]"
  ↓
AI 可以基于图片生成代码！
```

**场景 E：音频转文字**（需 MarkItDown）
```
产品会议录音：meeting-notes.mp3
  ↓
MarkItDown 自动转录为文字
  ↓
Knowledge/meeting-notes.md:
  "会议时间：2024-11-07
   参与人员：Product, Design, Dev
   
   讨论要点：
   1. 用户资料页面增加隐私设置...
   2. 头像支持裁剪功能...
   3. 个人简介支持 Markdown..."
  ↓
AI 可以基于会议记录回答问题！
```

**效果对比**：

❌ **手动管理需求文档**：
- 📄 需求文档散落在各处（邮件、云盘）
- 🤷 AI 无法理解 PDF/Word/Excel
- 🔄 需求更新后需要手动复制给 AI
- 😵 团队成员各自管理文档副本
- 🕐 查找需求信息耗时 10+ 分钟

✅ **使用自动转换**：
- 📁 统一存放在 specs/ 文件夹
- 🤖 AI 直接理解转换后的 Markdown
- 🔄 需求更新自动同步到 AI
- 👥 团队共享同一份知识库
- ⚡ AI 2 秒内检索到相关需求
- 🎯 支持多种格式：PDF、Word、Excel、图片、音频
- 💰 转换免费（本地处理或 Python CLI）

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

