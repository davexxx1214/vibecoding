import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RelationService } from '../../src/services/relationService';
import { EntityService } from '../../src/services/entityService';
import { MockDatabaseService } from '../__mocks__/database';
import type { RelationVerb } from '../../src/utils/types';

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('RelationService', () => {
  let mockDbService: MockDatabaseService;
  let entityService: EntityService;
  let relationService: RelationService;
  let entity1Id: string;
  let entity2Id: string;
  let entity3Id: string;

  beforeEach(() => {
    mockDbService = new MockDatabaseService();
    entityService = new EntityService(mockDbService as any);
    relationService = new RelationService(mockDbService as any, entityService);

    // 创建测试实体
    const e1 = entityService.createEntity('ServiceA', 'service', {
      filePath: '/src/services/a.ts',
      startLine: 1,
      endLine: 50,
    });
    const e2 = entityService.createEntity('ServiceB', 'service', {
      filePath: '/src/services/b.ts',
      startLine: 1,
      endLine: 40,
    });
    const e3 = entityService.createEntity('ServiceC', 'service', {
      filePath: '/src/services/c.ts',
      startLine: 1,
      endLine: 30,
    });

    entity1Id = e1.id;
    entity2Id = e2.id;
    entity3Id = e3.id;
  });

  describe('addRelation', () => {
    it('应该成功创建关系', () => {
      const relation = relationService.addRelation(
        entity1Id,
        entity2Id,
        'uses'
      );

      expect(relation).toBeDefined();
      expect(relation.sourceEntityId).toBe(entity1Id);
      expect(relation.targetEntityId).toBe(entity2Id);
      expect(relation.verb).toBe('uses');
      expect(relation.id).toBeDefined();
      expect(relation.createdAt).toBeDefined();
    });

    it('应该抛出错误当源实体不存在', () => {
      expect(() => {
        relationService.addRelation('non-existent', entity2Id, 'uses');
      }).toThrow('Source or target entity not found');
    });

    it('应该抛出错误当目标实体不存在', () => {
      expect(() => {
        relationService.addRelation(entity1Id, 'non-existent', 'uses');
      }).toThrow('Source or target entity not found');
    });

    it('应该支持 metadata', () => {
      const metadata = { reason: 'dependency injection' };
      const relation = relationService.addRelation(
        entity1Id,
        entity2Id,
        'depends_on',
        metadata
      );

      expect(relation.metadata).toEqual(metadata);
    });

    it('应该支持所有关系类型', () => {
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

      verbs.forEach((verb, index) => {
        // 为每个关系创建新的目标实体
        const target = entityService.createEntity(`Target${index}`, 'service', {
          filePath: '/src/test.ts',
          startLine: 1,
          endLine: 10,
        });
        
        const relation = relationService.addRelation(entity1Id, target.id, verb);
        expect(relation.verb).toBe(verb);
      });
    });
  });

  describe('removeRelation', () => {
    it('应该删除关系', () => {
      const relation = relationService.addRelation(entity1Id, entity2Id, 'uses');
      
      const result = relationService.removeRelation(relation.id);
      
      expect(result).toBe(true);
      const relations = relationService.getRelations(entity1Id);
      expect(relations.find((r) => r.id === relation.id)).toBeUndefined();
    });
  });

  describe('getRelations', () => {
    beforeEach(() => {
      // A -> B (uses)
      relationService.addRelation(entity1Id, entity2Id, 'uses');
      // A -> C (calls)
      relationService.addRelation(entity1Id, entity3Id, 'calls');
      // B -> C (depends_on)
      relationService.addRelation(entity2Id, entity3Id, 'depends_on');
    });

    it('应该返回实体的所有关系（双向）', () => {
      const relations = relationService.getRelations(entity1Id);
      expect(relations.length).toBe(2); // A 有 2 个出边
    });

    it('应该按方向过滤 - 出边', () => {
      const outgoing = relationService.getRelations(entity1Id, 'outgoing');
      expect(outgoing.length).toBe(2);
      expect(outgoing.every((r) => r.sourceEntityId === entity1Id)).toBe(true);
    });

    it('应该按方向过滤 - 入边', () => {
      const incoming = relationService.getRelations(entity3Id, 'incoming');
      expect(incoming.length).toBe(2); // C 有 2 个入边
      expect(incoming.every((r) => r.targetEntityId === entity3Id)).toBe(true);
    });
  });

  describe('getAllRelations', () => {
    it('应该返回所有关系', () => {
      relationService.addRelation(entity1Id, entity2Id, 'uses');
      relationService.addRelation(entity2Id, entity3Id, 'calls');

      const all = relationService.getAllRelations();

      expect(all.length).toBe(2);
    });
  });

  describe('getRelatedEntities', () => {
    beforeEach(() => {
      relationService.addRelation(entity1Id, entity2Id, 'uses');
      relationService.addRelation(entity1Id, entity3Id, 'calls');
      relationService.addRelation(entity2Id, entity1Id, 'depends_on');
    });

    it('应该返回关联实体及其关系信息', () => {
      const related = relationService.getRelatedEntities(entity1Id);

      expect(related.length).toBe(3);
      expect(related.some((r) => r.entity.name === 'ServiceB')).toBe(true);
      expect(related.some((r) => r.entity.name === 'ServiceC')).toBe(true);
    });

    it('应该按关系类型过滤', () => {
      const usesRelated = relationService.getRelatedEntities(entity1Id, 'uses');

      expect(usesRelated.length).toBe(1);
      expect(usesRelated[0].relation.verb).toBe('uses');
    });

    it('应该正确标记方向', () => {
      const related = relationService.getRelatedEntities(entity1Id);

      const outgoing = related.filter((r) => r.direction === 'outgoing');
      const incoming = related.filter((r) => r.direction === 'incoming');

      expect(outgoing.length).toBe(2); // uses B, calls C
      expect(incoming.length).toBe(1); // B depends_on A
    });
  });

  describe('relationExists', () => {
    beforeEach(() => {
      relationService.addRelation(entity1Id, entity2Id, 'uses');
    });

    it('应该返回 true 当关系存在', () => {
      expect(relationService.relationExists(entity1Id, entity2Id)).toBe(true);
    });

    it('应该返回 false 当关系不存在', () => {
      expect(relationService.relationExists(entity1Id, entity3Id)).toBe(false);
    });

    it('应该考虑关系动词', () => {
      expect(relationService.relationExists(entity1Id, entity2Id, 'uses')).toBe(true);
      expect(relationService.relationExists(entity1Id, entity2Id, 'calls')).toBe(false);
    });

    it('应该区分关系方向', () => {
      // A -> B exists, but B -> A doesn't
      expect(relationService.relationExists(entity1Id, entity2Id)).toBe(true);
      expect(relationService.relationExists(entity2Id, entity1Id)).toBe(false);
    });
  });

  describe('getRelationCount', () => {
    beforeEach(() => {
      relationService.addRelation(entity1Id, entity2Id, 'uses');
      relationService.addRelation(entity1Id, entity3Id, 'uses');
      relationService.addRelation(entity2Id, entity1Id, 'calls');
    });

    it('应该返回实体的关系总数', () => {
      expect(relationService.getRelationCount(entity1Id)).toBe(3);
    });

    it('应该按动词过滤', () => {
      expect(relationService.getRelationCount(entity1Id, 'uses')).toBe(2);
      expect(relationService.getRelationCount(entity1Id, 'calls')).toBe(1);
    });
  });
});

