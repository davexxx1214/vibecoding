# 快速入门指南

欢迎使用 Knowledge Graph VS Code 插件！本指南将帮助你快速上手。

## 🚀 安装依赖

首先，确保安装所有依赖：

```bash
npm install
```

## 🔨 开发和调试

### 启动开发模式

1. 在 VS Code 中打开项目
2. 按 `F5` 或点击 "Run" > "Start Debugging"
3. 这会打开一个新的 VS Code 窗口（Extension Development Host），插件已经加载

### 监听文件变化

在开发过程中，可以使用监听模式自动重新编译：

```bash
npm run watch
```

然后在调试窗口中按 `Ctrl+R`（Windows/Linux）或 `Cmd+R`（Mac）重新加载插件。

## 📚 基本使用

### 1. 创建第一个实体

1. 打开一个项目文件夹（必须有工作区）
2. 打开一个代码文件
3. 选中一个函数或类名
4. 右键选择 **"Knowledge: Create Entity from Selection"**
5. 输入名称、选择类型、添加描述

### 2. 查看知识图谱

点击左侧活动栏的 🧠 图标，打开 Knowledge Graph 侧边栏，你可以看到：
- 按类型分组的所有实体
- 点击实体可跳转到代码位置

### 3. 添加观察记录

1. 将光标放在已创建的实体上
2. 右键选择 **"Knowledge: Add Observation to Entity..."**
3. 输入观察内容，例如：
   - "性能问题：N+1 查询"
   - "需要重构：代码太长"
   - "注意：这个函数会抛出异常"

### 4. 查看悬浮提示

将鼠标悬停在已创建为实体的代码上，会显示：
- 实体信息
- 所有观察记录
- 关系信息（如果有）

### 5. 使用 CodeLens

在已创建实体的代码上方，会显示统计信息：
```
🧠 KG: 2 observations, 3 relations
```

点击可以查看详细信息。

## 🔍 命令列表

打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`），输入 "Knowledge" 查看所有命令：

- **Knowledge: Create Entity from Selection** - 从选中代码创建实体
- **Knowledge: Add Observation to Entity...** - 添加观察记录
- **Knowledge: View Entity Details** - 查看实体详情
- **Knowledge: Search Graph** - 搜索实体
- **Knowledge: Visualize Graph** - 可视化图谱（阶段五实现）
- **Knowledge: Export Graph** - 导出图谱（待实现）
- **Knowledge: Import Graph** - 导入图谱（待实现）
- **Knowledge: Clear Graph** - 清空图谱（待实现）

## 📂 数据存储位置

知识图谱数据存储在：
```
<工作区>/.vscode/.knowledge/graph.sqlite
```

### 版本控制建议

**共享知识图谱**（推荐）：
将 `.vscode/.knowledge/` 提交到 Git，团队成员可以共享知识。

**个人使用**：
在 `.gitignore` 中添加：
```
.vscode/.knowledge/
```

## 🎯 使用场景示例

### 场景 1：标记重要函数

```typescript
// 选中这个函数并创建实体
export async function processPayment(order: Order) {
  // 复杂的支付逻辑
}
```

添加观察：
- "核心功能：处理所有支付逻辑"
- "注意：需要处理超时异常"
- "TODO：需要添加重试机制"

### 场景 2：记录性能问题

发现性能问题时：
1. 创建实体
2. 添加观察："性能瓶颈：数据库查询过多"
3. 其他开发者看到代码时会自动显示警告

### 场景 3：新成员上手

新成员打开项目：
1. 浏览知识图谱侧边栏，了解项目结构
2. 悬停在代码上查看前人留下的注释
3. 快速理解关键函数的用途和注意事项

## 🔧 故障排除

### 插件没有激活

- 确保打开了工作区文件夹（不能是单个文件）
- 查看 VS Code 开发者控制台（`Help > Toggle Developer Tools`）

### 数据库错误

- 检查 `.vscode/.knowledge/` 目录权限
- 删除 `graph.sqlite` 文件重新初始化

### Native 模块问题

```bash
npm rebuild better-sqlite3
```

## 📖 下一步

- 阅读 [INSTALL.md](./INSTALL.md) 了解详细安装说明
- 阅读 [README.md](./README.md) 了解完整功能规划
- 参与开发：实现阶段二、三、四、五的功能

## 💡 提示

1. 为关键函数、类、API 端点创建实体
2. 记录性能问题、设计决策、已知 Bug
3. 定期查看知识图谱，了解项目演进
4. 与团队共享知识图谱，提高协作效率

---

祝你使用愉快！如有问题请查看项目文档或提 Issue。

