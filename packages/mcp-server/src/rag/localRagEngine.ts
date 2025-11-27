import { createHash } from 'node:crypto';
import { join, normalize } from 'node:path';
import type Database from 'better-sqlite3';
import type { RagAnswer, RagEngine, RagSource } from './ragEngine.js';
import type { LocalRagSettings } from '../config.js';

type ChunkRecord = {
  filePath: string;
  relativePath: string;
  snippet: string;
  vector: number[];
};

export class LocalRagEngine implements RagEngine {
  private readonly storeId: string;
  private readonly chunks: ChunkRecord[] = [];

  constructor(
    private readonly db: Database.Database,
    private readonly workspaceRoot: string,
    private readonly settings: LocalRagSettings,
    private readonly logger: {
      debug: (...args: unknown[]) => void;
      info: (...args: unknown[]) => void;
      warn?: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
    }
  ) {
    this.storeId = createStoreId(normalizeWorkspaceRootForHash(workspaceRoot));
  }

  public initialize(): void {
    try {
      const statement = this.db.prepare(
        `SELECT file_path, chunk_text, vector_json
         FROM local_rag_vectors
         WHERE store_id = ?`
      );
      const rows = statement.all(this.storeId) as Array<{
        file_path: string;
        chunk_text: string;
        vector_json: string;
      }>;

      rows.forEach((row) => {
        try {
          if (!row.vector_json) return;
          const parsed = JSON.parse(row.vector_json);
          if (!Array.isArray(parsed)) return;

          this.chunks.push({
            filePath: join(this.workspaceRoot, normalize(row.file_path)),
            relativePath: row.file_path,
            snippet: row.chunk_text,
            vector: parsed
          });
        } catch (error) {
          this.logger.warn?.('Failed to parse vector row for RAG chunk', error);
        }
      });

      this.logger.info(
        `[LocalRagEngine] Loaded ${this.chunks.length} chunks for store ${this.storeId}`
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('no such table: local_rag_vectors')
      ) {
        this.logger.info(
          '[LocalRagEngine] local_rag_vectors table not found, skipping load'
        );
        return;
      }
      throw error;
    }
  }

  public getStoreId(): string {
    return this.storeId;
  }

  public getMode(): 'local' | 'cloud' {
    return 'local';
  }

  public async ask(question: string): Promise<RagAnswer> {
    if (!this.settings.apiBase || !this.settings.apiKey) {
      throw new Error(
        'RAG API 未配置。请通过 VS Code 设置或 CLI 参数提供 apiBase 和 apiKey。'
      );
    }

    if (this.chunks.length === 0) {
      throw new Error('当前项目没有可用的 RAG 文档，请先在 VS Code 中索引。');
    }

    const queryVector = await this.getEmbedding(question);
    const topSources = this.selectTopChunks(queryVector);

    if (topSources.length === 0) {
      return {
        answer: '未在知识库中找到相关文档。',
        sources: []
      };
    }

    const context = topSources
      .map(
        (source, index) =>
          `# Source ${index + 1}: ${source.relativePath}\n${source.snippet}`
      )
      .join('\n\n');

    const prompt = `你是一个帮助开发者回答项目问题的助手。请只根据提供的上下文作答，如果上下文中没有答案，请明确说明不知道。\n\n上下文：\n${context}\n\n问题：${question}\n\n答案：`;

    const answer = await this.generateAnswer(prompt);

    return {
      answer,
      sources: topSources
    };
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.settings.apiBase}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: this.settings.embeddingModel
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Embedding API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    if (!Array.isArray(data.data) || !data.data[0]) {
      throw new Error('Embedding API 返回数据格式异常');
    }

    return data.data[0].embedding;
  }

  private selectTopChunks(queryVector: number[]): RagSource[] {
    const scored = this.chunks
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryVector, chunk.vector)
      }))
      .filter((item) => Number.isFinite(item.score) && item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored.map((item) => ({
      filePath: item.chunk.filePath,
      relativePath: item.chunk.relativePath,
      snippet: item.chunk.snippet,
      relevance: Number(item.score.toFixed(3))
    }));
  }

  private async generateAnswer(prompt: string): Promise<string> {
    const response = await fetch(`${this.settings.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.inferenceModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Chat API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      throw new Error('聊天模型未返回答案');
    }
    return answer.trim();
  }
}

function createStoreId(workspaceRoot: string): string {
  return (
    'local_' +
    createHash('md5').update(workspaceRoot).digest('hex').substring(0, 8)
  );
}

function normalizeWorkspaceRootForHash(input: string): string {
  if (process.platform === 'win32') {
    return input.replace(/^[A-Z]:/, (drive) => drive.toLowerCase());
  }
  return input;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

