# VibeKnowledge MCP 使用指南

本指南记录了当前阶段（默认目录：`D:/workspace/vibecoding`）如何启动 VibeKnowledge MCP Server，并将其接入 Cursor 与 GitHub Copilot。随着功能迭代，文档会持续更新。

---

## 1. 启动 MCP Server

1. 进入仓库根目录：
   ```bash
   cd D:/workspace/vibecoding
   ```
2. 先构建一次（如尚未构建）：
   ```bash
   npm run --workspace packages/mcp-server build
   ```
3. （可选）手动启动服务器（一般用于本地调试；若通过 Cursor / Copilot 配置则无需手工保持进程）：
   ```bash
   node packages/mcp-server/dist/index.js --workspace "D:/workspace/nestjs-realworld-example-app"
   ```
   - `--workspace` 指向目标项目根目录（需已生成 `.vscode/.knowledge/graph.sqlite`）。
   - 日志全部输出到 `stderr`，`stdout` 专用于 MCP 协议通信。
   - **提示**：Cursor / Copilot 会按 `mcp.json` 自动启动 server，除非需要独立调试，一般无需在此手动运行。

---

## 2. Cursor 集成步骤

> 需启用 Cursor MCP（Beta）功能。

1. 在 Cursor 按 `Ctrl + Shift + P`。
2. 输入并选择 **`View: Open MCP Settings`**。
3. 点击 **“New MCP Server”**。
4. 在弹出的 `mcp.json` 中添加条目（若已有则合并）：

   ```jsonc
   {
     "vibeknowledge": {
       "command": "node",
       "args": [
         "D:/workspace/vibecoding/packages/mcp-server/dist/index.js",
         "--workspace",
         "D:/workspace/nestjs-realworld-example-app"
       ]
     }
   }
   ```

5. 保存后，Cursor 会自动以子进程方式启动该 server，并在日志面板提示连接结果。
6. 测试：在对话中输入 “列出知识图谱概览” 或使用 `@mcp vibeknowledge resource knowledge://overview`，确认能返回数据。

---

## 3. GitHub Copilot（VS Code）集成

1. Copilot Desktop / VS Code 版本需 ≥ 1.215，确保开启 MCP 预览。
2. 编辑配置文件：
   - Windows：`%APPDATA%\GitHub Copilot\mcp.json`
   - macOS / Linux：`~/.config/github-copilot/mcp.json`
3. 添加与 Cursor 相同的配置：

   ```jsonc
   {
     "vibeknowledge": {
       "command": "node",
       "args": [
         "D:/workspace/vibecoding/packages/mcp-server/dist/index.js",
         "--workspace",
         "D:/workspace/nestjs-realworld-example-app"
       ]
     }
   }
   ```

4. 重启 VS Code，Copilot 会自动连接该 MCP server。随后即可在 Copilot Chat 中直接请求项目概览、实体信息等。

---

## 4. 常见问题

| 问题 | 说明 |
|------|------|
| `graph.sqlite` 找不到 | 需先在对应项目中运行 VibeKnowledge VS Code 插件以生成 `.vscode/.knowledge/graph.sqlite` |
| 想切换到其他项目 | 停止当前 server，重新以新的 `--workspace` 路径启动 |
| 无法连接 | 检查 `mcp.json` 路径、命令参数及 Node.js 版本（≥ 18） |
| 想查看实时日志 | MCP Server 日志打印在启动终端的 `stderr`，不会污染协议输出 |

如需在多个项目间复用，可为每个项目同时运行一个 MCP 进程，并在 `mcp.json` 中配置不同的名称与工作区路径。

