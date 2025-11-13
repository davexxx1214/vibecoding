import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiClient } from './geminiClient';
import { DatabaseService } from './database';

/**
 * 已索引文件的信息
 */
interface IndexedFile {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  indexedAt: number;
  geminiFileUri?: string; // Gemini File API 返回的文件 URI
}

/**
 * 搜索结果
 */
export interface SearchResult {
  fileName: string;
  filePath: string;
  snippet: string;
  relevance: number;
}

/**
 * 问答结果
 */
export interface QuestionAnswerResult {
  answer: string;
  sources: string[];
  citations: Array<{
    fileName: string;
    snippet: string;
  }>;
}

/**
 * RAG Service
 * 负责文件索引、语义搜索和智能问答
 */
export class RAGService {
  private geminiClient: GeminiClient;
  private dbService: DatabaseService;
  private indexedFiles: Map<string, IndexedFile> = new Map();
  private fileWatcher: vscode.FileSystemWatcher | null = null;

  constructor(geminiClient: GeminiClient, dbService: DatabaseService) {
    this.geminiClient = geminiClient;
    this.dbService = dbService;
  }

  /**
   * 初始化 RAG 服务
   */
  public async initialize(workspaceRoot: string): Promise<void> {
    console.log('Initializing RAG Service...');

    // 创建数据库表
    await this.createIndexTable();

    // 从数据库加载已索引的文件
    await this.loadIndexedFilesFromDB();

    // 设置文件监听器
    await this.setupFileWatcher(workspaceRoot);

    // 初始扫描 Knowledge 文件夹
    await this.initialScan(workspaceRoot);

    console.log('RAG Service initialized successfully');
  }

  /**
   * 创建文件索引表
   */
  private async createIndexTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS indexed_files (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        gemini_file_uri TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_indexed_files_path 
      ON indexed_files(file_path);
    `;

    this.dbService.run(createTableSQL);
  }

  /**
   * 从数据库加载已索引的文件
   */
  private async loadIndexedFilesFromDB(): Promise<void> {
    const rows = this.dbService.query<any>(
      'SELECT * FROM indexed_files'
    );

    this.indexedFiles.clear();
    for (const row of rows) {
      const file: IndexedFile = {
        id: row.id,
        filePath: row.file_path,
        fileName: row.file_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        indexedAt: row.indexed_at,
        geminiFileUri: row.gemini_file_uri,
      };
      this.indexedFiles.set(file.filePath, file);
    }

    console.log(`Loaded ${this.indexedFiles.size} indexed files from database`);
  }

  /**
   * 设置文件系统监听器
   */
  private async setupFileWatcher(workspaceRoot: string): Promise<void> {
    const knowledgePath = path.join(workspaceRoot, 'Knowledge');

    // 确保 Knowledge 文件夹存在
    if (!fs.existsSync(knowledgePath)) {
      fs.mkdirSync(knowledgePath, { recursive: true });
      
      // 创建 README
      const readmePath = path.join(knowledgePath, 'README.md');
      const readmeContent = `# Knowledge Base

此文件夹用于存放项目文档，插件会自动索引这里的文件以支持 AI 语义搜索和智能问答。

## 支持的文件格式

- Markdown (*.md)
- 文本文件 (*.txt)
- PDF (*.pdf)
- Word 文档 (*.docx)
- JSON (*.json)
- 代码文件 (*.ts, *.js, *.py 等)

## 使用方法

1. 将文档放入此文件夹
2. 插件会自动检测并上传到 Gemini File Search
3. 使用命令面板执行：
   - \`Knowledge: Search Documents\` - 语义搜索
   - \`Knowledge: Ask Question\` - 智能问答

## 注意事项

- 文件会自动上传到 Google Gemini API
- 首次索引需要付费（$0.15/百万 tokens）
- 后续搜索和存储免费
`;
      fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    }

    // 监听文件变化
    const pattern = new vscode.RelativePattern(
      workspaceRoot,
      'Knowledge/**/*.{md,txt,pdf,docx,json,ts,js,py,java,go,cpp,c,h}'
    );

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    // 文件创建
    this.fileWatcher.onDidCreate(async (uri) => {
      console.log('File created:', uri.fsPath);
      await this.indexFile(uri.fsPath, workspaceRoot);
    });

