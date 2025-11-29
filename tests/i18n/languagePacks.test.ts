import { describe, it, expect } from 'vitest';
import { en } from '../../src/i18n/en';
import { zh } from '../../src/i18n/zh';

describe('Language Packs', () => {
  describe('结构一致性', () => {
    /**
     * 获取对象的所有键路径
     */
    function getAllKeyPaths(obj: any, prefix = ''): string[] {
      const paths: string[] = [];
      
      for (const key of Object.keys(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value !== 'function') {
          paths.push(...getAllKeyPaths(value, fullPath));
        } else {
          paths.push(fullPath);
        }
      }
      
      return paths;
    }

    it('英文和中文语言包应该有相同的顶级键', () => {
      const enKeys = Object.keys(en).sort();
      const zhKeys = Object.keys(zh).sort();
      
      expect(enKeys).toEqual(zhKeys);
    });

    it('扩展命名空间应该有相同的键', () => {
      expect(Object.keys(en.extension).sort()).toEqual(Object.keys(zh.extension).sort());
    });

    it('commands 命名空间应该有相同的键', () => {
      expect(Object.keys(en.commands).sort()).toEqual(Object.keys(zh.commands).sort());
    });

    it('common 命名空间应该有相同的键', () => {
      expect(Object.keys(en.common).sort()).toEqual(Object.keys(zh.common).sort());
    });

    it('entityTypes 应该有相同的类型', () => {
      expect(Object.keys(en.entityTypes).sort()).toEqual(Object.keys(zh.entityTypes).sort());
    });

    it('relationTypes 应该有相同的类型', () => {
      expect(Object.keys(en.relationTypes).sort()).toEqual(Object.keys(zh.relationTypes).sort());
    });

    it('rag 命名空间应该有相同的键', () => {
      expect(Object.keys(en.rag).sort()).toEqual(Object.keys(zh.rag).sort());
    });

    it('graphView 命名空间应该有相同的键', () => {
      expect(Object.keys(en.graphView).sort()).toEqual(Object.keys(zh.graphView).sort());
    });

    it('export 命名空间应该有相同的键', () => {
      expect(Object.keys(en.export).sort()).toEqual(Object.keys(zh.export).sort());
    });
  });

  describe('内容验证', () => {
    describe('English Pack', () => {
      it('extension.name 应该是 Knowledge Graph', () => {
        expect(en.extension.name).toBe('Knowledge Graph');
      });

      it('common.yes 应该是 Yes', () => {
        expect(en.common.yes).toBe('Yes');
      });

      it('common.no 应该是 No', () => {
        expect(en.common.no).toBe('No');
      });
    });

    describe('Chinese Pack', () => {
      it('extension.name 应该是 知识图谱', () => {
        expect(zh.extension.name).toBe('知识图谱');
      });

      it('common.yes 应该是 是', () => {
        expect(zh.common.yes).toBe('是');
      });

      it('common.no 应该是 否', () => {
        expect(zh.common.no).toBe('否');
      });
    });
  });

  describe('函数类型翻译', () => {
    it('英文错误消息函数应该返回正确格式', () => {
      const errorMsg = en.commands.createEntity.error('test error');
      expect(errorMsg).toBe('Failed to create entity: test error');
    });

    it('中文错误消息函数应该返回正确格式', () => {
      const errorMsg = zh.commands.createEntity.error('test error');
      expect(errorMsg).toBe('创建实体失败: test error');
    });

    it('英文成功消息函数应该返回正确格式', () => {
      const successMsg = en.commands.createEntity.success('TestEntity');
      expect(successMsg).toBe('Entity "TestEntity" created successfully');
    });

    it('中文成功消息函数应该返回正确格式', () => {
      const successMsg = zh.commands.createEntity.success('TestEntity');
      expect(successMsg).toBe('实体 "TestEntity" 创建成功');
    });

    it('英文统计函数应该正确格式化', () => {
      const stat = en.common.indexed(5, 1.25);
      expect(stat).toBe('📊 Indexed 5 documents (1.25 MB)');
    });

    it('中文统计函数应该正确格式化', () => {
      const stat = zh.common.indexed(5, 1.25);
      expect(stat).toBe('📊 已索引 5 个文档 (1.25 MB)');
    });
  });

  describe('实体类型标签', () => {
    const expectedTypes = ['function', 'class', 'interface', 'variable', 'component', 'service', 'api', 'config', 'other'];

    it('英文实体类型应该有 label 和 description', () => {
      for (const type of expectedTypes) {
        const entityType = (en.entityTypes as any)[type];
        expect(entityType).toBeDefined();
        expect(entityType.label).toBeDefined();
        expect(entityType.description).toBeDefined();
      }
    });

    it('中文实体类型应该有 label 和 description', () => {
      for (const type of expectedTypes) {
        const entityType = (zh.entityTypes as any)[type];
        expect(entityType).toBeDefined();
        expect(entityType.label).toBeDefined();
        expect(entityType.description).toBeDefined();
      }
    });
  });

  describe('关系类型标签', () => {
    const expectedVerbs = ['uses', 'calls', 'extends', 'implements', 'depends_on', 'contains', 'references', 'imports', 'exports'];

    it('英文关系类型应该有 label 和 description', () => {
      for (const verb of expectedVerbs) {
        const relationType = (en.relationTypes as any)[verb];
        expect(relationType).toBeDefined();
        expect(relationType.label).toBeDefined();
        expect(relationType.description).toBeDefined();
      }
    });

    it('中文关系类型应该有 label 和 description', () => {
      for (const verb of expectedVerbs) {
        const relationType = (zh.relationTypes as any)[verb];
        expect(relationType).toBeDefined();
        expect(relationType.label).toBeDefined();
        expect(relationType.description).toBeDefined();
      }
    });
  });
});

