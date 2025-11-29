import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityService } from '../../src/services/entityService';
import { MockDatabaseService } from '../__mocks__/database';
import type { EntityType, CodeLocation } from '../../src/utils/types';

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('EntityService', () => {
  let mockDbService: MockDatabaseService;
  let entityService: EntityService;

  beforeEach(() => {
    mockDbService = new MockDatabaseService();
    entityService = new EntityService(mockDbService as any);
  });

  describe('createEntity', () => {
    it('应该成功创建实体', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };

      const entity = entityService.createEntity(
        'TestFunction',
        'function',
        location,
        'A test function'
      );

      expect(entity).toBeDefined();
      expect(entity.name).toBe('TestFunction');
      expect(entity.type).toBe('function');
      expect(entity.filePath).toBe('/src/test.ts');
      expect(entity.startLine).toBe(1);
      expect(entity.endLine).toBe(10);
      expect(entity.description).toBe('A test function');
      expect(entity.id).toBeDefined();
    });

    it('应该抛出错误当实体名称重复', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };

      entityService.createEntity('DuplicateName', 'function', location);

      expect(() => {
        entityService.createEntity('DuplicateName', 'class', location);
      }).toThrow('Entity with name "DuplicateName" already exists');
    });

    it('应该支持 metadata', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };
      const metadata = { author: 'test', version: '1.0' };

      const entity = entityService.createEntity(
        'WithMetadata',
        'function',
        location,
        undefined,
        metadata
      );

      expect(entity.metadata).toEqual(metadata);
    });
  });

  describe('getEntity', () => {
    it('应该返回存在的实体', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };
      const created = entityService.createEntity('FindMe', 'function', location);

      const found = entityService.getEntity(created.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('FindMe');
    });

    it('应该返回 null 当实体不存在', () => {
      const result = entityService.getEntity('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateEntity', () => {
    it('应该更新实体属性', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };
      const entity = entityService.createEntity('ToUpdate', 'function', location);

      const updated = entityService.updateEntity(entity.id, {
        name: 'UpdatedName',
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('UpdatedName');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.type).toBe('function'); // 未更改的属性保持不变
    });

    it('应该返回 null 当实体不存在', () => {
      const result = entityService.updateEntity('non-existent-id', { name: 'New' });
      expect(result).toBeNull();
    });

    it('不应该允许更改 ID', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };
      const entity = entityService.createEntity('KeepId', 'function', location);
      const originalId = entity.id;

      const updated = entityService.updateEntity(entity.id, {
        id: 'new-id-attempt',
      } as any);

      expect(updated?.id).toBe(originalId);
    });
  });

  describe('deleteEntity', () => {
    it('应该删除实体', () => {
      const location: CodeLocation = {
        filePath: '/src/test.ts',
        startLine: 1,
        endLine: 10,
      };
      const entity = entityService.createEntity('ToDelete', 'function', location);

      const result = entityService.deleteEntity(entity.id);

      expect(result).toBe(true);
      expect(entityService.getEntity(entity.id)).toBeNull();
    });
  });

  describe('listEntities', () => {
    beforeEach(() => {
      // 创建测试数据
      const entities = [
        { name: 'Func1', type: 'function' as EntityType, filePath: '/src/a.ts' },
        { name: 'Func2', type: 'function' as EntityType, filePath: '/src/b.ts' },
        { name: 'Class1', type: 'class' as EntityType, filePath: '/src/a.ts' },
        { name: 'Interface1', type: 'interface' as EntityType, filePath: '/src/c.ts' },
      ];

      entities.forEach((e) => {
        entityService.createEntity(e.name, e.type, {
          filePath: e.filePath,
          startLine: 1,
          endLine: 10,
        });
      });
    });

    it('应该返回所有实体', () => {
      const all = entityService.listEntities();
      expect(all.length).toBe(4);
    });

    it('应该按类型过滤', () => {
      const functions = entityService.listEntities({ type: 'function' });
      expect(functions.length).toBe(2);
      expect(functions.every((e) => e.type === 'function')).toBe(true);
    });

    it('应该按文件路径过滤', () => {
      const fromFileA = entityService.listEntities({ filePath: '/src/a.ts' });
      expect(fromFileA.length).toBe(2);
    });

    it('应该按名称模糊搜索', () => {
      const withFunc = entityService.listEntities({ name: 'Func' });
      expect(withFunc.length).toBe(2);
    });
  });

  describe('getEntitiesByFile', () => {
    it('应该返回指定文件的所有实体', () => {
      entityService.createEntity('A', 'function', {
        filePath: '/target.ts',
        startLine: 1,
        endLine: 10,
      });
      entityService.createEntity('B', 'class', {
        filePath: '/target.ts',
        startLine: 11,
        endLine: 20,
      });
      entityService.createEntity('C', 'function', {
        filePath: '/other.ts',
        startLine: 1,
        endLine: 10,
      });

      const result = entityService.getEntitiesByFile('/target.ts');

      expect(result.length).toBe(2);
      expect(result.every((e) => e.filePath === '/target.ts')).toBe(true);
    });
  });

  describe('getEntitiesByType', () => {
    it('应该返回指定类型的所有实体', () => {
      entityService.createEntity('Func', 'function', {
        filePath: '/test.ts',
        startLine: 1,
        endLine: 10,
      });
      entityService.createEntity('Class', 'class', {
        filePath: '/test.ts',
        startLine: 11,
        endLine: 20,
      });

      const functions = entityService.getEntitiesByType('function');

      expect(functions.length).toBe(1);
      expect(functions[0].type).toBe('function');
    });
  });

  describe('findEntityAtLocation', () => {
    beforeEach(() => {
      entityService.createEntity('Outer', 'class', {
        filePath: '/test.ts',
        startLine: 1,
        endLine: 50,
      });
      entityService.createEntity('Inner', 'function', {
        filePath: '/test.ts',
        startLine: 10,
        endLine: 20,
      });
    });

    it('应该找到包含指定行的实体', () => {
      const result = entityService.findEntityAtLocation('/test.ts', 15);

      expect(result).toBeDefined();
      // 应该返回范围最小的实体
      expect(result?.name).toBe('Inner');
    });

    it('应该返回 null 当没有实体包含该行', () => {
      const result = entityService.findEntityAtLocation('/test.ts', 100);
      expect(result).toBeNull();
    });

    it('应该返回 null 当文件不匹配', () => {
      const result = entityService.findEntityAtLocation('/other.ts', 15);
      expect(result).toBeNull();
    });
  });

  describe('getEntityCount', () => {
    it('应该返回正确的实体数量', () => {
      expect(entityService.getEntityCount()).toBe(0);

      entityService.createEntity('A', 'function', {
        filePath: '/test.ts',
        startLine: 1,
        endLine: 10,
      });
      expect(entityService.getEntityCount()).toBe(1);

      entityService.createEntity('B', 'class', {
        filePath: '/test.ts',
        startLine: 11,
        endLine: 20,
      });
      expect(entityService.getEntityCount()).toBe(2);
    });
  });
});

