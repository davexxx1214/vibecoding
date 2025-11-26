import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';

export interface KnowledgeOverview {
  entityCount: number;
  relationCount: number;
  observationCount: number;
  lastUpdatedAt: string | null;
}

export interface EntityRecord {
  id: string;
  name: string;
  type: string;
  filePath: string;
  startLine: number;
  endLine: number;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

export interface ObservationRecord {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  filePath: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface SearchEntitiesParams {
  query?: string;
  type?: string;
  filePath?: string;
  limit?: number;
}

export interface SearchObservationsParams {
  query?: string;
  entityId?: string;
  limit?: number;
}

type OverviewRow = {
  entityCount: number | null;
  relationCount: number | null;
  observationCount: number | null;
  lastUpdatedAt: number | null;
};

type EntityRow = {
  id: string;
  name: string;
  type: string;
  file_path: string;
  start_line: number;
  end_line: number;
  description: string | null;
  metadata: string | null;
  created_at: number;
  updated_at: number;
};

type ObservationRow = {
  id: string;
  entity_id: string;
  content: string;
  created_at: number;
  updated_at: number;
  entity_name: string;
  entity_type: string;
  file_path: string;
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

  searchEntities(params: SearchEntitiesParams = {}): EntityRecord[] {
    const { query, type, filePath, limit } = params;
    const clauses: string[] = [];
    const values: (string | number)[] = [];

    if (query?.trim()) {
      const like = `%${query.trim()}%`;
      clauses.push('(name LIKE ? OR file_path LIKE ? OR description LIKE ?)');
      values.push(like, like, like);
    }

    if (type?.trim()) {
      clauses.push('type = ?');
      values.push(type.trim());
    }

    if (filePath?.trim()) {
      clauses.push('file_path LIKE ?');
      values.push(`%${filePath.trim()}%`);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const safeLimit = this.clampLimit(limit);

    const rows = this.ensureDb()
      .prepare(
        `
        SELECT
          id,
          name,
          type,
          file_path,
          start_line,
          end_line,
          description,
          metadata,
          created_at,
          updated_at
        FROM entities
        ${whereClause}
        ORDER BY updated_at DESC
        LIMIT ?
      `
      )
      .all(...values, safeLimit) as EntityRow[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      filePath: row.file_path,
      startLine: row.start_line,
      endLine: row.end_line,
      description: row.description,
      metadata: row.metadata ? this.safeParseJson(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  searchObservations(
    params: SearchObservationsParams = {}
  ): ObservationRecord[] {
    const { query, entityId, limit } = params;
    const clauses: string[] = [];
    const values: (string | number)[] = [];

    if (entityId?.trim()) {
      clauses.push('o.entity_id = ?');
      values.push(entityId.trim());
    }

    if (query?.trim()) {
      const like = `%${query.trim()}%`;
      clauses.push(
        '(o.content LIKE ? OR e.name LIKE ? OR e.file_path LIKE ?)'
      );
      values.push(like, like, like);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const safeLimit = this.clampLimit(limit);

    const rows = this.ensureDb()
      .prepare(
        `
        SELECT
          o.id,
          o.entity_id,
          o.content,
          o.created_at,
          o.updated_at,
          e.name AS entity_name,
          e.type AS entity_type,
          e.file_path AS file_path
        FROM observations o
        INNER JOIN entities e ON e.id = o.entity_id
        ${whereClause}
        ORDER BY o.updated_at DESC
        LIMIT ?
      `
      )
      .all(...values, safeLimit) as ObservationRow[];

    return rows.map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      entityName: row.entity_name,
      entityType: row.entity_type,
      filePath: row.file_path,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private ensureDb(): Database.Database {
    if (!this.db) {
      throw new Error('数据库尚未初始化，请先调用 open()');
    }
    return this.db;
  }

  public getConnection(): Database.Database {
    return this.ensureDb();
  }

  private clampLimit(limit?: number): number {
    if (typeof limit !== 'number' || Number.isNaN(limit)) {
      return 20;
    }
    return Math.max(1, Math.min(limit, 100));
  }

  private safeParseJson(value: string | null): Record<string, unknown> | null {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

