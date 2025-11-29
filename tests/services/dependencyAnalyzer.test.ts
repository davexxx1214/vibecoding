import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyAnalyzer } from '../../src/services/dependencyAnalyzer';
import { EntityService } from '../../src/services/entityService';
import { RelationService } from '../../src/services/relationService';
import { MockDatabaseService } from '../__mocks__/database';

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('DependencyAnalyzer', () => {
  let mockDbService: MockDatabaseService;
  let entityService: EntityService;
  let relationService: RelationService;
  let analyzer: DependencyAnalyzer;

  // 实体 ID 映射
  let entityIds: Record<string, string>;

  beforeEach(() => {
    mockDbService = new MockDatabaseService();
    entityService = new EntityService(mockDbService as any);
    relationService = new RelationService(mockDbService as any, entityService);
    analyzer = new DependencyAnalyzer(entityService, relationService);
    entityIds = {};
  });

  /**
   * 辅助函数：创建实体
   */
  function createEntity(name: string) {
    const entity = entityService.createEntity(name, 'service', {
      filePath: `/src/${name.toLowerCase()}.ts`,
      startLine: 1,
      endLine: 50,
    });
    entityIds[name] = entity.id;
    return entity;
  }

  /**
   * 辅助函数：创建关系
   */
  function createRelation(sourceName: string, targetName: string) {
    return relationService.addRelation(
      entityIds[sourceName],
      entityIds[targetName],
      'depends_on'
    );
  }

  describe('buildDependencyTree', () => {
    it('应该返回 null 当实体不存在', () => {
      const result = analyzer.buildDependencyTree('non-existent');
      expect(result).toBeNull();
    });

    it('应该构建单节点树（无依赖）', () => {
      const entity = createEntity('Standalone');

      const tree = analyzer.buildDependencyTree(entity.id);

      expect(tree).toBeDefined();
      expect(tree?.entity.name).toBe('Standalone');
      expect(tree?.depth).toBe(0);
      expect(tree?.children).toHaveLength(0);
    });

    it('应该构建简单依赖树', () => {
      createEntity('A');
      createEntity('B');
      createEntity('C');

      // A -> B -> C
      createRelation('A', 'B');
      createRelation('B', 'C');

      const tree = analyzer.buildDependencyTree(entityIds['A']);

      expect(tree).toBeDefined();
      expect(tree?.entity.name).toBe('A');
      expect(tree?.children).toHaveLength(1);
      expect(tree?.children[0].entity.name).toBe('B');
      expect(tree?.children[0].children).toHaveLength(1);
      expect(tree?.children[0].children[0].entity.name).toBe('C');
    });

    it('应该构建多分支依赖树', () => {
      createEntity('Root');
      createEntity('Child1');
      createEntity('Child2');
      createEntity('Child3');

      // Root -> Child1, Child2, Child3
      createRelation('Root', 'Child1');
      createRelation('Root', 'Child2');
      createRelation('Root', 'Child3');

      const tree = analyzer.buildDependencyTree(entityIds['Root']);

      expect(tree?.children).toHaveLength(3);
      const childNames = tree?.children.map((c) => c.entity.name).sort();
      expect(childNames).toEqual(['Child1', 'Child2', 'Child3']);
    });

    it('应该限制最大深度', () => {
      // 创建深层依赖链 A -> B -> C -> D -> E
      createEntity('A');
      createEntity('B');
      createEntity('C');
      createEntity('D');
      createEntity('E');

      createRelation('A', 'B');
      createRelation('B', 'C');
      createRelation('C', 'D');
      createRelation('D', 'E');

      const tree = analyzer.buildDependencyTree(entityIds['A'], 2);

      expect(tree).toBeDefined();
      // 深度限制为 2，应该只到 C
      expect(tree?.children[0].entity.name).toBe('B');
      expect(tree?.children[0].children[0].entity.name).toBe('C');
      // C 的子节点应该为空（因为达到深度限制）
      expect(tree?.children[0].children[0].children).toHaveLength(0);
    });

    it('应该处理菱形依赖', () => {
      //     A
      //    / \
      //   B   C
      //    \ /
      //     D
      createEntity('A');
      createEntity('B');
      createEntity('C');
      createEntity('D');

      createRelation('A', 'B');
      createRelation('A', 'C');
      createRelation('B', 'D');
      createRelation('C', 'D');

      const tree = analyzer.buildDependencyTree(entityIds['A']);

      expect(tree?.children).toHaveLength(2);
      // B 和 C 都应该有到 D 的依赖
      const bNode = tree?.children.find((c) => c.entity.name === 'B');
      const cNode = tree?.children.find((c) => c.entity.name === 'C');
      
      expect(bNode?.children.some((c) => c.entity.name === 'D')).toBe(true);
      expect(cNode?.children.some((c) => c.entity.name === 'D')).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    it('应该返回空数组当没有循环依赖', () => {
      createEntity('A');
      createEntity('B');
      createRelation('A', 'B');

      const circular = analyzer.detectCircularDependencies(entityIds['A']);

      expect(circular).toHaveLength(0);
    });

    it('应该检测简单循环', () => {
      createEntity('A');
      createEntity('B');
      
      // A -> B -> A (循环)
      createRelation('A', 'B');
      createRelation('B', 'A');

      const circular = analyzer.detectCircularDependencies(entityIds['A']);

      expect(circular.length).toBeGreaterThan(0);
    });

    it('应该检测三节点循环', () => {
      createEntity('A');
      createEntity('B');
      createEntity('C');

      // A -> B -> C -> A
      createRelation('A', 'B');
      createRelation('B', 'C');
      createRelation('C', 'A');

      const circular = analyzer.detectCircularDependencies(entityIds['A']);

      expect(circular.length).toBeGreaterThan(0);
      // 检查循环链中包含所有节点
      const firstCycle = circular[0];
      const cycleNames = firstCycle.chain.map((e) => e.name);
      expect(cycleNames).toContain('A');
      expect(cycleNames).toContain('B');
      expect(cycleNames).toContain('C');
    });

    it('应该返回空数组当实体不存在', () => {
      const circular = analyzer.detectCircularDependencies('non-existent');
      expect(circular).toHaveLength(0);
    });
  });

  describe('analyzeDependencyChain', () => {
    it('应该返回 null 当实体不存在', () => {
      const result = analyzer.analyzeDependencyChain('non-existent');
      expect(result).toBeNull();
    });

    it('应该返回完整的依赖链分析', () => {
      createEntity('A');
      createEntity('B');
      createEntity('C');

      createRelation('A', 'B');
      createRelation('B', 'C');

      const chain = analyzer.analyzeDependencyChain(entityIds['A']);

      expect(chain).toBeDefined();
      expect(chain?.root.name).toBe('A');
      expect(chain?.maxDepth).toBe(2);
      expect(chain?.totalDependencies).toBe(2); // B 和 C
      expect(chain?.circularDependencies).toHaveLength(0);
    });

    it('应该检测循环依赖', () => {
      createEntity('A');
      createEntity('B');

      createRelation('A', 'B');
      createRelation('B', 'A');

      const chain = analyzer.analyzeDependencyChain(entityIds['A']);

      expect(chain?.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('findAllTransitiveDependencies', () => {
    it('应该返回所有传递依赖', () => {
      createEntity('A');
      createEntity('B');
      createEntity('C');
      createEntity('D');

      // A -> B -> C
      //      B -> D
      createRelation('A', 'B');
      createRelation('B', 'C');
      createRelation('B', 'D');

      const deps = analyzer.findAllTransitiveDependencies(entityIds['A']);

      expect(deps).toHaveLength(3);
      const names = deps.map((e) => e.name).sort();
      expect(names).toEqual(['B', 'C', 'D']);
    });

    it('应该返回空数组当实体没有依赖', () => {
      createEntity('Standalone');

      const deps = analyzer.findAllTransitiveDependencies(entityIds['Standalone']);

      expect(deps).toHaveLength(0);
    });

    it('应该返回空数组当实体不存在', () => {
      const deps = analyzer.findAllTransitiveDependencies('non-existent');
      expect(deps).toHaveLength(0);
    });
  });

  describe('findDependents', () => {
    it('应该返回依赖某实体的所有实体', () => {
      createEntity('A');
      createEntity('B');
      createEntity('C');

      // B -> A, C -> A
      createRelation('B', 'A');
      createRelation('C', 'A');

      const dependents = analyzer.findDependents(entityIds['A']);

      expect(dependents).toHaveLength(2);
      const names = dependents.map((e) => e.name).sort();
      expect(names).toEqual(['B', 'C']);
    });

    it('应该返回空数组当没有依赖者', () => {
      createEntity('Orphan');

      const dependents = analyzer.findDependents(entityIds['Orphan']);

      expect(dependents).toHaveLength(0);
    });
  });

  describe('getGlobalDependencyStats', () => {
    beforeEach(() => {
      createEntity('A');
      createEntity('B');
      createEntity('C');
      createEntity('D');

      // A -> B -> C
      // D 独立
      createRelation('A', 'B');
      createRelation('B', 'C');
    });

    it('应该返回全局依赖统计', () => {
      const stats = analyzer.getGlobalDependencyStats();

      expect(stats.totalEntities).toBe(4);
      expect(stats.entitiesWithDependencies).toBeGreaterThanOrEqual(1);
      expect(stats.maxDependencyDepth).toBeGreaterThanOrEqual(2);
      expect(stats.circularDependencyCount).toBe(0);
    });

    it('应该包含依赖最多的实体', () => {
      const stats = analyzer.getGlobalDependencyStats();

      expect(stats.topDependencies).toBeDefined();
      // A 应该在顶部（有最多依赖）
    });
  });

  describe('treeToString', () => {
    it('应该生成树形文本表示', () => {
      createEntity('Root');
      createEntity('Child1');
      createEntity('Child2');

      createRelation('Root', 'Child1');
      createRelation('Root', 'Child2');

      const tree = analyzer.buildDependencyTree(entityIds['Root']);
      const str = analyzer.treeToString(tree!);

      expect(str).toContain('Root');
      expect(str).toContain('Child1');
      expect(str).toContain('Child2');
      expect(str).toContain('├──');
      expect(str).toContain('└──');
    });

    it('应该显示关系类型', () => {
      createEntity('A');
      createEntity('B');
      createRelation('A', 'B');

      const tree = analyzer.buildDependencyTree(entityIds['A']);
      const str = analyzer.treeToString(tree!);

      expect(str).toContain('depends_on');
    });
  });
});

