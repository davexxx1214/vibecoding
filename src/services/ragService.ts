import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { GeminiClient } from './geminiClient';
import { DatabaseService } from './database';

/**
 * Store 信息
 */
export interface StoreInfo {
  id: string;
  storeId: string;  // Gemini File Search Store 的真实 ID
  storeName: string;  // Store 的完整名称（如 fileSearchStores/xxx）
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
  geminiFileUri: string;  // Gemini 返回的文件 URI
  storeId: string;  // 所属的 Store ID
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
  citations: string[];
}

/**
 * RAG Service - 使用 Gemini File Search Store API
 * 真正的 RAG 实现，无需手动解析文件
 */
export class RAGService {
  private dbService: DatabaseService;
  private geminiClient: GeminiClient;
  private indexedFiles: Map<string, IndexedFile> = new Map();
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private storeId: string = '';
  private storeName: string = '';  // fileSearchStores/xxx 格式
  private projectName: string = '';
  private workspaceRoot: string = '';

  constructor(dbService: DatabaseService, geminiClient: GeminiClient) {
    this.dbService = dbService;
    this.geminiClient = geminiClient;
  }

  /**
   * 初始化 RAG 服务
   */
  public async initialize(workspaceRoot: string): Promise<void> {
    try {
      this.workspaceRoot = workspaceRoot;
      this.projectName = path.basename(workspaceRoot);

      console.log('Initializing RAG Service...');
      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Project name: ${this.projectName}`);

      // 检查 Gemini Client 是否已初始化
      const client = this.geminiClient.getClient();
      if (!client) {
        console.warn('⚠️ Gemini client not initialized. RAG features will be disabled.');
        console.warn('Please configure your Gemini API Key in settings: knowledgeGraph.gemini.apiKey');
        throw new Error('Gemini client not initialized');
      }

      console.log('✅ Gemini client is initialized');

      // 创建数据库表（带迁移逻辑）
      const migrated = this.createStoreInfoTable();
      this.createIndexTable();
      
      if (migrated) {
        console.log('📢 数据库已迁移到新版本，需要重新索引文档');
      }

      // 初始化或加载 Store
      await this.initializeStore();

      // 从数据库加载已索引的文件
      await this.loadIndexedFilesFromDB();

      // 设置文件监听器
      this.setupFileWatcher(workspaceRoot);

      // 执行初始扫描
      await this.initialScan(workspaceRoot);

      console.log('✅ RAG Service initialized successfully');
      console.log(`📊 Indexed files: ${this.indexedFiles.size}`);
    } catch (error) {
      console.error('❌ RAG Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 创建索引文件表
   */
  private createIndexTable(): void {
    const db = this.dbService.getDatabase();
    
    db.run(`
      CREATE TABLE IF NOT EXISTS indexed_files (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        gemini_file_uri TEXT NOT NULL,
        store_id TEXT NOT NULL
      )
    `);

    // 创建索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_file_path ON indexed_files(file_path)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_store_id ON indexed_files(store_id)`);

    this.dbService.save();
  }

  /**
   * 创建 Store 信息表（带迁移逻辑）
   * @returns 是否进行了数据库迁移
   */
  private createStoreInfoTable(): boolean {
    const db = this.dbService.getDatabase();
    let migrated = false;
    
    // 检查表是否存在以及 schema 版本
    try {
      const tableInfo = db.exec(`PRAGMA table_info(rag_store_info)`);
      
      if (tableInfo.length > 0 && tableInfo[0].values.length > 0) {
        // 表已存在，检查是否有 store_name 字段
        const columns = tableInfo[0].values.map(row => row[1] as string);
        
        if (!columns.includes('store_name')) {
          console.log('⚠️ Detected old schema for rag_store_info table');
          console.log('🔄 Migrating to new schema...');
          
          // 旧 schema，需要迁移
          // 简单方案：删除旧表，创建新表
          db.run(`DROP TABLE IF EXISTS rag_store_info`);
          console.log('   Dropped old rag_store_info table');
          
          // 也删除旧的索引文件表，因为它们关联的 Store 信息已失效
          db.run(`DROP TABLE IF EXISTS indexed_files`);
          console.log('   Dropped old indexed_files table');
          
          console.log('✅ Migration completed, will create new tables');
          migrated = true;
        }
      }
    } catch (error) {
      // 表不存在或其他错误，继续创建
      console.log('Creating new rag_store_info table...');
    }
    
    // 创建新表（如果不存在）
    db.run(`
      CREATE TABLE IF NOT EXISTS rag_store_info (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL UNIQUE,
        store_name TEXT NOT NULL,
        project_name TEXT NOT NULL,
        workspace_root TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_sync_at INTEGER NOT NULL,
        file_count INTEGER NOT NULL DEFAULT 0
      )
    `);

    this.dbService.save();
    return migrated;
  }

