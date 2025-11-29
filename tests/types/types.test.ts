import { describe, it, expect } from 'vitest';
import type {
  Entity,
  EntityType,
  Relation,
  RelationVerb,
  Observation,
  CodeLocation,
  EntityFilters,
  SearchResult,
  RelatedEntity,
} from '../../src/utils/types';

describe('Type Definitions', () => {
  describe('EntityType', () => {
    it('应该支持所有实体类型', () => {
      const types: EntityType[] = [
        'function',
        'class',
        'interface',
        'variable',
        'file',
        'directory',
        'api',
        'config',
        'database',
        'service',
        'component',
        'other',
      ];

      expect(types).toHaveLength(12);
    });
  });

  describe('RelationVerb', () => {
    it('应该支持所有关系动词', () => {
      const verbs: RelationVerb[] = [
        'uses',
        'calls',
        'extends',
        'implements',
        'depends_on',
        'contains',
        'references',
        'imports',
        'exports',
      ];

      expect(verbs).toHaveLength(9);
    });
  });

  describe('Entity', () => {
    it('应该有正确的结构', () => {
      const entity: Entity = {
        id: 'test-id',
        name: 'TestEntity',
        type: 'function',
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(entity.id).toBeDefined();
      expect(entity.name).toBeDefined();
      expect(entity.type).toBeDefined();
      expect(entity.filePath).toBeDefined();
      expect(entity.startLine).toBeDefined();
      expect(entity.endLine).toBeDefined();
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    it('应该支持可选字段', () => {
      const entity: Entity = {
        id: 'test-id',
        name: 'TestEntity',
        type: 'class',
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 50,
        description: 'A test entity',
        metadata: { version: '1.0' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(entity.description).toBe('A test entity');
      expect(entity.metadata).toEqual({ version: '1.0' });
    });
  });

  describe('Relation', () => {
    it('应该有正确的结构', () => {
      const relation: Relation = {
        id: 'rel-id',
        sourceEntityId: 'source-id',
        targetEntityId: 'target-id',
        verb: 'uses',
        createdAt: Date.now(),
      };

      expect(relation.id).toBeDefined();
      expect(relation.sourceEntityId).toBeDefined();
      expect(relation.targetEntityId).toBeDefined();
      expect(relation.verb).toBeDefined();
      expect(relation.createdAt).toBeDefined();
    });
  });

  describe('Observation', () => {
    it('应该有正确的结构', () => {
      const observation: Observation = {
        id: 'obs-id',
        entityId: 'entity-id',
        content: 'Some observation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(observation.id).toBeDefined();
      expect(observation.entityId).toBeDefined();
      expect(observation.content).toBeDefined();
      expect(observation.createdAt).toBeDefined();
      expect(observation.updatedAt).toBeDefined();
    });
  });

  describe('CodeLocation', () => {
    it('应该有正确的结构', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 10,
        endLine: 20,
      };

      expect(location.filePath).toBe('/src/test.ts');
      expect(location.startLine).toBe(10);
      expect(location.endLine).toBe(20);
    });
  });

  describe('EntityFilters', () => {
    it('应该支持所有过滤选项', () => {
      const filters: EntityFilters = {
        type: 'function',
        filePath: '/src/test.ts',
        name: 'test',
      };

      expect(filters.type).toBe('function');
      expect(filters.filePath).toBe('/src/test.ts');
      expect(filters.name).toBe('test');
    });

    it('应该支持部分过滤', () => {
      const filters: EntityFilters = {
        type: 'class',
      };

      expect(filters.type).toBe('class');
      expect(filters.filePath).toBeUndefined();
      expect(filters.name).toBeUndefined();
    });
  });

  describe('SearchResult', () => {
    it('应该包含搜索相关字段', () => {
      const result: SearchResult = {
        entity: {
          id: 'id',
          name: 'Test',
          type: 'function',
          filePath: '/test.ts',
          startLine: 1,
          endLine: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        score: 0.95,
        matchedFields: ['name', 'description'],
      };

      expect(result.entity).toBeDefined();
      expect(result.score).toBe(0.95);
      expect(result.matchedFields).toContain('name');
    });
  });

  describe('RelatedEntity', () => {
    it('应该包含实体、关系和方向信息', () => {
      const entity: Entity = {
        id: 'id',
        name: 'Related',
        type: 'service',
        filePath: '/test.ts',
        startLine: 1,
        endLine: 50,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const relation: Relation = {
        id: 'rel-id',
        sourceEntityId: 'source',
        targetEntityId: 'id',
        verb: 'uses',
        createdAt: Date.now(),
      };

      const relatedEntity: RelatedEntity = {
        entity,
        relation,
        direction: 'incoming',
      };

      expect(relatedEntity.entity).toBe(entity);
      expect(relatedEntity.relation).toBe(relation);
      expect(relatedEntity.direction).toBe('incoming');
    });
  });
});

