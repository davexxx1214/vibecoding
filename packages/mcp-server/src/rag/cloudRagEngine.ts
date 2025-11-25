import { createHash } from 'node:crypto';
import type Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import type { CloudRagSettings } from '../config.js';
import type { RagAnswer, RagEngine, RagSource } from './ragEngine.js';

type IndexedFileRow = {
  file_path: string;
  file_name: string;
  gemini_file_uri: string;
};

type Logger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export class CloudRagEngine implements RagEngine {
  private readonly storeId: string;
  private storeName: string | null = null;
  private readonly indexedByTitle = new Map<string, IndexedFileRow>();
  private readonly indexedByUri = new Map<string, IndexedFileRow>();
  private readonly client: GoogleGenAI;

  constructor(
    private readonly db: Database.Database,
    private readonly workspaceRoot: string,
    private readonly settings: CloudRagSettings,
    private readonly logger: Logger
  ) {
    this.storeId = createStoreId(normalizeWorkspaceRootForHash(workspaceRoot));
    this.client = new GoogleGenAI({
      apiKey: this.settings.apiKey
    });
  }

  public initialize(): void {
    if (!this.settings.apiKey) {
      throw new Error('未提供 Gemini API Key，无法使用云端 RAG。');
    }

    this.loadStoreInfo();
    this.loadIndexedFiles();

    if (!this.storeName) {
      throw new Error(
        '未找到云端 RAG Store 信息。请先在 VS Code 内完成 RAG 初始化。'
      );
    }

    this.logger.info(
      `[CloudRagEngine] Store ${this.storeName} loaded with ${this.indexedByTitle.size} indexed files.`
    );
  }

  public getStoreId(): string {
    return this.storeId;
  }

  public getMode(): 'local' | 'cloud' {
    return 'cloud';
  }

  public async ask(question: string): Promise<RagAnswer> {
    if (!this.storeName) {
      throw new Error('云端 RAG Store 未初始化。');
    }

    const response = await this.client.models.generateContent({
      model: this.settings.model || 'gemini-2.5-flash',
      contents: question,
      config: {
        tools: [{ fileSearch: { fileSearchStoreNames: [this.storeName] } }]
      }
    } as any);

    this.logger.debug?.(
      '[CloudRagEngine] raw response snippet:',
      safelyStringify(response)
    );

    const answer =
      (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
      (response as any).text ??
      '未能从云端知识库中获取答案。';
    const sources = this.extractSources(response);

    const answerWithStore =
      `${answer.trim()}\n\n(storeId: ${this.storeId})`;

    return {
      answer: answerWithStore,
      sources
    };
  }

  private loadStoreInfo(): void {
    const row = this.db
      .prepare(
        `SELECT store_name FROM rag_store_info WHERE store_id = ? LIMIT 1`
      )
      .get(this.storeId) as { store_name: string } | undefined;

    if (row && row.store_name) {
      this.storeName = row.store_name;
    }
  }

  private loadIndexedFiles(): void {
    const rows = this.db
      .prepare(
        `SELECT file_path, file_name, gemini_file_uri
         FROM indexed_files
         WHERE store_id = ?`
      )
      .all(this.storeId) as IndexedFileRow[];

    rows.forEach((row) => {
      this.indexedByTitle.set(row.file_name, row);
      if (row.gemini_file_uri) {
        this.indexedByUri.set(row.gemini_file_uri, row);
      }
    });
  }

  private extractSources(response: unknown): RagSource[] {
    const grounding =
      (response as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!Array.isArray(grounding)) {
      return [];
    }
    const sources: RagSource[] = [];

    for (const chunk of grounding) {
      const uri: string | undefined = chunk?.retrievedContext?.uri;
      const title: string | undefined = chunk?.retrievedContext?.title;
      const contentParts: Array<{ text?: string }> =
        chunk?.retrievedContext?.content?.parts ?? [];
      const snippet = contentParts
        .map((part) => part.text || '')
        .join('\n')
        .trim();

      const matched =
        (uri && this.indexedByUri.get(uri)) ||
        (title && this.indexedByTitle.get(title));

      if (matched) {
        sources.push({
          filePath: matched.file_path,
          relativePath: matched.file_path,
          snippet: snippet || '(来自云端文档)',
          relevance: chunk.score ? Number(chunk.score) : 0
        });
      } else if (title) {
        sources.push({
          filePath: title,
          relativePath: title,
          snippet: snippet || '(来自云端文档)',
          relevance: chunk.score ? Number(chunk.score) : 0
        });
      }
    }

    return dedupeSources(sources);
  }
}

function createStoreId(workspaceRoot: string): string {
  return createHash('md5').update(workspaceRoot).digest('hex').substring(0, 8);
}

function normalizeWorkspaceRootForHash(input: string): string {
  if (process.platform === 'win32') {
    return input.replace(/^[A-Z]:/, (drive) => drive.toLowerCase());
  }
  return input;
}

function dedupeSources(sources: RagSource[]): RagSource[] {
  const seen = new Map<string, RagSource>();
  for (const source of sources) {
    if (!seen.has(source.relativePath)) {
      seen.set(source.relativePath, source);
    }
  }
  return Array.from(seen.values());
}

function safelyStringify(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    if (!text) {
      return '[empty json]';
    }
    return text.length > 2000 ? `${text.slice(0, 2000)}...` : text;
  } catch (error) {
    return `[unserializable: ${error}]`;
  }
}

