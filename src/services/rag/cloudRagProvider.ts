import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { GeminiClient } from '../geminiClient';
import { DatabaseService } from '../database';
import { IRAGProvider } from './ragProvider';
import { t } from '../../i18n/i18nService';

export class CloudRAGProvider implements IRAGProvider {
  private dbService: DatabaseService;
  private geminiClient: GeminiClient;
  private indexedFiles: Map<string, IndexedFile> = new Map();
  private storeId: string = '';
  private storeName: string = '';  // fileSearchStores/xxx 格式
  private projectName: string = '';
  private workspaceRoot: string = '';

  constructor(dbService: DatabaseService, geminiClient: GeminiClient) {
    this.dbService = dbService;
    this.geminiClient = geminiClient;
  }

  public async initialize(workspaceRoot: string): Promise<void> {
    this.workspaceRoot = workspaceRoot;
    this.projectName = path.basename(workspaceRoot);

    console.log('Initializing Cloud RAG Provider...');
    
    const client = this.geminiClient.getClient();
    if (!client) {
      throw new Error('Gemini client not initialized');
    }

    this.createStoreInfoTable();
    this.createIndexTable();
    
    await this.initializeStore();
    await this.loadIndexedFilesFromDB();
    
    // Note: File watching and initial scan are handled by the main RAGService or we should move it here?
    // The original RAGService handled file watching. It's better if the Provider handles the *actions* but maybe the Service handles the *watching*.
    // For now, let's assume the Service calls indexFile/removeFileFromIndex.
  }

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
    db.run(`CREATE INDEX IF NOT EXISTS idx_file_path ON indexed_files(file_path)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_store_id ON indexed_files(store_id)`);
    this.dbService.save();
  }

  private createStoreInfoTable(): void {
    const db = this.dbService.getDatabase();
    try {
        // Check for old schema and migrate if needed (from original code)
        const tableInfo = db.exec(`PRAGMA table_info(rag_store_info)`);
        if (tableInfo.length > 0 && tableInfo[0].values.length > 0) {
            const columns = tableInfo[0].values.map(row => row[1] as string);
            if (!columns.includes('store_name')) {
                db.run(`DROP TABLE IF EXISTS rag_store_info`);
                db.run(`DROP TABLE IF EXISTS indexed_files`);
            }
        }
    } catch (e) {}

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
  }

  private async initializeStore(): Promise<void> {
    const client = this.geminiClient.getClient();
    if (!client) return;

    this.storeId = this.generateProjectHash(this.workspaceRoot);
    const db = this.dbService.getDatabase();
    
    const result = db.exec(`SELECT * FROM rag_store_info WHERE store_id = ?`, [this.storeId]);

    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      this.storeName = row[2] as string;
    } else {
      const fileSearchStore = await client.fileSearchStores.create({
        config: { displayName: `vibecoding_${this.projectName}_${this.storeId}` }
      });

      this.storeName = fileSearchStore.name || '';
      if (!this.storeName) throw new Error('Store name is empty');

      const now = Date.now();
      db.run(
        `INSERT INTO rag_store_info (id, store_id, store_name, project_name, workspace_root, created_at, last_sync_at, file_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`store_${this.storeId}`, this.storeId, this.storeName, this.projectName, this.workspaceRoot, now, now, 0]
      );
      this.dbService.save();
    }
  }

  private generateProjectHash(workspaceRoot: string): string {
    return crypto.createHash('md5').update(workspaceRoot).digest('hex').substring(0, 8);
  }

  private async loadIndexedFilesFromDB(): Promise<void> {
    const db = this.dbService.getDatabase();
    const result = db.exec(`SELECT * FROM indexed_files WHERE store_id = ?`, [this.storeId]);

    if (result.length > 0 && result[0].values.length > 0) {
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
      }
    }
  }

  public async indexFile(filePath: string, workspaceRoot: string): Promise<void> {
    const client = this.geminiClient.getClient();
    if (!client) return;

    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return;

    const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    const mimeType = this.getMimeType(filePath);

    // Upload to Gemini
    let operation = await client.fileSearchStores.uploadToFileSearchStore({
      file: filePath,
      fileSearchStoreName: this.storeName,
      config: {
        displayName: fileName,
        mimeType,
      }
    });

    let attempts = 0;
    while (!operation.done && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await client.operations.get({ operation });
      attempts++;
    }

    if (!operation.done) throw new Error(t().extension.rag.indexFile.uploadTimeout(fileName));

    const geminiFileUri = operation.result?.name || `gemini_file_${Date.now()}`;
    const now = Date.now();
    const fileId = `file_${Date.now()}_${relativePath.replace(/[^a-zA-Z0-9]/g, '_')}`;

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

    const db = this.dbService.getDatabase();
    db.run(
      `INSERT OR REPLACE INTO indexed_files (id, file_path, file_name, file_size, mime_type, indexed_at, gemini_file_uri, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, relativePath, fileName, stats.size, mimeType, now, geminiFileUri, this.storeId]
    );
    this.dbService.save();

    this.indexedFiles.set(relativePath, indexedFile);
    await this.updateStoreFileCount();
    vscode.window.showInformationMessage(t().extension.rag.indexFile.success(fileName));
  }

  public async removeFileFromIndex(filePath: string, workspaceRoot: string): Promise<void> {
    const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    const db = this.dbService.getDatabase();
    db.run(`DELETE FROM indexed_files WHERE file_path = ? AND store_id = ?`, [relativePath, this.storeId]);
    this.dbService.save();
    this.indexedFiles.delete(relativePath);
    await this.updateStoreFileCount();
  }

  private async updateStoreFileCount(): Promise<void> {
    const fileCount = this.indexedFiles.size;
    const now = Date.now();
    const db = this.dbService.getDatabase();
    db.run(`UPDATE rag_store_info SET file_count = ?, last_sync_at = ? WHERE store_id = ?`, [fileCount, now, this.storeId]);
    this.dbService.save();
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.md': 'text/markdown', '.txt': 'text/plain', '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.json': 'application/json', '.ts': 'text/typescript', '.js': 'text/javascript',
      '.py': 'text/x-python', '.java': 'text/x-java', '.go': 'text/x-go',
      '.cpp': 'text/x-c++', '.c': 'text/x-c', '.h': 'text/x-c-header',
    };
    return mimeTypes[ext] || 'text/plain';
  }

  public async searchDocuments(query: string): Promise<SearchResult[]> {
    const client = this.geminiClient.getClient();
    if (!client || !this.storeName) throw new Error('Not initialized');

    const response = await client.models.generateContent({
      model: this.geminiClient.getConfiguredModel(),
      contents: query,
      config: { tools: [{ fileSearch: { fileSearchStoreNames: [this.storeName] } }] }
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const resultsMap = new Map<string, SearchResult>();

    if (groundingMetadata && groundingMetadata.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        const title = chunk.retrievedContext?.title;
        const uri = chunk.retrievedContext?.uri;
        
        let matchedFile: IndexedFile | null = null;
        for (const file of this.indexedFiles.values()) {
          if (file.fileName === title || file.geminiFileUri === uri) {
            matchedFile = file;
            break;
          }
        }

        if (matchedFile && !resultsMap.has(matchedFile.filePath)) {
          resultsMap.set(matchedFile.filePath, {
            fileName: matchedFile.fileName,
            filePath: matchedFile.filePath,
            snippet: response.text || '',
            relevance: 90
          });
        }
      }
    }
    return Array.from(resultsMap.values());
  }

  public async askQuestion(question: string): Promise<QuestionAnswerResult> {
    const client = this.geminiClient.getClient();
    if (!client || !this.storeName) throw new Error('Not initialized');

    const response = await client.models.generateContent({
      model: this.geminiClient.getConfiguredModel(),
      contents: question,
      config: { tools: [{ fileSearch: { fileSearchStoreNames: [this.storeName] } }] }
    });

    const answer = response.text || t().extension.rag.askQuestion.fallbackAnswer;
    const sources: string[] = [];
    const citations: string[] = [];

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        const title = chunk.retrievedContext?.title;
        if (title) {
          sources.push(title);
          citations.push(t().extension.rag.askQuestion.citationSource(title));
        }
      }
    }

    return {
      answer,
      sources: Array.from(new Set(sources)),
      citations: Array.from(new Set(citations))
    };
  }

  public async reindexAll(): Promise<void> {
     const client = this.geminiClient.getClient();
     if (!client) return;
     
     if (this.storeName) {
         try { await client.fileSearchStores.delete({ name: this.storeName }); } catch(e) {}
     }
     
     const db = this.dbService.getDatabase();
     db.run(`DELETE FROM indexed_files WHERE store_id = ?`, [this.storeId]);
     db.run(`DELETE FROM rag_store_info WHERE store_id = ?`, [this.storeId]);
     this.dbService.save();
     this.indexedFiles.clear();
     this.storeName = '';
     
     await this.initializeStore();
     // Re-scan is initiated by service
  }

  public getStoreInfo(): StoreInfo | null {
    const db = this.dbService.getDatabase();
    const result = db.exec(`SELECT * FROM rag_store_info WHERE store_id = ?`, [this.storeId]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    
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
  
  public getIndexedFiles(): IndexedFile[] {
      return Array.from(this.indexedFiles.values());
  }
  
  public async getStoreInfoFromCloud(): Promise<{ storeName: string; displayName: string | undefined; activeDocumentsCount: number; pendingDocumentsCount: number; failedDocumentsCount: number; } | null> {
      const client = this.geminiClient.getClient();
      if (!client || !this.storeName) return null;
      try {
        const store = await client.fileSearchStores.get({ name: this.storeName });
        return {
          storeName: store.name || this.storeName,
          displayName: store.displayName,
          activeDocumentsCount: parseInt(store.activeDocumentsCount || '0'),
          pendingDocumentsCount: parseInt(store.pendingDocumentsCount || '0'),
          failedDocumentsCount: parseInt(store.failedDocumentsCount || '0'),
        };
      } catch (e) { return null; }
  }

  public async testConnection(): Promise<boolean> {
    try {
        return await this.geminiClient.testConnection();
    } catch (e) {
        return false;
    }
  }

  public dispose(): void {}
}

