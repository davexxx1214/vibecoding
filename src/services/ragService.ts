import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiClient } from './geminiClient';
import { DatabaseService } from './database';

/**
 * Store 信息
 */
export interface StoreInfo {
  id: string;
  storeId: string;
  projectName: string;
  workspaceRoot: string;
  createdAt: number;
  lastSyncAt: number;
  fileCount: number;
}

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
  storeId?: string; // 所属的 Store ID
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
  private storeId: string = '';
  private projectName: string = '';
  private workspaceRoot: string = '';

  constructor(geminiClient: GeminiClient, dbService: DatabaseService) {
    this.geminiClient = geminiClient;
    this.dbService = dbService;
  }

  /**
   * 初始化 RAG 服务
   */
  public async initialize(workspaceRoot: string): Promise<void> {
    console.log('Initializing RAG Service...');

    this.workspaceRoot = workspaceRoot;
    this.projectName = path.basename(workspaceRoot);

    // 创建数据库表
    await this.createIndexTable();
    await this.createStoreInfoTable();

    // 初始化或加载 Store ID
    await this.initializeStore();

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
    const db = this.dbService.getDatabase();
    
    db.run(`
      CREATE TABLE IF NOT EXISTS indexed_files (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        gemini_file_uri TEXT,
        store_id TEXT
      )
    `);
    
    db.run('CREATE INDEX IF NOT EXISTS idx_indexed_files_path ON indexed_files(file_path)');
    db.run('CREATE INDEX IF NOT EXISTS idx_indexed_files_store ON indexed_files(store_id)');
    
    this.dbService.save();
  }

  /**
   * 创建 Store 信息表
   */
  private async createStoreInfoTable(): Promise<void> {
    const db = this.dbService.getDatabase();
    
    db.run(`
      CREATE TABLE IF NOT EXISTS rag_store_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL UNIQUE,
        project_name TEXT NOT NULL,
        workspace_root TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_sync_at INTEGER,
        file_count INTEGER DEFAULT 0
      )
    `);
    
    this.dbService.save();
  }

  /**
   * 初始化或加载 Store
   */
  private async initializeStore(): Promise<void> {
    // 生成项目唯一的 Store ID
    const projectHash = this.generateProjectHash(this.workspaceRoot);
    this.storeId = `vibecoding_${this.projectName}_${projectHash}`;

    console.log(`Project Store ID: ${this.storeId}`);

    const db = this.dbService.getDatabase();

    // 检查数据库中是否已有 Store 记录
    const result = db.exec('SELECT * FROM rag_store_info WHERE store_id = ?', [this.storeId]);

    if (result.length === 0 || result[0].values.length === 0) {
      // 创建新的 Store 记录
      db.run(
        `INSERT INTO rag_store_info 
         (store_id, project_name, workspace_root, created_at, file_count)
         VALUES (?, ?, ?, ?, ?)`,
        [this.storeId, this.projectName, this.workspaceRoot, Date.now(), 0]
      );

      this.dbService.save();
      console.log(`Created new Store record: ${this.storeId}`);
    } else {
      console.log(`Loaded existing Store: ${this.storeId}`);
    }
  }

  /**
   * 生成项目 hash
   */
  private generateProjectHash(workspaceRoot: string): string {
    const hash = crypto.createHash('md5');
    hash.update(workspaceRoot);
    return hash.digest('hex').slice(0, 8);
  }

  /**
   * 从数据库加载已索引的文件
   */
  private async loadIndexedFilesFromDB(): Promise<void> {
    try {
      const db = this.dbService.getDatabase();
      const result = db.exec('SELECT * FROM indexed_files');

      console.log(`Database query result:`, result.length > 0 ? `${result[0].values.length} rows` : 'no data');

      this.indexedFiles.clear();
      
      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values;

        console.log(`Columns:`, columns);

        for (const row of values) {
          const file: IndexedFile = {
            id: row[columns.indexOf('id')] as string,
            filePath: row[columns.indexOf('file_path')] as string,
            fileName: row[columns.indexOf('file_name')] as string,
            fileSize: row[columns.indexOf('file_size')] as number,
            mimeType: row[columns.indexOf('mime_type')] as string,
            indexedAt: row[columns.indexOf('indexed_at')] as number,
            geminiFileUri: row[columns.indexOf('gemini_file_uri')] as string | undefined,
            storeId: row[columns.indexOf('store_id')] as string | undefined,
          };
          this.indexedFiles.set(file.filePath, file);
          console.log(`Loaded file from DB: ${file.filePath}`);
        }
      }

      // 更新 Store 的文件计数
      this.updateStoreFileCount();

      console.log(`Loaded ${this.indexedFiles.size} indexed files from database`);
    } catch (error) {
      console.error('Error loading indexed files from database:', error);
      this.indexedFiles.clear();
    }
  }

  /**
   * 更新 Store 文件计数
   */
  private updateStoreFileCount(): void {
    if (!this.storeId) {
      return;
    }

    const db = this.dbService.getDatabase();
    db.run(
      'UPDATE rag_store_info SET file_count = ?, last_sync_at = ? WHERE store_id = ?',
      [this.indexedFiles.size, Date.now(), this.storeId]
    );
    this.dbService.save();
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

      // 尝试上传到 Gemini（如果客户端已初始化）
      let geminiFileUri: string | null = null;
      if (this.geminiClient.isInitialized()) {
        try {
          const uploadResult = await this.uploadToGemini(filePath, content);
          geminiFileUri = uploadResult || null;
          console.log(`Uploaded to Gemini: ${geminiFileUri}`);
        } catch (error) {
          console.warn(`Failed to upload to Gemini: ${error}`);
          // 上传失败不影响本地索引
        }
      }

      const now = Date.now();
      
      // 创建完整的索引文件对象
      const indexedFile: IndexedFile = {
        id: fileId,
        filePath: relativePath,
        fileName,
        fileSize: stats.size,
        mimeType,
        indexedAt: now,
        geminiFileUri: geminiFileUri || undefined,
        storeId: this.storeId,
      };

      // 保存到数据库
      const db = this.dbService.getDatabase();
      db.run(
        `INSERT OR REPLACE INTO indexed_files 
         (id, file_path, file_name, file_size, mime_type, indexed_at, gemini_file_uri, store_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fileId, relativePath, fileName, stats.size, mimeType, now, geminiFileUri, this.storeId]
      );
      this.dbService.save();

      this.indexedFiles.set(relativePath, indexedFile);
      this.updateStoreFileCount();
      
      console.log(`Added to indexedFiles Map, current size: ${this.indexedFiles.size}`);

      console.log(`Successfully indexed: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to index file ${filePath}:`, error);
      vscode.window.showErrorMessage(`索引文件失败: ${path.basename(filePath)}`);
    }
  }

  /**
   * 上传文件到 Gemini File Search Store
   */
  private async uploadToGemini(filePath: string, content: string): Promise<string | null> {
    // TODO: 实现实际的 Gemini File Search Store 上传
    // 由于当前 @google/generative-ai SDK 可能还不支持 File Search Store API
    // 这里先返回 null，表示使用本地模式
    
    // 未来实现示例：
    // const client = new genai.Client();
    // const uploadOp = await client.file_search_stores.upload_to_file_search_store({
    //   file_search_store_name: this.storeId,
    //   file: content,
    //   metadata: {
    //     project: this.projectName,
    //     file_path: filePath
    //   }
    // });
    // 
    // while (!uploadOp.done) {
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    //   uploadOp = await client.operations.get(uploadOp);
    // }
    // 
    // return uploadOp.file_uri;

    // 暂时返回 null，表示使用本地模式
    return null;
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
    
    const db = this.dbService.getDatabase();
    db.run('DELETE FROM indexed_files WHERE file_path = ?', [relativePath]);
    this.dbService.save();

    this.indexedFiles.delete(relativePath);
    this.updateStoreFileCount();

    console.log(`Removed from index: ${relativePath}`);
  }

  /**
   * 获取 Store 信息
   */
  public getStoreInfo(): StoreInfo | null {
    if (!this.storeId) {
      return null;
    }

    try {
      const db = this.dbService.getDatabase();
      const result = db.exec('SELECT * FROM rag_store_info WHERE store_id = ?', [this.storeId]);

      if (result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const columns = result[0].columns;
      const row = result[0].values[0];

      return {
        id: String(row[columns.indexOf('id')]),
        storeId: row[columns.indexOf('store_id')] as string,
        projectName: row[columns.indexOf('project_name')] as string,
        workspaceRoot: row[columns.indexOf('workspace_root')] as string,
        createdAt: row[columns.indexOf('created_at')] as number,
        lastSyncAt: (row[columns.indexOf('last_sync_at')] as number) || 0,
        fileCount: (row[columns.indexOf('file_count')] as number) || 0,
      };
    } catch (error) {
      console.error('Error getting store info:', error);
      return null;
    }
  }

  /**
   * 语义搜索
   */
  public async searchDocuments(query: string): Promise<SearchResult[]> {
    console.log(`Search initiated. Indexed files count: ${this.indexedFiles.size}`);
    console.log(`Indexed files:`, Array.from(this.indexedFiles.keys()));

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
    const workspaceRoot = this.workspaceRoot;
    
    // 构建包含文件内容的文档列表
    const documentsWithContent = Array.from(this.indexedFiles.values())
      .map(f => {
        try {
          const fullPath = path.join(workspaceRoot, f.filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          // 限制内容长度，避免超过 token 限制
          const truncatedContent = content.length > 2000 
            ? content.slice(0, 2000) + '\n...(内容已截断)' 
            : content;
          
          return `### ${f.fileName} (${f.filePath})
\`\`\`
${truncatedContent}
\`\`\``;
        } catch (error) {
          console.error(`Failed to read file ${f.filePath}:`, error);
          return `### ${f.fileName} (${f.filePath})
[无法读取文件内容]`;
        }
      })
      .join('\n\n');

    return `基于以下文档内容，找出与查询最相关的文档：

## 文档内容

${documentsWithContent}

## 查询

${query}

## 要求

请分析每个文档与查询的相关性，返回最相关的文档。对每个文档给出：
1. 文件名
2. 相关度（0-100分）
3. 相关原因（简要说明为什么相关或不相关）

格式如下：
1. 文件名 - 相关度 - 相关原因
2. 文件名 - 相关度 - 相关原因
...

如果没有相关文档，请说明原因。`;
  }

  /**
   * 构建问答提示
   */
  private buildQAPrompt(question: string): string {
    const workspaceRoot = this.workspaceRoot;
    
    // 构建包含文件内容的知识库
    const documentsWithContent = Array.from(this.indexedFiles.values())
      .map(f => {
        try {
          const fullPath = path.join(workspaceRoot, f.filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          // 限制内容长度
          const truncatedContent = content.length > 3000 
            ? content.slice(0, 3000) + '\n...(内容已截断)' 
            : content;
          
          return `### 来源：${f.fileName} (${f.filePath})
\`\`\`
${truncatedContent}
\`\`\``;
        } catch (error) {
          console.error(`Failed to read file ${f.filePath}:`, error);
          return `### 来源：${f.fileName} (${f.filePath})
[无法读取文件内容]`;
        }
      })
      .join('\n\n');

    return `请基于以下知识库内容回答问题，并在回答中引用具体的来源文档。

## 知识库

${documentsWithContent}

## 问题

${question}

## 要求

1. 基于上述文档内容回答问题
2. 如果文档中包含相关信息，请引用具体的文件名
3. 如果文档中没有相关信息，请明确说明
4. 提供准确、详细的回答

请用中文回答。`;
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

