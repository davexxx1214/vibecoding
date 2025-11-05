# 安装指南

## 前置要求

- Node.js 18.x 或更高版本
- npm 或 yarn
- VS Code 1.80.0 或更高版本

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 编译插件

```bash
npm run compile
```

### 3. 在 VS Code 中调试

1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试
3. 这会打开一个新的 VS Code 窗口，插件已经被加载

### 4. 打包插件（可选）

```bash
# 安装 vsce（如果还没有安装）
npm install -g @vscode/vsce

# 打包插件
vsce package
```

这将生成一个 `.vsix` 文件，可以手动安装：

```bash
code --install-extension vscode-knowledge-graph-0.1.0.vsix
```

## 使用说明

### 创建实体

1. 在代码编辑器中选中一段代码（函数、类、变量等）
2. 右键选择 "Knowledge: Create Entity from Selection"
3. 输入实体名称和类型
4. 可选：添加描述

### 添加观察记录

1. 将光标放在已创建的实体上
2. 右键选择 "Knowledge: Add Observation to Entity..."
3. 输入观察内容

### 查看实体信息

- **悬浮提示**：将鼠标悬停在实体上，查看相关信息
- **CodeLens**：在实体定义上方显示统计信息
- **侧边栏**：点击活动栏的知识图谱图标，浏览所有实体

### 搜索

使用命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）：
- "Knowledge: Search Graph" - 搜索实体

## 数据存储

知识图谱数据存储在工作区的 `.vscode/.knowledge/graph.sqlite` 文件中。

### 版本控制

你可以选择：
- **追踪数据**：将 `.vscode/.knowledge/` 提交到 Git，与团队共享知识图谱
- **忽略数据**：将以下内容添加到 `.gitignore`：
  ```
  .vscode/.knowledge/
  ```

## 故障排除

### 数据库初始化失败

如果遇到数据库初始化错误，请检查：
1. 工作区是否有写入权限
2. `.vscode/.knowledge/` 目录是否可以创建
3. 查看 VS Code 开发者控制台（`Help > Toggle Developer Tools`）的错误信息

### Native 模块编译问题

`better-sqlite3` 是一个 native 模块，如果遇到编译问题：

```bash
# 重新编译 native 模块
npm rebuild better-sqlite3

# 或者清理后重新安装
rm -rf node_modules
npm install
```

## 开发

### 监听模式

```bash
npm run watch
```

这会在文件更改时自动重新编译。

### 目录结构

```
src/
├── extension.ts           # 插件入口
├── services/
│   ├── database.ts        # 数据库服务
│   ├── entityService.ts   # 实体管理
│   ├── relationService.ts # 关系管理
│   └── observationService.ts # 观察记录管理
├── providers/
│   ├── hoverProvider.ts   # 悬浮提示
│   ├── codeLensProvider.ts # CodeLens
│   └── treeDataProvider.ts # 树视图
├── ui/
│   └── commands/
│       └── entityCommands.ts # 命令处理
└── utils/
    ├── types.ts           # 类型定义
    └── codeParser.ts      # 代码解析
```

## 下一步

参考 README.md 中的阶段二、阶段三等内容，继续实现更多功能。

