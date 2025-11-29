/**
 * Mock Database Service for testing
 * 提供一个内存中的数据库模拟实现，用于测试服务层
 */

import type { Database as SqlJsDatabase } from 'sql.js';

interface MockRow {
  [key: string]: any;
}

interface MockStatement {
  bind: (params?: any[]) => void;
  step: () => boolean;
  getAsObject: () => MockRow;
  run: (params?: any[]) => void;
  free: () => void;
}

/**
 * 创建 mock 数据库实例
 */
export function createMockDatabase() {
  const tables: Record<string, MockRow[]> = {
    entities: [],
    relations: [],
    observations: [],
  };

  let currentQuery = '';
  let currentParams: any[] = [];
  let currentRowIndex = 0;
  let queryResults: MockRow[] = [];

  const mockStatement: MockStatement = {
    bind: (params?: any[]) => {
      currentParams = params || [];
    },
    step: () => {
      if (currentRowIndex < queryResults.length) {
        currentRowIndex++;
        return true;
      }
      return false;
    },
    getAsObject: () => {
      return queryResults[currentRowIndex - 1] || {};
    },
    run: (params?: any[]) => {
      currentParams = params || currentParams;
      executeQuery(currentQuery, currentParams);
    },
    free: () => {
      currentRowIndex = 0;
      queryResults = [];
    },
  };

  function executeQuery(query: string, params: any[]) {
    const upperQuery = query.toUpperCase().trim();

    if (upperQuery.startsWith('INSERT INTO ENTITIES')) {
      tables.entities.push({
        id: params[0],
        name: params[1],
        type: params[2],
        file_path: params[3],
        start_line: params[4],
        end_line: params[5],
        description: params[6],
        created_at: params[7],
        updated_at: params[8],
        metadata: params[9],
      });
    } else if (upperQuery.startsWith('INSERT INTO RELATIONS')) {
      tables.relations.push({
        id: params[0],
        source_entity_id: params[1],
        target_entity_id: params[2],
        verb: params[3],
        created_at: params[4],
        metadata: params[5],
      });
    } else if (upperQuery.startsWith('INSERT INTO OBSERVATIONS')) {
      tables.observations.push({
        id: params[0],
        entity_id: params[1],
        content: params[2],
        created_at: params[3],
        updated_at: params[4],
      });
    } else if (upperQuery.startsWith('UPDATE ENTITIES')) {
      const id = params[params.length - 1];
      const idx = tables.entities.findIndex((e) => e.id === id);
      if (idx >= 0) {
        tables.entities[idx] = {
          ...tables.entities[idx],
          name: params[0],
          type: params[1],
          file_path: params[2],
          start_line: params[3],
          end_line: params[4],
          description: params[5],
          updated_at: params[6],
          metadata: params[7],
        };
      }
    } else if (upperQuery.startsWith('UPDATE OBSERVATIONS')) {
      const id = params[params.length - 1];
      const idx = tables.observations.findIndex((o) => o.id === id);
      if (idx >= 0) {
        tables.observations[idx] = {
          ...tables.observations[idx],
          content: params[0],
          updated_at: params[1],
        };
      }
    } else if (upperQuery.startsWith('DELETE FROM ENTITIES')) {
      const id = params[0];
      const idx = tables.entities.findIndex((e) => e.id === id);
      if (idx >= 0) {
        tables.entities.splice(idx, 1);
      }
    } else if (upperQuery.startsWith('DELETE FROM RELATIONS')) {
      const id = params[0];
      const idx = tables.relations.findIndex((r) => r.id === id);
      if (idx >= 0) {
        tables.relations.splice(idx, 1);
      }
    } else if (upperQuery.startsWith('DELETE FROM OBSERVATIONS')) {
      const id = params[0];
      const idx = tables.observations.findIndex((o) => o.id === id);
      if (idx >= 0) {
        tables.observations.splice(idx, 1);
      }
    }
  }

  function prepareQuery(query: string, params: any[]): MockRow[] {
    const upperQuery = query.toUpperCase().trim();

    // SELECT COUNT(*) queries
    if (upperQuery.includes('SELECT COUNT(*)')) {
      if (upperQuery.includes('FROM ENTITIES')) {
        if (upperQuery.includes('WHERE') && params.length > 0) {
          // Handle filtered count
          return [{ count: filterEntities(query, params).length }];
        }
        return [{ count: tables.entities.length }];
      }
      if (upperQuery.includes('FROM RELATIONS')) {
        if (upperQuery.includes('WHERE') && params.length > 0) {
          return [{ count: filterRelations(query, params).length }];
        }
        return [{ count: tables.relations.length }];
      }
      if (upperQuery.includes('FROM OBSERVATIONS')) {
        if (upperQuery.includes('WHERE') && params.length > 0) {
          return [{ count: filterObservations(query, params).length }];
        }
        return [{ count: tables.observations.length }];
      }
    }

    // SELECT * queries without WHERE (get all)
    if (upperQuery.startsWith('SELECT') && !upperQuery.includes('WHERE')) {
      if (upperQuery.includes('FROM ENTITIES')) {
        return [...tables.entities];
      }
      if (upperQuery.includes('FROM RELATIONS')) {
        return [...tables.relations];
      }
      if (upperQuery.includes('FROM OBSERVATIONS')) {
        return [...tables.observations];
      }
    }

    // SELECT queries with filters
    if (upperQuery.startsWith('SELECT')) {
      if (upperQuery.includes('FROM ENTITIES')) {
        return filterEntities(query, params);
      }
      if (upperQuery.includes('FROM RELATIONS')) {
        return filterRelations(query, params);
      }
      if (upperQuery.includes('FROM OBSERVATIONS')) {
        return filterObservations(query, params);
      }
    }

    return [];
  }

  function filterEntities(query: string, params: any[]): MockRow[] {
    let results = [...tables.entities];
    const upperQuery = query.toUpperCase();
    let paramIndex = 0;

    if (upperQuery.includes('WHERE ID = ?')) {
      const id = params[paramIndex++];
      results = results.filter((e) => e.id === id);
    }

    if (upperQuery.includes('WHERE NAME = ?')) {
      const name = params[paramIndex++];
      results = results.filter((e) => e.name === name);
    }

    if (upperQuery.includes('AND TYPE = ?') || upperQuery.includes('WHERE TYPE = ?')) {
      const typeParamIdx = params.findIndex((p, i) => 
        typeof p === 'string' && !p.includes('%') && 
        ['function', 'class', 'interface', 'variable', 'service', 'component', 'api', 'file', 'directory', 'config', 'database', 'other'].includes(p)
      );
      if (typeParamIdx >= 0) {
        const type = params[typeParamIdx];
        results = results.filter((e) => e.type === type);
      }
    }

    if (upperQuery.includes('FILE_PATH = ?')) {
      const filePath = params.find((p) => typeof p === 'string' && !p.includes('%'));
      if (filePath) {
        results = results.filter((e) => e.file_path === filePath);
      }
    }

    if (upperQuery.includes('NAME LIKE ?')) {
      const pattern = params.find((p) => typeof p === 'string' && p.includes('%'));
      if (pattern) {
        const searchTerm = pattern.replace(/%/g, '');
        results = results.filter((e) => e.name.includes(searchTerm));
      }
    }

    if (upperQuery.includes('START_LINE <= ?') && upperQuery.includes('END_LINE >= ?')) {
      const line = params[1]; // Assuming filePath is first, then line twice
      results = results.filter((e) => e.start_line <= line && e.end_line >= line);
      // Sort by range size (smallest first)
      results.sort((a, b) => (a.end_line - a.start_line) - (b.end_line - b.start_line));
    }

    return results;
  }

  function filterRelations(query: string, params: any[]): MockRow[] {
    let results = [...tables.relations];
    const upperQuery = query.toUpperCase();

    if (upperQuery.includes('WHERE ID = ?')) {
      const id = params[0];
      results = results.filter((r) => r.id === id);
    }

    if (upperQuery.includes('SOURCE_ENTITY_ID = ?') && upperQuery.includes('TARGET_ENTITY_ID = ?')) {
      // Both source and target
      if (upperQuery.includes(' OR ')) {
        const entityId = params[0];
        results = results.filter(
          (r) => r.source_entity_id === entityId || r.target_entity_id === entityId
        );
      } else {
        const sourceId = params[0];
        const targetId = params[1];
        results = results.filter(
          (r) => r.source_entity_id === sourceId && r.target_entity_id === targetId
        );
      }
    } else if (upperQuery.includes('SOURCE_ENTITY_ID = ?')) {
      const sourceId = params[0];
      results = results.filter((r) => r.source_entity_id === sourceId);
    } else if (upperQuery.includes('TARGET_ENTITY_ID = ?')) {
      const targetId = params[0];
      results = results.filter((r) => r.target_entity_id === targetId);
    }

    if (upperQuery.includes('VERB = ?')) {
      const verbIdx = upperQuery.includes('AND VERB') ? params.length - 1 : 0;
      const verb = params[verbIdx] || params.find((p) => 
        ['uses', 'calls', 'extends', 'implements', 'depends_on', 'contains', 'references', 'imports', 'exports'].includes(p)
      );
      if (verb) {
        results = results.filter((r) => r.verb === verb);
      }
    }

    return results;
  }

  function filterObservations(query: string, params: any[]): MockRow[] {
    let results = [...tables.observations];
    const upperQuery = query.toUpperCase();

    if (upperQuery.includes('WHERE ID = ?')) {
      const id = params[0];
      results = results.filter((o) => o.id === id);
    }

    if (upperQuery.includes('ENTITY_ID = ?')) {
      const entityId = params[0];
      results = results.filter((o) => o.entity_id === entityId);
    }

    if (upperQuery.includes('CONTENT LIKE ?')) {
      const pattern = params.find((p) => typeof p === 'string' && p.includes('%'));
      if (pattern) {
        const searchTerm = pattern.replace(/%/g, '');
        results = results.filter((o) => o.content.includes(searchTerm));
      }
    }

    return results;
  }

  const mockDb = {
    prepare: (query: string) => {
      currentQuery = query;
      currentParams = [];
      currentRowIndex = 0;
      // Pre-populate results for queries without parameters
      queryResults = prepareQuery(query, []);
      
      return {
        ...mockStatement,
        bind: (params?: any[]) => {
          currentParams = params || [];
          currentRowIndex = 0;
          queryResults = prepareQuery(query, currentParams);
        },
        step: () => {
          if (currentRowIndex < queryResults.length) {
            currentRowIndex++;
            return true;
          }
          return false;
        },
        getAsObject: () => {
          return queryResults[currentRowIndex - 1] || {};
        },
        run: (params?: any[]) => {
          currentParams = params || currentParams;
          executeQuery(query, currentParams);
        },
        free: () => {
          currentRowIndex = 0;
        },
      };
    },
    run: (query: string) => {
      // For DDL statements like CREATE TABLE, etc.
    },
    export: () => new Uint8Array(),
  } as unknown as SqlJsDatabase;

  return {
    mockDb,
    tables,
    reset: () => {
      tables.entities = [];
      tables.relations = [];
      tables.observations = [];
    },
  };
}

/**
 * Mock DatabaseService 类
 */
export class MockDatabaseService {
  private mockData = createMockDatabase();

  getDatabase() {
    return this.mockData.mockDb;
  }

  save() {
    // Mock save - do nothing
  }

  reset() {
    this.mockData.reset();
  }

  getTables() {
    return this.mockData.tables;
  }
}

