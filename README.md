# Guardian for VS Code

## 核心定位 (Elevator Pitch)

Guardian for VS Code 是一款专为开发者设计的 AI 代码可信度增强插件。它不是要取代 Copilot，而是作为它的"质检员"和"安全官"。Guardian 深度集成在 VS Code 中，通过自动生成测试、深度代码审查和智能变更影响分析，将 AI 生成的代码从"能用"提升到"可靠"，确保每一行代码都经过验证，让开发者自信地拥抱 AI 编程。

## 插件架构 (Architecture)

我们将采用"轻前端，重后端"的本地客户端-服务器模式，以确保 VS Code 编辑器的流畅性和插件功能的强大性。

### 前端 (VS Code Extension - TypeScript)

**职责:**

- **用户界面 (UI) 层**: 负责所有与用户直接交互的部分，包括右键菜单、命令面板、侧边栏视图 (WebviewView)、编辑器内的代码镜头 (CodeLens) 和问题诊断 (Diagnostics)。
- **VS Code API 交互**: 获取编辑器状态（如选中的代码）、操作文件系统（如创建测试文件）、与版本控制系统（Git）交互。
- **通信代理**: 将从编辑器获取的上下文信息打包，通过本地 HTTP/WebSocket 发送给后端服务，并接收处理后的结果进行展示。

### 后端 (Guardian Core Engine - Python/Node.js 本地服务)

**职责:**

- **计算核心**: 执行所有耗时和计算密集型任务，包括与 LLM API 的通信、AST 解析、静态分析和知识图谱查询。
- **项目知识库**: 在本地维护一个关于当前工作区（Workspace）的知识库，包括代码的向量索引和函数调用图，用于提供深度上下文分析。
- **AI 编排**: 管理复杂的提示词链（Prompt Chains），将简单的用户请求转化为对大语言模型的精确、多步骤指令。

**架构优势**: 将复杂的逻辑与 VS Code 的 UI 进程分离，避免了因 AI 请求延迟或大量计算导致的编辑器卡顿，同时允许后端使用更适合 AI 处理的技术栈（如 Python）。

## 功能模块清单 & VS Code 实现方案

### 模块一：即时验证 (Instant Verification) - 建立基础信任

#### 功能：一键生成单元测试

**用户体验**: 在函数体内部右键，选择 `Guardian: Generate Unit Tests`。插件会在测试目录下自动创建或更新对应的测试文件，并填充高质量的测试用例。

**VS Code 实现:**

- **触发**: `editor/context` 菜单 + `contributes.commands`。
- **上下文获取**: 使用 `vscode.window.activeTextEditor` 和 AST 解析库（如 tree-sitter）精确提取函数代码。
- **结果呈现**: 使用 `vscode.workspace.fs.writeFile` 写入测试文件，并用 `vscode.window.showTextDocument` 在新标签页打开。

#### 功能：智能代码审查

**用户体验**: 选中一段代码或整个文件，执行 `Guardian: Review Code Quality & Security` 命令。有问题的地方会直接在编辑器中用波浪线标出，鼠标悬停即可看到 AI 提供的详细建议。

**VS Code 实现:**

- **触发**: 命令面板或右键菜单。
- **结果呈现 (最佳实践)**: 使用 `vscode.languages.createDiagnosticCollection`。后端返回结构化的 JSON 结果（包含问题行号、严重性、信息），前端解析后生成 `vscode.Diagnostic` 对象，可以完美融入 VS Code 原生的"问题"面板和编辑器内高亮。

### 模块二：深度洞察 (Deep Insight) - 提供全局视野

#### 功能：变更影响可视化分析

**用户体验**: 在修改一个函数后，点击状态栏的 "Guardian" 图标或在 Git 提交前触发分析。一个新的标签页会打开，用交互式图表展示你的修改会影响到哪些其他文件和函数。

**VS Code 实现:**

- **触发**: 监听 `vscode.workspace.onDidSaveTextDocument` 事件，或在 Source Control 视图中添加自定义按钮。
- **上下文获取**: 获取已修改的文件列表或 git diff 的内容。
- **结果呈现**: 使用 `vscode.window.createWebviewPanel` 创建一个 Webview 面板。在 Webview 中使用前端技术（如 React + D3.js/React Flow）渲染后端返回的依赖图谱数据，提供缩放、拖拽等交互。

#### 功能：代码知识库问答 (RAG)

**用户体验**: 打开一个专属于 Guardian 的侧边栏聊天窗口。你可以像问一个资深同事那样提问："项目中处理支付逻辑的核心函数在哪里？" 或 "解释一下 UserService.ts 这个文件的作用"。

**VS Code 实现:**

- **UI**: 使用 `vscode.window.createWebviewViewProvider` 创建一个常驻的侧边栏视图 (activitybar)。
- **交互**: Webview 中的聊天界面通过 `webview.postMessage` 与插件主进程通信。
- **后端处理**: 后端服务接收到问题后，将问题文本向量化，在本地项目的向量数据库中进行语义搜索，召回最相关的代码片段作为上下文，然后连同问题一起发给 LLM 生成回答。

### 模块三：工作流集成 (Workflow Integration) - 成为开发流程的一部分

#### 功能：提交前审查 (Pre-Commit Review)

**用户体验**: 在 VS Code 的 "Source Control" 视图中点击 commit 按钮时，Guardian 会自动对暂存区的代码进行一次快速审查。如果发现严重问题（如未通过测试的代码、包含硬编码密钥），会弹出警告并暂停提交，要求用户确认。

**VS Code 实现:**

- **Git API 集成**: 利用 VS Code 内置的 Git 插件 API，可以获取暂存区的文件和内容。虽然没有直接的 pre-commit hook API，但可以通过代理 `git.commit` 命令或在 Source Control 视图添加自定义按钮来实现类似流程。

#### 功能：一键采纳重构建议

**用户体验**: 当代码审查（模块一）提出一个具体的重构建议时，旁边会有一个"采纳"按钮。点击后，对应的代码块会被 AI 生成的新代码自动替换。

**VS Code 实现:**

- **代码操作 (Code Actions)**: 使用 `vscode.languages.registerCodeActionsProvider`。当光标位于有诊断信息（Diagnostic）的行时，旁边会出现一个小灯泡图标。点击后，可以提供"Guardian: 应用修复"选项。
- **执行**: 选择该操作后，插件会使用 `TextEditorEdit` 对象对文档进行非破坏性的文本替换。
