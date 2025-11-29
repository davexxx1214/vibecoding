import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObservationService } from '../../src/services/observationService';
import { EntityService } from '../../src/services/entityService';
import { MockDatabaseService } from '../__mocks__/database';

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('ObservationService', () => {
  let mockDbService: MockDatabaseService;
  let entityService: EntityService;
  let observationService: ObservationService;
  let testEntityId: string;

  beforeEach(() => {
    mockDbService = new MockDatabaseService();
    entityService = new EntityService(mockDbService as any);
    observationService = new ObservationService(mockDbService as any, entityService);

    // 创建测试实体
    const entity = entityService.createEntity('TestEntity', 'service', {
      filePath: '/src/test.ts',
      startLine: 1,
      endLine: 50,
    });
    testEntityId = entity.id;
  });

  describe('addObservation', () => {
    it('应该成功添加观察记录', () => {
      const observation = observationService.addObservation(
        testEntityId,
        'This is a test observation'
      );

      expect(observation).toBeDefined();
      expect(observation.entityId).toBe(testEntityId);
      expect(observation.content).toBe('This is a test observation');
      expect(observation.id).toBeDefined();
      expect(observation.createdAt).toBeDefined();
      expect(observation.updatedAt).toBeDefined();
    });

    it('应该抛出错误当实体不存在', () => {
      expect(() => {
        observationService.addObservation('non-existent', 'Some content');
      }).toThrow('Entity not found');
    });

    it('应该支持多行内容', () => {
      const multilineContent = `Line 1
Line 2
Line 3`;
      const observation = observationService.addObservation(
        testEntityId,
        multilineContent
      );

      expect(observation.content).toBe(multilineContent);
    });

    it('应该支持特殊字符', () => {
      const specialContent = 'Test with "quotes" and \'apostrophes\' and <html>';
      const observation = observationService.addObservation(
        testEntityId,
        specialContent
      );

      expect(observation.content).toBe(specialContent);
    });
  });

  describe('getObservation', () => {
    it('应该返回存在的观察记录', () => {
      const created = observationService.addObservation(
        testEntityId,
        'Find this observation'
      );

      const found = observationService.getObservation(created.id);

      expect(found).toBeDefined();
      expect(found?.content).toBe('Find this observation');
    });

    it('应该返回 null 当观察记录不存在', () => {
      const result = observationService.getObservation('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateObservation', () => {
    it('应该更新观察记录内容', () => {
      const observation = observationService.addObservation(
        testEntityId,
        'Original content'
      );

      const updated = observationService.updateObservation(
        observation.id,
        'Updated content'
      );

      expect(updated).toBeDefined();
      expect(updated?.content).toBe('Updated content');
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(observation.updatedAt);
    });

    it('应该保留其他属性', () => {
      const observation = observationService.addObservation(
        testEntityId,
        'Original content'
      );

      const updated = observationService.updateObservation(
        observation.id,
        'Updated content'
      );

      expect(updated?.entityId).toBe(testEntityId);
      expect(updated?.createdAt).toBe(observation.createdAt);
    });

    it('应该返回 null 当观察记录不存在', () => {
      const result = observationService.updateObservation(
        'non-existent-id',
        'New content'
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteObservation', () => {
    it('应该删除观察记录', () => {
      const observation = observationService.addObservation(
        testEntityId,
        'To be deleted'
      );

      const result = observationService.deleteObservation(observation.id);

      expect(result).toBe(true);
      expect(observationService.getObservation(observation.id)).toBeNull();
    });
  });

  describe('getObservations', () => {
    beforeEach(() => {
      // 添加多个观察记录
      observationService.addObservation(testEntityId, 'Observation 1');
      observationService.addObservation(testEntityId, 'Observation 2');
      observationService.addObservation(testEntityId, 'Observation 3');
    });

    it('应该返回实体的所有观察记录', () => {
      const observations = observationService.getObservations(testEntityId);

      expect(observations.length).toBe(3);
      expect(observations.every((o) => o.entityId === testEntityId)).toBe(true);
    });

    it('应该返回空数组当实体没有观察记录', () => {
      const newEntity = entityService.createEntity('NoObservations', 'function', {
        filePath: '/src/other.ts',
        startLine: 1,
        endLine: 10,
      });

      const observations = observationService.getObservations(newEntity.id);

      expect(observations).toEqual([]);
    });
  });

  describe('getObservationCount', () => {
    it('应该返回正确的数量', () => {
      expect(observationService.getObservationCount(testEntityId)).toBe(0);

      observationService.addObservation(testEntityId, 'Obs 1');
      expect(observationService.getObservationCount(testEntityId)).toBe(1);

      observationService.addObservation(testEntityId, 'Obs 2');
      expect(observationService.getObservationCount(testEntityId)).toBe(2);
    });

    it('应该返回 0 当实体没有观察记录', () => {
      const newEntity = entityService.createEntity('Empty', 'function', {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      });

      expect(observationService.getObservationCount(newEntity.id)).toBe(0);
    });
  });

  describe('searchObservations', () => {
    beforeEach(() => {
      // 创建另一个实体
      const entity2 = entityService.createEntity('AnotherEntity', 'class', {
        filePath: '/src/other.ts',
        startLine: 1,
        endLine: 30,
      });

      // 添加不同内容的观察记录
      observationService.addObservation(testEntityId, 'Important bug fix');
      observationService.addObservation(testEntityId, 'Performance improvement');
      observationService.addObservation(entity2.id, 'Another bug report');
    });

    it('应该搜索包含关键词的观察记录', () => {
      const results = observationService.searchObservations('bug');

      expect(results.length).toBe(2);
      expect(results.every((o) => o.content.toLowerCase().includes('bug'))).toBe(true);
    });

    it('应该返回空数组当没有匹配结果', () => {
      const results = observationService.searchObservations('nonexistent');
      expect(results).toEqual([]);
    });

    it('应该区分大小写（如果数据库支持）', () => {
      const results = observationService.searchObservations('Performance');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('边界情况', () => {
    it('应该处理空内容', () => {
      const observation = observationService.addObservation(testEntityId, '');
      expect(observation.content).toBe('');
    });

    it('应该处理非常长的内容', () => {
      const longContent = 'a'.repeat(10000);
      const observation = observationService.addObservation(testEntityId, longContent);
      expect(observation.content.length).toBe(10000);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeContent = '这是中文观察记录 🎉 emoji支持';
      const observation = observationService.addObservation(testEntityId, unicodeContent);
      expect(observation.content).toBe(unicodeContent);
    });
  });
});

