# 需求文档转换功能 - 技术设计文档

> 使用 Node.js 调用 Python MarkItDown CLI 实现文档转换

---

## 📋 目录

- [功能概述](#功能概述)
- [技术方案](#技术方案)
- [模块设计](#模块设计)
- [API 设计](#api-设计)
- [数据流](#数据流)
- [错误处理](#错误处理)
- [配置选项](#配置选项)
- [测试方案](#测试方案)

---

## 🎯 功能概述

**目标**：自动将 `specs/` 文件夹中的各种格式需求文档转换为 Markdown，输出到 `Knowledge/` 文件夹。

**支持格式**：
- 📄 PDF
- 📝 Word (DOCX)
- 📊 Excel (XLSX, XLS)
- 🎯 PowerPoint (PPTX)
- 🖼️ 图片（PNG, JPG, 支持 OCR）
- 🎵 音频（MP3, WAV, 支持语音转文字）
- 🌐 HTML
- 📦 ZIP（自动解压处理）

**核心能力**：
- ✅ 自动监听 `specs/` 文件夹变更
- ✅ 增量转换（只转换变更的文件）
- ✅ 批量转换
- ✅ 进度提示
- ✅ 错误重试
- ✅ 转换后自动触发 Gemini 索引

---

## 🔧 技术方案

### 方案选择：Node.js 调用 Python CLI

**架构**：
```
VS Code Extension (TypeScript)
  ↓ child_process.exec()
Python CLI: markitdown
  ↓
Markdown 文件输出
```

**优点**：
- ✅ 实现简单（调用命令行即可）
- ✅ 功能完整（MarkItDown 支持所有格式）
- ✅ Microsoft 官方维护，稳定可靠
- ✅ 输出质量高（保留文档结构）
- ✅ 无需自己实现复杂的转换逻辑

**前置条件**：
- Python 3.10+（用户预先安装）
- MarkItDown（插件启动时检测，提示安装）

---

## 🏗️ 模块设计

### 模块结构

```
src/specs/
├── index.ts                      # 模块入口，注册命令和监听器
├── converter.ts                  # MarkItDown 转换器
├── watcher.ts                    # specs/ 文件夹监听器
├── manager.ts                    # 转换任务管理器
├── utils/
│   ├── fileHash.ts              # 文件哈希计算（检测变更）
│   ├── pathUtils.ts             # 路径工具函数
│   └── markdownCleaner.ts       # Markdown 格式优化
└── types.ts                      # 类型定义
```

---

## 📝 API 设计

### 1. MarkItDown 转换器 (`converter.ts`)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ConvertOptions {
  /** 输入文件路径 */
  inputPath: string;
  /** 输出文件路径 */
  outputPath: string;
  /** 超时时间（毫秒），默认 60000 */
  timeout?: number;
  /** 是否清理输出的 Markdown */
  cleanMarkdown?: boolean;
}

export interface ConvertResult {
  /** 是否成功 */
  success: boolean;
  /** 输出文件路径 */
  outputPath?: string;
  /** 错误信息 */
  error?: string;
  /** 转换耗时（毫秒）*/
  duration: number;
}

export class MarkItDownConverter {
  private static instance: MarkItDownConverter;
  
  private constructor() {}
  
  public static getInstance(): MarkItDownConverter {
    if (!this.instance) {
      this.instance = new MarkItDownConverter();
    }
    return this.instance;
  }

  /**
   * 检测 MarkItDown 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    try {
      await execAsync('markitdown --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取 MarkItDown 版本
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('markitdown --version', { timeout: 5000 });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * 安装 MarkItDown
   */
  async install(): Promise<boolean> {
    try {
      await execAsync("pip install 'markitdown[all]'", { timeout: 300000 }); // 5分钟超时
      return true;
    } catch (error) {
      console.error('安装 MarkItDown 失败:', error);
      return false;
    }
  }

  /**
   * 转换单个文件
   */
  async convert(options: ConvertOptions): Promise<ConvertResult> {
    const startTime = Date.now();
    const { inputPath, outputPath, timeout = 60000, cleanMarkdown = true } = options;

    try {
      // 1. 检查输入文件是否存在
      await fs.access(inputPath);

      // 2. 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 3. 调用 MarkItDown CLI
      const command = `markitdown "${inputPath}" -o "${outputPath}"`;
      await execAsync(command, { timeout });

      // 4. 验证输出文件
      await fs.access(outputPath);

      // 5. 可选：清理 Markdown 格式
      if (cleanMarkdown) {
        await this.cleanMarkdown(outputPath);
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        outputPath,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message || '转换失败',
        duration
      };
    }
  }

  /**
   * 批量转换文件
   */
  async convertBatch(files: ConvertOptions[]): Promise<ConvertResult[]> {
    const results: ConvertResult[] = [];
    
    for (const fileOptions of files) {
      const result = await this.convert(fileOptions);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 清理 Markdown 格式
   */
  private async cleanMarkdown(filePath: string): Promise<void> {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // 1. 移除多余的空行（3个以上连续空行 → 2个空行）
    content = content.replace(/\n{4,}/g, '\n\n\n');
    
    // 2. 统一行尾（CRLF → LF）
    content = content.replace(/\r\n/g, '\n');
    
    // 3. 移除行尾空白
    content = content.split('\n').map(line => line.trimEnd()).join('\n');
    
    // 4. 确保文件以单个换行符结尾
    content = content.trimEnd() + '\n';
    
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
```

---

### 2. 文件监听器 (`watcher.ts`)

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { MarkItDownConverter } from './converter';
import { FileHashUtil } from './utils/fileHash';
import { ConversionManager } from './manager';

export class SpecsWatcher {
  private watcher: vscode.FileSystemWatcher | null = null;
  private converter: MarkItDownConverter;
  private hashUtil: FileHashUtil;
  private manager: ConversionManager;
  private workspaceRoot: string;
  private specsDir: string;
  private knowledgeDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.specsDir = path.join(workspaceRoot, 'specs');
    this.knowledgeDir = path.join(workspaceRoot, 'Knowledge');
    this.converter = MarkItDownConverter.getInstance();
    this.hashUtil = new FileHashUtil();
    this.manager = ConversionManager.getInstance();
  }

  /**
   * 开始监听
   */
  async startWatching(): Promise<void> {
    // 创建文件监听器，监听 specs/ 文件夹
    const pattern = new vscode.RelativePattern(this.specsDir, '**/*');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    // 监听文件创建
    this.watcher.onDidCreate(async (uri) => {
      await this.handleFileChange(uri, 'created');
    });

    // 监听文件修改
    this.watcher.onDidChange(async (uri) => {
      await this.handleFileChange(uri, 'modified');
    });

    // 监听文件删除
    this.watcher.onDidDelete(async (uri) => {
      await this.handleFileDelete(uri);
    });

    vscode.window.showInformationMessage('👁️ 开始监听 specs/ 文件夹');
  }

  /**
   * 停止监听
   */
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
      vscode.window.showInformationMessage('👁️ 停止监听 specs/ 文件夹');
    }
  }

  /**
   * 处理文件变更
   */
  private async handleFileChange(uri: vscode.Uri, changeType: 'created' | 'modified'): Promise<void> {
    const inputPath = uri.fsPath;
    const fileName = path.basename(inputPath);
    const ext = path.extname(inputPath).toLowerCase();

    // 忽略隐藏文件和临时文件
    if (fileName.startsWith('.') || fileName.startsWith('~')) {
      return;
    }

    // 检查是否是支持的文件类型
    const supportedExts = ['.pdf', '.docx', '.xlsx', '.xls', '.pptx', '.png', '.jpg', '.jpeg', '.mp3', '.wav', '.html', '.zip'];
    if (!supportedExts.includes(ext)) {
      return;
    }

    // 检查文件是否真的变更了（使用文件哈希）
    const hasChanged = await this.hashUtil.hasFileChanged(inputPath);
    if (!hasChanged && changeType === 'modified') {
      console.log(`文件未变更，跳过转换: ${fileName}`);
      return;
    }

    // 计算输出路径
    const relativePath = path.relative(this.specsDir, inputPath);
    const baseName = path.basename(relativePath, ext);
    const outputPath = path.join(this.knowledgeDir, path.dirname(relativePath), baseName + '.md');

    // 添加到转换队列
    await this.manager.addTask({
      inputPath,
      outputPath,
      fileName,
      changeType
    });
  }

  /**
   * 处理文件删除
   */
  private async handleFileDelete(uri: vscode.Uri): Promise<void> {
    const inputPath = uri.fsPath;
    const fileName = path.basename(inputPath);
    const ext = path.extname(inputPath).toLowerCase();

    // 计算对应的输出文件路径
    const relativePath = path.relative(this.specsDir, inputPath);
    const baseName = path.basename(relativePath, ext);
    const outputPath = path.join(this.knowledgeDir, path.dirname(relativePath), baseName + '.md');

    // 询问是否删除对应的 Markdown 文件
    const answer = await vscode.window.showWarningMessage(
      `源文件 ${fileName} 已删除，是否同时删除转换后的 ${baseName}.md？`,
      '是',
      '否'
    );

    if (answer === '是') {
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(outputPath));
        vscode.window.showInformationMessage(`✅ 已删除 ${baseName}.md`);
      } catch (error) {
        console.error('删除文件失败:', error);
      }
    }
  }
}
```

---

### 3. 转换任务管理器 (`manager.ts`)

```typescript
import * as vscode from 'vscode';
import { MarkItDownConverter, ConvertOptions } from './converter';

export interface ConversionTask {
  inputPath: string;
  outputPath: string;
  fileName: string;
  changeType: 'created' | 'modified' | 'manual';
}

export class ConversionManager {
  private static instance: ConversionManager;
  private converter: MarkItDownConverter;
  private queue: ConversionTask[] = [];
  private isProcessing = false;
  private statusBarItem: vscode.StatusBarItem;

  private constructor() {
    this.converter = MarkItDownConverter.getInstance();
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  }

  public static getInstance(): ConversionManager {
    if (!this.instance) {
      this.instance = new ConversionManager();
    }
    return this.instance;
  }

  /**
   * 添加转换任务
   */
  async addTask(task: ConversionTask): Promise<void> {
    this.queue.push(task);
    this.updateStatusBar();
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * 处理转换队列
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.statusBarItem.hide();
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift()!;

    try {
      // 更新状态栏
      this.statusBarItem.text = `☁️ 正在转换: ${task.fileName}`;
      this.statusBarItem.show();

      // 执行转换
      const result = await this.converter.convert({
        inputPath: task.inputPath,
        outputPath: task.outputPath,
        cleanMarkdown: true
      });

      if (result.success) {
        const duration = (result.duration / 1000).toFixed(1);
        vscode.window.showInformationMessage(
          `✅ 转换成功: ${task.fileName} → ${vscode.workspace.asRelativePath(result.outputPath!)} (${duration}s)`
        );
        
        // TODO: 触发 Gemini 索引更新
        // await geminiService.indexFile(result.outputPath);
      } else {
        vscode.window.showErrorMessage(
          `❌ 转换失败: ${task.fileName} - ${result.error}`
        );
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `❌ 转换错误: ${task.fileName} - ${error.message}`
      );
    }

    // 继续处理下一个任务
    await this.processQueue();
  }

  /**
   * 批量转换
   */
  async convertAll(specsDir: string, knowledgeDir: string): Promise<void> {
    const fs = require('fs/promises');
    const path = require('path');

    try {
      // 扫描 specs/ 文件夹
      const files = await this.scanDirectory(specsDir);
      
      if (files.length === 0) {
        vscode.window.showWarningMessage('specs/ 文件夹为空');
        return;
      }

      vscode.window.showInformationMessage(`找到 ${files.length} 个文件，开始批量转换...`);

      // 添加所有任务到队列
      for (const inputPath of files) {
        const ext = path.extname(inputPath);
        const relativePath = path.relative(specsDir, inputPath);
        const baseName = path.basename(relativePath, ext);
        const outputPath = path.join(knowledgeDir, path.dirname(relativePath), baseName + '.md');

        await this.addTask({
          inputPath,
          outputPath,
          fileName: path.basename(inputPath),
          changeType: 'manual'
        });
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`批量转换失败: ${error.message}`);
    }
  }

  /**
   * 扫描目录，获取所有支持的文件
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const fs = require('fs/promises');
    const path = require('path');
    const supportedExts = ['.pdf', '.docx', '.xlsx', '.xls', '.pptx', '.png', '.jpg', '.jpeg', '.mp3', '.wav', '.html', '.zip'];
    const files: string[] = [];

    async function scan(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // 忽略隐藏文件夹
          if (!entry.name.startsWith('.')) {
            await scan(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExts.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    await scan(dir);
    return files;
  }

  /**
   * 更新状态栏
   */
  private updateStatusBar(): void {
    if (this.queue.length > 0) {
      this.statusBarItem.text = `📝 待转换: ${this.queue.length}`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
```

---

### 4. 文件哈希工具 (`utils/fileHash.ts`)

```typescript
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

export class FileHashUtil {
  private hashCache = new Map<string, string>();

  /**
   * 计算文件的 SHA-256 哈希
   */
  async calculateHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * 检查文件是否变更
   */
  async hasFileChanged(filePath: string): Promise<boolean> {
    const currentHash = await this.calculateHash(filePath);
    const previousHash = this.hashCache.get(filePath);

    if (previousHash === currentHash) {
      return false;
    }

    this.hashCache.set(filePath, currentHash);
    return true;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.hashCache.clear();
  }
}
```

---

### 5. 模块入口 (`index.ts`)

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { MarkItDownConverter } from './converter';
import { SpecsWatcher } from './watcher';
import { ConversionManager } from './manager';

let watcher: SpecsWatcher | null = null;
let converter: MarkItDownConverter | null = null;
let manager: ConversionManager | null = null;

/**
 * 激活 Specs 转换模块
 */
export async function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return;
  }

  converter = MarkItDownConverter.getInstance();
  manager = ConversionManager.getInstance();
  watcher = new SpecsWatcher(workspaceRoot);

  // 检测 MarkItDown 是否安装
  const isInstalled = await converter.isInstalled();
  if (!isInstalled) {
    const answer = await vscode.window.showWarningMessage(
      '未检测到 MarkItDown，需要安装才能转换需求文档。',
      '立即安装',
      '稍后'
    );

    if (answer === '立即安装') {
      const installing = vscode.window.setStatusBarMessage('正在安装 MarkItDown...');
      const success = await converter.install();
      installing.dispose();

      if (success) {
        vscode.window.showInformationMessage('✅ MarkItDown 安装成功！');
      } else {
        vscode.window.showErrorMessage('❌ MarkItDown 安装失败，请手动安装：pip install markitdown[all]');
      }
    }
  } else {
    const version = await converter.getVersion();
    console.log(`MarkItDown 已安装: ${version}`);
  }

  // 注册命令：批量转换
  const convertAllCommand = vscode.commands.registerCommand('vibecoding.convertSpecsToMarkdown', async () => {
    const specsDir = path.join(workspaceRoot, 'specs');
    const knowledgeDir = path.join(workspaceRoot, 'Knowledge');
    await manager.convertAll(specsDir, knowledgeDir);
  });

  // 注册命令：转换当前文件
  const convertCurrentCommand = vscode.commands.registerCommand('vibecoding.convertCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('请先打开一个文件');
      return;
    }

    const inputPath = editor.document.uri.fsPath;
    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);
    const outputPath = path.join(path.dirname(inputPath), baseName + '.md');

    await manager.addTask({
      inputPath,
      outputPath,
      fileName: path.basename(inputPath),
      changeType: 'manual'
    });
  });

  // 注册命令：启动自动监听
  const startWatchingCommand = vscode.commands.registerCommand('vibecoding.startWatchingSpecs', async () => {
    await watcher?.startWatching();
  });

  // 注册命令：停止自动监听
  const stopWatchingCommand = vscode.commands.registerCommand('vibecoding.stopWatchingSpecs', () => {
    watcher?.stopWatching();
  });

  // 注册命令：安装 MarkItDown
  const installCommand = vscode.commands.registerCommand('vibecoding.installMarkItDown', async () => {
    const installing = vscode.window.setStatusBarMessage('正在安装 MarkItDown...');
    const success = await converter.install();
    installing.dispose();

    if (success) {
      vscode.window.showInformationMessage('✅ MarkItDown 安装成功！');
    } else {
      vscode.window.showErrorMessage('❌ 安装失败');
    }
  });

  context.subscriptions.push(
    convertAllCommand,
    convertCurrentCommand,
    startWatchingCommand,
    stopWatchingCommand,
    installCommand,
    manager
  );
}

/**
 * 停用模块
 */
export function deactivate() {
  watcher?.stopWatching();
}
```

---

## 🔄 数据流

### 完整数据流

```
用户操作
  ↓
1. 手动转换 或 自动监听
  ↓
2. SpecsWatcher 检测文件变更
  ↓
3. 计算文件哈希（FileHashUtil）
  ↓
4. 检查是否真的变更
  ↓
5. 添加任务到队列（ConversionManager）
  ↓
6. 调用 MarkItDown CLI（child_process.exec）
  ↓
7. Python 处理文件转换
  ↓
8. 输出 Markdown 文件
  ↓
9. 清理 Markdown 格式（去除多余空行）
  ↓
10. 显示成功通知
  ↓
11. 触发 Gemini 索引更新（可选）
  ↓
完成
```

---

## ⚠️ 错误处理

### 1. MarkItDown 未安装

```typescript
if (!await converter.isInstalled()) {
  // 显示安装提示
  vscode.window.showWarningMessage(
    '未检测到 MarkItDown',
    '立即安装'
  );
}
```

### 2. Python 未安装

```typescript
try {
  await execAsync('python --version');
} catch {
  vscode.window.showErrorMessage(
    '未检测到 Python 环境，请先安装 Python 3.10+'
  );
}
```

### 3. 转换超时

```typescript
await execAsync(command, { timeout: 60000 }); // 60秒超时
```

### 4. 文件读取/写入错误

```typescript
try {
  await fs.access(inputPath);
} catch {
  throw new Error(`文件不存在: ${inputPath}`);
}
```

### 5. 不支持的文件格式

```typescript
const supportedExts = ['.pdf', '.docx', '.xlsx', ...];
if (!supportedExts.includes(ext)) {
  vscode.window.showWarningMessage(
    `不支持的文件格式: ${ext}`
  );
}
```

---

## ⚙️ 配置选项

### VS Code 设置

```json
{
  "vibecoding.specs.autoWatch": true,           // 自动监听 specs/ 文件夹
  "vibecoding.specs.cleanMarkdown": true,       // 自动清理 Markdown 格式
  "vibecoding.specs.convertTimeout": 60000,     // 转换超时（毫秒）
  "vibecoding.specs.specsDir": "specs",         // 源文件夹
  "vibecoding.specs.outputDir": "Knowledge",    // 输出文件夹
  "vibecoding.specs.pythonPath": "python"       // Python 可执行文件路径
}
```

---

## 🧪 测试方案

### 单元测试

```typescript
// test/specs/converter.test.ts
describe('MarkItDownConverter', () => {
  it('should detect if MarkItDown is installed', async () => {
    const converter = MarkItDownConverter.getInstance();
    const isInstalled = await converter.isInstalled();
    expect(typeof isInstalled).toBe('boolean');
  });

  it('should convert PDF to Markdown', async () => {
    const converter = MarkItDownConverter.getInstance();
    const result = await converter.convert({
      inputPath: 'test/fixtures/sample.pdf',
      outputPath: 'test/output/sample.md'
    });
    expect(result.success).toBe(true);
  });
});
```

### 集成测试

```typescript
// test/specs/integration.test.ts
describe('Specs Converter Integration', () => {
  it('should watch and convert files automatically', async () => {
    const watcher = new SpecsWatcher(workspaceRoot);
    await watcher.startWatching();
    
    // 创建测试文件
    await fs.writeFile('specs/test.pdf', testContent);
    
    // 等待转换完成
    await sleep(5000);
    
    // 验证输出文件存在
    const outputExists = await fs.access('Knowledge/test.md');
    expect(outputExists).toBeTruthy();
  });
});
```

---

## 📦 依赖包

### package.json

```json
{
  "dependencies": {
    // VS Code 扩展开发
    "vscode": "^1.80.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@types/vscode": "^1.80.0",
    "typescript": "^5.0.0"
  }
}
```

**注意**：无需安装额外的 npm 包，只使用 Node.js 内置模块（child_process, fs, crypto, path）。

---

## 🚀 使用流程

### 开发者使用

1. **安装 Python 和 MarkItDown**（一次性）
   ```bash
   pip install 'markitdown[all]'
   ```

2. **创建 specs 文件夹**
   ```bash
   mkdir specs
   ```

3. **放入需求文档**
   ```
   specs/
   ├── PRD.pdf
   ├── API.docx
   └── test-cases.xlsx
   ```

4. **VS Code 中操作**
   - 方式 A：命令面板 → `VibeCoding: Convert Specs to Markdown`（批量转换）
   - 方式 B：命令面板 → `VibeCoding: Auto-Watch Specs Folder`（自动监听）

5. **查看结果**
   ```
   Knowledge/
   ├── PRD.md
   ├── API.md
   └── test-cases.md
   ```

---

## 📈 性能优化

### 1. 增量转换

只转换变更的文件（使用文件哈希对比）：

```typescript
const hasChanged = await hashUtil.hasFileChanged(inputPath);
if (!hasChanged) {
  return; // 跳过转换
}
```

### 2. 队列管理

使用任务队列避免并发冲突：

```typescript
// 顺序处理转换任务
await this.processQueue();
```

### 3. 超时控制

防止大文件转换卡死：

```typescript
await execAsync(command, { timeout: 60000 });
```

---

## 🎯 后续改进

- [ ] 支持并行转换（提升批量转换速度）
- [ ] 支持转换进度条（大文件）
- [ ] 支持转换缓存（避免重复转换）
- [ ] 支持自定义转换规则
- [ ] 支持转换历史记录
- [ ] 集成到 Activity Bar（专用视图）

---

**文档版本**：v1.0  
**最后更新**：2024-11-07  
**作者**：VibeCoding Team

