import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';

export interface KnowledgeOverview {
  entityCount: number;
  relationCount: number;
  observationCount: number;
  lastUpdatedAt: string | null;
}

type OverviewRow = {
  entityCount: number | null;
  relationCount: number | null;
  observationCount: number | null;
  lastUpdatedAt: number | null;
};

export class GraphDatabase {
  private db: Database.Database | undefined;

  constructor(private readonly dbPath: string) {}

  open(): void {
    if (!existsSync(this.dbPath)) {
      throw new Error(
        `未找到 graph.sqlite。请确认已在 VS Code 中运行过 VibeKnowledge 插件。\n期望路径：${this.dbPath}`
      );
    }

    this.db = new Database(this.dbPath, {
      readonly: true,
      fileMustExist: true
    });
  }

  close(): void {
    this.db?.close();
    this.db = undefined;
  }

  getOverview(): KnowledgeOverview {
    const row = this.ensureDb()
      .prepare(
        `
        SELECT
          (SELECT COUNT(*) FROM entities) AS entityCount,
          (SELECT COUNT(*) FROM relations) AS relationCount,
          (SELECT COUNT(*) FROM observations) AS observationCount,
          (
            SELECT MAX(ts)
            FROM (
              SELECT MAX(updated_at) AS ts FROM entities
              UNION ALL
              SELECT MAX(updated_at) FROM observations
            )
          ) AS lastUpdatedAt
      `
      )
      .get() as OverviewRow | undefined;

    return {
      entityCount: row?.entityCount ?? 0,
      relationCount: row?.relationCount ?? 0,
      observationCount: row?.observationCount ?? 0,
      lastUpdatedAt: row?.lastUpdatedAt
        ? new Date(row.lastUpdatedAt).toISOString()
        : null
    };
  }

  private ensureDb(): Database.Database {
    if (!this.db) {
      throw new Error('数据库尚未初始化，请先调用 open()');
    }
    return this.db;
  }
}