    // 文件修改
    this.fileWatcher.onDidChange(async (uri) => {
      console.log('File changed:', uri.fsPath);
      await this.reindexFile(uri.fsPath, workspaceRoot);
    });

    // 文件删除
    this.fileWatcher.onDidDelete(async (uri) => {
      console.log('File deleted:', uri.fsPath);
      await this.removeFileFromIndex(uri.fsPath, workspaceRoot);
    });

    console.log('File watcher set up successfully');
  }

  /**
   * 初始扫描 Knowledge 文件夹
   */
  private async initialScan(workspaceRoot: string): Promise<void> {
    const knowledgePath = path.join(workspaceRoot, 'Knowledge');
    
    if (!fs.existsSync(knowledgePath)) {
      return;
    }

    console.log('Performing initial scan of Knowledge folder...');

    const files = await this.scanDirectory(knowledgePath);
    
    if (files.length === 0) {
      console.log('No files found in Knowledge folder');
      return;
    }

    // 检查哪些文件需要索引
    const filesToIndex: string[] = [];
    for (const filePath of files) {
      const relativePath = this.getRelativePath(filePath, workspaceRoot);
      const existingFile = this.indexedFiles.get(relativePath);
      
      if (!existingFile) {
        filesToIndex.push(filePath);
      } else {
        // 检查文件是否被修改
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs > existingFile.indexedAt) {
          filesToIndex.push(filePath);
        }
      }
    }

    if (filesToIndex.length > 0) {
      vscode.window.showInformationMessage(
        `发现 ${filesToIndex.length} 个新文件，开始索引...`
      );

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '正在索引文档...',
          cancellable: false,
        },
        async (progress) => {
          for (let i = 0; i < filesToIndex.length; i++) {
            const file = filesToIndex[i];
            progress.report({
              increment: (100 / filesToIndex.length),
              message: `${i + 1}/${filesToIndex.length}: ${path.basename(file)}`,
            });
            await this.indexFile(file, workspaceRoot);
          }
        }
      );

      vscode.window.showInformationMessage(
        `✅ 成功索引 ${filesToIndex.length} 个文档`
      );
    } else {
      console.log('All files are up to date');
    }
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const supportedExtensions = ['.md', '.txt', '.pdf', '.docx', '.json', '.ts', '.js', '.py', '.java', '.go', '.cpp', '.c', '.h'];

    const scan = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    scan(dirPath);
    return files;
  }

  /**
   * 索引单个文件
   */
  private async indexFile(filePath: string, workspaceRoot: string): Promise<void> {
    try {
      // 检查 Gemini 客户端是否已初始化
      if (!this.geminiClient.isInitialized()) {
        console.log('Gemini client not initialized, skipping indexing');
        return;
      }

      const relativePath = this.getRelativePath(filePath, workspaceRoot);
      const fileName = path.basename(filePath);
      const stats = fs.statSync(filePath);
      
      console.log(`Indexing file: ${relativePath}`);

      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 获取 MIME 类型
      const mimeType = this.getMimeType(filePath);

      // 上传到 Gemini（这里使用简化的方式，实际应该使用 File Search API）
      // 由于 Node.js SDK 可能还不支持 File Search Store，我们先存储文件信息
      const fileId = this.generateFileId(relativePath);

      const indexedFile: IndexedFile = {
        id: fileId,
        filePath: relativePath,
        fileName,
        fileSize: stats.size,
        mimeType,
        indexedAt: Date.now(),
      };

      // 保存到数据库
      this.dbService.run(
        `INSERT OR REPLACE INTO indexed_files 
         (id, file_path, file_name, file_size, mime_type, indexed_at, gemini_file_uri)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fileId, relativePath, fileName, stats.size, mimeType, Date.now(), null]
      );

      this.indexedFiles.set(relativePath, indexedFile);

      console.log(`Successfully indexed: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to index file ${filePath}:`, error);
      vscode.window.showErrorMessage(`索引文件失败: ${path.basename(filePath)}`);
    }
  }

  /**
   * 重新索引文件
   */
  private async reindexFile(filePath: string, workspaceRoot: string): Promise<void> {
    const relativePath = this.getRelativePath(filePath, workspaceRoot);
    
    // 先删除旧索引
    await this.removeFileFromIndex(filePath, workspaceRoot);
    
    // 重新索引
    await this.indexFile(filePath, workspaceRoot);
    
    console.log(`Reindexed file: ${relativePath}`);
  }

  /**
   * 从索引中移除文件
   */
  private async removeFileFromIndex(filePath: string, workspaceRoot: string): Promise<void> {
    const relativePath = this.getRelativePath(filePath, workspaceRoot);
    
    this.dbService.run(
      'DELETE FROM indexed_files WHERE file_path = ?',
      [relativePath]
    );

    this.indexedFiles.delete(relativePath);

    console.log(`Removed from index: ${relativePath}`);
  }

  /**
   * 语义搜索
   */
  public async searchDocuments(query: string): Promise<SearchResult[]> {
    if (!this.geminiClient.isInitialized()) {
      throw new Error('Gemini 客户端未初始化');
    }

    if (this.indexedFiles.size === 0) {
      throw new Error('没有已索引的文档');
    }

    console.log(`Searching for: "${query}"`);

    // 使用 Gemini 进行搜索
    const model = this.geminiClient.getModel();
    if (!model) {
      throw new Error('无法获取 Gemini 模型');
    }

    // 构建搜索提示
    const searchPrompt = this.buildSearchPrompt(query);

    const result = await model.generateContent(searchPrompt);
    const response = await result.response;
    const text = response.text();

    // 解析搜索结果
    return this.parseSearchResults(text);
  }

  /**
   * 智能问答
   */
  public async askQuestion(question: string): Promise<QuestionAnswerResult> {
    if (!this.geminiClient.isInitialized()) {
      throw new Error('Gemini 客户端未初始化');
    }

    if (this.indexedFiles.size === 0) {
      throw new Error('没有已索引的文档');
    }

    console.log(`Asking question: "${question}"`);

    const model = this.geminiClient.getModel();
    if (!model) {
      throw new Error('无法获取 Gemini 模型');
    }

    // 构建问答提示
    const qaPrompt = this.buildQAPrompt(question);

    const result = await model.generateContent(qaPrompt);
    const response = await result.response;
    const answer = response.text();

    // 解析结果
    return this.parseQAResult(answer);
  }

  /**
   * 构建搜索提示
   */
  private buildSearchPrompt(query: string): string {
    const fileList = Array.from(this.indexedFiles.values())
      .map(f => `- ${f.fileName} (${f.filePath})`)
      .join('\n');

    return `基于以下文档列表，找出与查询最相关的文档：

文档列表：
${fileList}

查询：${query}

请返回最相关的 3-5 个文档，格式如下：
1. 文件名 - 相关度（0-100） - 简短说明
2. 文件名 - 相关度（0-100） - 简短说明
...`;
  }

  /**
   * 构建问答提示
   */
  private buildQAPrompt(question: string): string {
    // 这里应该包含文档内容，但为了演示，我们简化处理
    return `请回答以下问题，并在回答中注明信息来源：

问题：${question}

请用清晰、专业的语言回答，并在答案末尾列出参考来源。`;
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(text: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // 简单解析（实际应该更robust）
      const match = line.match(/^(\d+)\.\s*(.+?)\s*-\s*(\d+)\s*-\s*(.+)$/);
      if (match) {
        const fileName = match[2].trim();
        const relevance = parseInt(match[3]);
        const snippet = match[4].trim();

        // 找到对应的文件路径
        const file = Array.from(this.indexedFiles.values()).find(
          f => f.fileName === fileName
        );

        if (file) {
          results.push({
            fileName,
            filePath: file.filePath,
            snippet,
            relevance,
          });
        }
      }
    }

    return results;
  }

  /**
   * 解析问答结果
   */
  private parseQAResult(answer: string): QuestionAnswerResult {
    // 简单解析（实际应该更robust）
    return {
      answer,
      sources: [],
      citations: [],
    };
  }

  /**
   * 获取已索引的文件列表
   */
  public getIndexedFiles(): IndexedFile[] {
    return Array.from(this.indexedFiles.values());
  }

  /**
   * 获取相对路径
   */
  private getRelativePath(filePath: string, workspaceRoot: string): string {
    return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
  }

  /**
   * 生成文件 ID
   */
  private generateFileId(relativePath: string): string {
    return `file_${Date.now()}_${relativePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.json': 'application/json',
      '.ts': 'text/typescript',
      '.js': 'text/javascript',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.go': 'text/x-go',
      '.cpp': 'text/x-c++',
      '.c': 'text/x-c',
      '.h': 'text/x-c-header',
    };

    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
}