  /**
   * 初始化或加载 Store
   */
  private async initializeStore(): Promise<void> {
    const client = this.geminiClient.getClient();
    if (!client) {
      console.log('Gemini client not initialized, skipping store initialization');
      return;
    }

    // 生成项目唯一的 Store ID
    this.storeId = this.generateProjectHash(this.workspaceRoot);
    console.log(`Project Store ID: vibecoding_${this.projectName}_${this.storeId}`);

    const db = this.dbService.getDatabase();
    
    // 检查数据库中是否已有 Store 记录
    const result = db.exec(
      `SELECT * FROM rag_store_info WHERE store_id = ?`,
      [this.storeId]
    );

    if (result.length > 0 && result[0].values.length > 0) {
      // Store 已存在，加载信息
      const row = result[0].values[0];
      this.storeName = row[2] as string;  // store_name
      console.log(`Loaded existing Store: ${this.storeName}`);
    } else {
      // 创建新的 File Search Store
      console.log('📝 Creating new File Search Store...');
      console.log(`   Project: ${this.projectName}`);
      console.log(`   Store ID: ${this.storeId}`);
      console.log(`   Display Name: vibecoding_${this.projectName}_${this.storeId}`);
      
      try {
        const fileSearchStore = await client.fileSearchStores.create({
          config: {
            displayName: `vibecoding_${this.projectName}_${this.storeId}`
          }
        });

        this.storeName = fileSearchStore.name || '';
        
        if (!this.storeName) {
          throw new Error('Store name is empty after creation');
        }
        
        console.log(`✅ Created new Store: ${this.storeName}`);
        console.log(`   Display Name: ${fileSearchStore.displayName || 'N/A'}`);

        // 保存到数据库
        const now = Date.now();
        db.run(
          `INSERT INTO rag_store_info 
           (id, store_id, store_name, project_name, workspace_root, created_at, last_sync_at, file_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `store_${this.storeId}`,
            this.storeId,
            this.storeName,
            this.projectName,
            this.workspaceRoot,
            now,
            now,
            0
          ]
        );
        this.dbService.save();
        console.log(`💾 Store info saved to database`);
      } catch (error) {
        console.error('❌ Failed to create File Search Store:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(`无法创建 File Search Store: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 生成项目 hash（用于 Store ID）
   */
  private generateProjectHash(workspaceRoot: string): string {
    return crypto.createHash('md5')
      .update(workspaceRoot)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * 从数据库加载已索引的文件
   */
  private async loadIndexedFilesFromDB(): Promise<void> {
    const db = this.dbService.getDatabase();
    const result = db.exec(
      `SELECT * FROM indexed_files WHERE store_id = ?`,
      [this.storeId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      console.log('No indexed files found in database');
      return;
    }

    console.log(`Database query result: ${result[0].values.length} rows`);
    console.log(`Columns:`, result[0].columns);

    for (const row of result[0].values) {
      const file: IndexedFile = {
        id: row[0] as string,
        filePath: row[1] as string,
        fileName: row[2] as string,
        fileSize: row[3] as number,
        mimeType: row[4] as string,
        indexedAt: row[5] as number,
        geminiFileUri: row[6] as string,
        storeId: row[7] as string,
      };
      
      this.indexedFiles.set(file.filePath, file);
      console.log(`Loaded file from DB: ${file.filePath}`);
    }

    console.log(`Loaded ${this.indexedFiles.size} indexed files from database`);
  }

  /**
   * 设置文件监听器
   */
  private setupFileWatcher(workspaceRoot: string): void {
    const knowledgeFolder = path.join(workspaceRoot, 'Knowledge');
    
    // 如果 Knowledge 文件夹不存在，创建它
    if (!fs.existsSync(knowledgeFolder)) {
      fs.mkdirSync(knowledgeFolder, { recursive: true });
    }

    // 监听 Knowledge 文件夹
    const pattern = new vscode.RelativePattern(knowledgeFolder, '**/*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    // 文件创建
    this.fileWatcher.onDidCreate(async (uri) => {
      console.log(`File created: ${uri.fsPath}`);
      await this.indexFile(uri.fsPath, workspaceRoot);
    });

    // 文件修改
    this.fileWatcher.onDidChange(async (uri) => {
      console.log(`File changed: ${uri.fsPath}`);
      await this.indexFile(uri.fsPath, workspaceRoot);
    });

    // 文件删除
    this.fileWatcher.onDidDelete(async (uri) => {
      console.log(`File deleted: ${uri.fsPath}`);
      await this.removeFileFromIndex(uri.fsPath, workspaceRoot);
    });

    console.log('File watcher set up successfully');
  }

  /**
   * 初始扫描
   */
  private async initialScan(workspaceRoot: string): Promise<void> {
    console.log('Performing initial scan of Knowledge folder...');
    
    const knowledgeFolder = path.join(workspaceRoot, 'Knowledge');
    if (!fs.existsSync(knowledgeFolder)) {
      console.log('Knowledge folder does not exist, skipping initial scan');
      return;
    }

    const files = this.scanDirectory(knowledgeFolder);
    let newFileCount = 0;

    for (const filePath of files) {
      const relativePath = this.getRelativePath(filePath, workspaceRoot);
      
      // 检查文件是否已索引
      if (!this.indexedFiles.has(relativePath)) {
        await this.indexFile(filePath, workspaceRoot);
        newFileCount++;
      }
    }

    if (newFileCount === 0) {
      console.log('All files are up to date');
    } else {
      console.log(`Indexed ${newFileCount} new files`);
    }
  }

  /**
   * 扫描目录
   */
  private scanDirectory(dirPath: string): string[] {
    const files: string[] = [];
    const supportedExtensions = ['.md', '.txt', '.pdf', '.json', '.ts', '.js', '.py', '.java', '.go', '.cpp', '.c', '.h'];

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
   * 索引单个文件 - 使用真正的 File Search Store API
   */
  private async indexFile(filePath: string, workspaceRoot: string): Promise<void> {
    try {
      const client = this.geminiClient.getClient();
      if (!client) {
        console.log('Gemini client not initialized, skipping indexing');
        return;
      }

      const relativePath = this.getRelativePath(filePath, workspaceRoot);
      const fileName = path.basename(filePath);
      const stats = fs.statSync(filePath);
      
      console.log(`Indexing file: ${relativePath}`);

      // 获取 MIME 类型
      const mimeType = this.getMimeType(filePath);

      // 直接上传到 Gemini File Search Store
      let operation = await client.fileSearchStores.uploadToFileSearchStore({
        file: filePath,
        fileSearchStoreName: this.storeName,
        config: {
          displayName: fileName
        }
      });

      console.log(`Upload initiated for: ${fileName}`);

      // 等待上传完成
      let attempts = 0;
      const maxAttempts = 60;  // 最多等待 5 分钟（60 * 5秒）
      
      while (!operation.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));  // 等待 5 秒
        operation = await client.operations.get({ operation });
        attempts++;
        
        if (attempts % 6 === 0) {  // 每 30 秒显示一次进度
          console.log(`Still uploading ${fileName}... (${attempts * 5}s elapsed)`);
        }
      }

      if (!operation.done) {
        throw new Error(`Upload timeout for ${fileName} after ${maxAttempts * 5} seconds`);
      }

      // 从 operation 中提取文件信息
      const geminiFileUri = operation.result?.name || `gemini_file_${Date.now()}`;
      console.log(`Upload completed for: ${fileName}, URI: ${geminiFileUri}`);

      const now = Date.now();
      const fileId = this.generateFileId(relativePath);
      
      // 创建完整的索引文件对象
      const indexedFile: IndexedFile = {
        id: fileId,
        filePath: relativePath,
        fileName,
        fileSize: stats.size,
        mimeType,
        indexedAt: now,
        geminiFileUri,
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

      // 添加到内存
      this.indexedFiles.set(relativePath, indexedFile);
      console.log(`Added to indexedFiles Map, current size: ${this.indexedFiles.size}`);

      // 更新 Store 文件数量
      await this.updateStoreFileCount();

      vscode.window.showInformationMessage(`✅ 成功索引: ${fileName}`);
      console.log(`Successfully indexed: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to index file ${filePath}:`, error);
      vscode.window.showErrorMessage(`索引文件失败: ${path.basename(filePath)} - ${error}`);
    }
  }

  /**
   * 从索引中移除文件
   */
  private async removeFileFromIndex(filePath: string, workspaceRoot: string): Promise<void> {
    const relativePath = this.getRelativePath(filePath, workspaceRoot);
    
    // 从数据库删除
    const db = this.dbService.getDatabase();
    db.run(`DELETE FROM indexed_files WHERE file_path = ? AND store_id = ?`, [relativePath, this.storeId]);
    this.dbService.save();

    // 从内存删除
    this.indexedFiles.delete(relativePath);
    
    // 更新文件数量
    await this.updateStoreFileCount();

    console.log(`Removed from index: ${relativePath}`);
    vscode.window.showInformationMessage(`已从索引中移除: ${path.basename(filePath)}`);
  }

  /**
   * 更新 Store 文件数量
   */
  private async updateStoreFileCount(): Promise<void> {
    const fileCount = this.indexedFiles.size;
    const now = Date.now();

    const db = this.dbService.getDatabase();
    db.run(
      `UPDATE rag_store_info 
       SET file_count = ?, last_sync_at = ?
       WHERE store_id = ?`,
      [fileCount, now, this.storeId]
    );
    this.dbService.save();
  }

  /**
   * 语义搜索 - 使用真正的 File Search
   */
  public async searchDocuments(query: string): Promise<SearchResult[]> {
    const client = this.geminiClient.getClient();
    if (!client) {
      throw new Error('Gemini 客户端未初始化');
    }

    if (!this.storeName) {
      throw new Error('File Search Store 未初始化');
    }

    console.log(`Search initiated for Store: ${this.storeName}`);
    console.log(`Searching for: "${query}"`);

    try {
      // 使用 File Search 工具进行检索
      const response = await client.models.generateContent({
        model: this.geminiClient.getConfiguredModel(),
        contents: query,
        config: {
          tools: [{
            fileSearch: {
              fileSearchStoreNames: [this.storeName]
            }
          }]
        }
      });

      console.log(`Search completed, parsing results...`);

      // 从 grounding metadata 中提取来源
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const resultsMap = new Map<string, SearchResult>(); // 使用 Map 去重

      if (groundingMetadata && groundingMetadata.groundingChunks) {
        console.log(`Found ${groundingMetadata.groundingChunks.length} grounding chunks`);
        
        for (const chunk of groundingMetadata.groundingChunks) {
          const title = chunk.retrievedContext?.title || 'Unknown';
          const uri = chunk.retrievedContext?.uri || '';
          
          // 从 indexedFiles 中查找匹配的文件
          let matchedFile: IndexedFile | null = null;
          for (const file of this.indexedFiles.values()) {
            if (file.fileName === title || file.geminiFileUri === uri) {
              matchedFile = file;
              break;
            }
          }

          if (matchedFile) {
            // 使用文件路径作为 key，避免重复
            if (!resultsMap.has(matchedFile.filePath)) {
              resultsMap.set(matchedFile.filePath, {
                fileName: matchedFile.fileName,
                filePath: matchedFile.filePath,
                snippet: response.text || '',  // 使用 AI 生成的完整答案
                relevance: 90
              });
            }
          }
        }
      }

      const results = Array.from(resultsMap.values());

      // 如果没有 grounding，但有响应，说明找到了相关内容
      if (results.length === 0 && response.text) {
        console.log('No grounding metadata, returning answer without specific sources');
        // 返回答案，但不关联特定文件
        // 这种情况下不返回文件列表，因为无法确定来源
      }

      console.log(`Found ${results.length} unique documents`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error(`搜索失败: ${error}`);
    }
  }

  /**
   * 智能问答 - 使用真正的 File Search
   */
  public async askQuestion(question: string): Promise<QuestionAnswerResult> {
    const client = this.geminiClient.getClient();
    if (!client) {
      throw new Error('Gemini 客户端未初始化');
    }

    if (!this.storeName) {
      throw new Error('File Search Store 未初始化');
    }

    console.log(`Asking question: "${question}"`);
    console.log(`Using Store: ${this.storeName}`);

    try {
      // 使用 File Search 工具进行问答
      const response = await client.models.generateContent({
        model: this.geminiClient.getConfiguredModel(),
        contents: question,
        config: {
          tools: [{
            fileSearch: {
              fileSearchStoreNames: [this.storeName]
            }
          }]
        }
      });

      const answer = response.text || '无法生成回答';
      const sources: string[] = [];
      const citations: string[] = [];

      // 从 grounding metadata 中提取来源
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          const title = chunk.retrievedContext?.title;
          const uri = chunk.retrievedContext?.uri;
          
          if (title) {
            sources.push(title);
            citations.push(`来源：${title}`);
          }
        }
      }

      return {
        answer,
        sources: Array.from(new Set(sources)),  // 去重
        citations: Array.from(new Set(citations))
      };
    } catch (error) {
      console.error('Question answering failed:', error);
      throw new Error(`问答失败: ${error}`);
    }
  }

  /**
   * 获取 Store 信息（从数据库）
   */
  public getStoreInfo(): StoreInfo | null {
    const db = this.dbService.getDatabase();
    const result = db.exec(
      `SELECT * FROM rag_store_info WHERE store_id = ?`,
      [this.storeId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    return {
      id: row[0] as string,
      storeId: row[1] as string,
      storeName: row[2] as string,
      projectName: row[3] as string,
      workspaceRoot: row[4] as string,
      createdAt: row[5] as number,
      lastSyncAt: row[6] as number,
      fileCount: row[7] as number,
    };
  }

  /**
   * 从云端获取 Store 的实时信息
   */
  public async getStoreInfoFromCloud(): Promise<{
    storeName: string;
    displayName: string | undefined;
    activeDocumentsCount: number;
    pendingDocumentsCount: number;
    failedDocumentsCount: number;
  } | null> {
    const client = this.geminiClient.getClient();
    if (!client || !this.storeName) {
      return null;
    }

    try {
      const store = await client.fileSearchStores.get({ name: this.storeName });
      return {
        storeName: store.name || this.storeName,
        displayName: store.displayName,
        activeDocumentsCount: parseInt(store.activeDocumentsCount || '0'),
        pendingDocumentsCount: parseInt(store.pendingDocumentsCount || '0'),
        failedDocumentsCount: parseInt(store.failedDocumentsCount || '0'),
      };
    } catch (error) {
      console.error('Failed to get store info from cloud:', error);
      return null;
    }
  }

  /**
   * 获取所有已索引的文件
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
      this.fileWatcher = null;
    }
  }
}

