# Guardian for VS Code - 安装和使用指南

## 项目结构

```
vibecoding/
├── src/                    # VS Code 扩展源代码
│   ├── extension.ts        # 扩展主入口
│   ├── commands/          # 命令处理器
│   │   └── generateTests.ts
│   └── utils/            # 工具函数
│       ├── astParser.ts   # AST 解析器
│       └── testGenerator.ts  # 测试生成器
├── backend/              # 后端服务
│   ├── server.js         # Node.js 后端服务器
│   └── package.json
├── package.json          # VS Code 扩展配置
├── tsconfig.json         # TypeScript 配置
└── README.md
```

## 安装步骤

### 1. 安装依赖

```bash
# 安装 VS Code 扩展依赖
npm install

# 安装后端服务依赖
cd backend
npm install
cd ..
```

### 2. 编译 TypeScript 代码

```bash
npm run compile
```

### 3. 启动后端服务

```bash
cd backend
npm start
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 在 VS Code 中测试扩展

1. 按 `F5` 键在扩展开发宿主窗口中打开新的 VS Code 窗口
2. 在新窗口中打开一个包含函数的代码文件（如 JavaScript、TypeScript、Python）
3. 将光标放在函数内部
4. 右键点击，选择 `Guardian: Generate Unit Tests`
5. 插件会自动生成测试文件

## 使用方法

### 生成单元测试

1. **打开文件**：打开要生成测试的代码文件（可以是 JavaScript、TypeScript、Python、Java 等）
2. **触发命令**：
   - 方法一：右键点击 → 选择 `Guardian: Generate Unit Tests`
   - 方法二：按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac），输入 `Guardian: Generate Unit Tests`
3. **查看结果**：插件会读取整个文件，使用 LLM 分析所有函数并生成完整的测试文件。测试文件会自动创建在 `__tests__` 目录下，并在新标签页中打开

**注意**：不需要将光标放在函数内部，插件会分析整个文件。

### 配置选项

在 VS Code 设置中可以配置以下选项：

- `guardian.backendUrl`: 后端服务地址（默认：`http://localhost:8080`）
- `guardian.testDirectory`: 测试文件目录名称（默认：`__tests__`）

## 支持的语言

- TypeScript / JavaScript（使用 Jest）
- Python（使用 pytest）
- Java（使用 JUnit）
- 其他语言（通用模板）

## 开发说明

### 扩展开发

```bash
# 编译并监听文件变化
npm run watch

# 仅编译一次
npm run compile
```

### 后端开发

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```env
OPENAI_API_BASE=http://23.106.155.236:3001/v1
OPENAI_API_KEY=your-api-key-here
MODEL=gpt-4.1
```

注意：`.env` 文件包含敏感信息，不应提交到版本控制系统。

## 故障排除

### 后端服务连接失败

如果看到"后端服务不可用"的警告，插件会使用基础测试模板。确保后端服务正在运行：

```bash
cd backend
npm start
```

### LLM API 调用失败

确保：
1. 后端服务正在运行
2. `.env` 文件已正确配置
3. API 密钥有效
4. 网络连接正常

## 下一步

- [x] 集成真实的 LLM API（OpenAI、Anthropic 等）
- [ ] 支持更多测试框架
- [ ] 支持批量生成多个文件的测试
- [ ] 添加测试用例预览和编辑功能

