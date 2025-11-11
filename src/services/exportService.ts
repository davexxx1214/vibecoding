import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { EntityService } from './entityService';
import { RelationService } from './relationService';
import { ObservationService } from './observationService';
import { Entity, Relation, Observation } from '../utils/types';

/**
 * 导出服务
 * 负责将知识图谱导出为不同格式
 */
export class ExportService {
  constructor(
    private entityService: EntityService,
    private relationService: RelationService,
    private observationService: ObservationService
  ) {}

  /**
   * 导出为 Markdown 格式
   */
  public async exportToMarkdown(outputPath: string): Promise<void> {
    const entities = this.entityService.listEntities({});
    const allRelations = this.relationService.getAllRelations();

    let markdown = this.generateMarkdownHeader();
    markdown += this.generateOverview(entities, allRelations);
    markdown += this.generateEntitySections(entities);
    markdown += this.generateRelationSection(allRelations, entities);

    // 写入文件
    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  /**
   * 生成 Markdown 文件头部
   */
  private generateMarkdownHeader(): string {
    const timestamp = new Date().toLocaleString('zh-CN');
    return `# 知识图谱导出

> 导出时间：${timestamp}

---

`;
  }

  /**
   * 生成概览部分
   */
  private generateOverview(entities: Entity[], relations: Relation[]): string {
    const entityTypeCount = this.countEntityTypes(entities);
    
    let overview = `## 📊 概览\n\n`;
    overview += `- **实体总数**：${entities.length}\n`;
    overview += `- **关系总数**：${relations.length}\n`;
    overview += `- **实体类型分布**：\n`;
    
    for (const [type, count] of Object.entries(entityTypeCount)) {
      overview += `  - ${this.getTypeIcon(type)} ${type}: ${count}\n`;
    }
    
    overview += `\n---\n\n`;
    return overview;
  }

  /**
   * 生成实体部分
   */
  private generateEntitySections(entities: Entity[]): string {
    // 按类型分组
    const entitiesByType = this.groupEntitiesByType(entities);
    
    let sections = `## 📦 实体列表\n\n`;
    
    for (const [type, typeEntities] of Object.entries(entitiesByType)) {
      sections += `### ${this.getTypeIcon(type)} ${type.toUpperCase()} (${typeEntities.length})\n\n`;
      
      for (const entity of typeEntities) {
        sections += this.generateEntityDetail(entity);
      }
      
      sections += `---\n\n`;
    }
    
    return sections;
  }

  /**
   * 生成单个实体的详细信息
   */
  private generateEntityDetail(entity: Entity): string {
    let detail = `#### ${entity.name}\n\n`;
    
    // 基本信息
    detail += `**类型**：${entity.type}  \n`;
    detail += `**位置**：\`${entity.filePath}\` (行 ${entity.startLine}-${entity.endLine})  \n`;
    
    if (entity.description) {
      detail += `**描述**：${entity.description}  \n`;
    }
    
    detail += `**创建时间**：${new Date(entity.createdAt).toLocaleString('zh-CN')}  \n`;
    
    // 观察记录
    const observations = this.observationService.getObservations(entity.id);
    if (observations.length > 0) {
      detail += `\n**📝 观察记录** (${observations.length})：\n\n`;
      for (const obs of observations) {
        const obsTime = new Date(obs.createdAt).toLocaleString('zh-CN');
        detail += `- ${obs.content} _(${obsTime})_\n`;
      }
    }
    
    // 关系
    const relations = this.relationService.getRelationsByEntity(entity.id);
    if (relations.length > 0) {
      detail += `\n**🔗 关系** (${relations.length})：\n\n`;
      
      // 出边（作为源）
      const outgoing = relations.filter(r => r.sourceEntityId === entity.id);
      if (outgoing.length > 0) {
        detail += `_出边 (源)：_\n`;
        for (const rel of outgoing) {
          const target = this.entityService.getEntity(rel.targetEntityId);
          if (target) {
            detail += `- ${entity.name} **${rel.verb}** → ${target.name} (\`${target.type}\`)\n`;
          }
        }
      }
      
      // 入边（作为目标）
      const incoming = relations.filter(r => r.targetEntityId === entity.id);
      if (incoming.length > 0) {
        detail += `\n_入边 (目标)：_\n`;
        for (const rel of incoming) {
          const source = this.entityService.getEntity(rel.sourceEntityId);
          if (source) {
            detail += `- ${source.name} (\`${source.type}\`) **${rel.verb}** → ${entity.name}\n`;
          }
        }
      }
    }
    
    detail += `\n`;
    return detail;
  }

  /**
   * 生成关系部分
   */
  private generateRelationSection(relations: Relation[], entities: Entity[]): string {
    let section = `## 🔗 关系图谱\n\n`;
    
    if (relations.length === 0) {
      section += `_暂无关系_\n\n`;
      return section;
    }
    
    // 按关系类型分组
    const relationsByVerb = this.groupRelationsByVerb(relations);
    
    for (const [verb, verbRelations] of Object.entries(relationsByVerb)) {
      section += `### ${verb.toUpperCase()} (${verbRelations.length})\n\n`;
      
      for (const rel of verbRelations) {
        const source = this.entityService.getEntity(rel.sourceEntityId);
        const target = this.entityService.getEntity(rel.targetEntityId);
        
        if (source && target) {
          section += `- **${source.name}** (\`${source.type}\`) → **${target.name}** (\`${target.type}\`)\n`;
          section += `  - 源：\`${source.filePath}:${source.startLine}\`\n`;
          section += `  - 目标：\`${target.filePath}:${target.startLine}\`\n`;
        }
      }
      
      section += `\n`;
    }
    
    section += `---\n\n`;
    return section;
  }

  /**
   * 统计实体类型数量
   */
  private countEntityTypes(entities: Entity[]): Record<string, number> {
    const count: Record<string, number> = {};
    for (const entity of entities) {
      count[entity.type] = (count[entity.type] || 0) + 1;
    }
    return count;
  }

  /**
   * 按类型分组实体
   */
  private groupEntitiesByType(entities: Entity[]): Record<string, Entity[]> {
    const grouped: Record<string, Entity[]> = {};
    for (const entity of entities) {
      if (!grouped[entity.type]) {
        grouped[entity.type] = [];
      }
      grouped[entity.type].push(entity);
    }
    
    // 按名称排序每个分组
    for (const type in grouped) {
      grouped[type].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return grouped;
  }

  /**
   * 按关系类型分组
   */
  private groupRelationsByVerb(relations: Relation[]): Record<string, Relation[]> {
    const grouped: Record<string, Relation[]> = {};
    for (const rel of relations) {
      if (!grouped[rel.verb]) {
        grouped[rel.verb] = [];
      }
      grouped[rel.verb].push(rel);
    }
    return grouped;
  }

  /**
   * 获取实体类型对应的图标
   */
  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      function: '📁',
      class: '🏛️',
      interface: '📋',
      variable: '📌',
      component: '🧩',
      service: '⚙️',
      api: '🌐',
      config: '⚙️',
      database: '🗄️',
      other: '📄',
    };
    return icons[type] || '📄';
  }

  /**
   * 导出为 JSON 格式
   */
  public async exportToJSON(outputPath: string): Promise<void> {
    const entities = this.entityService.listEntities({});
    const relations = this.relationService.getAllRelations();
    
    // 收集所有观察记录
    const observations: Record<string, Observation[]> = {};
    for (const entity of entities) {
      observations[entity.id] = this.observationService.getObservations(entity.id);
    }
    
    const exportData = {
      exportTime: new Date().toISOString(),
      version: '1.0',
      statistics: {
        entityCount: entities.length,
        relationCount: relations.length,
        observationCount: Object.values(observations).flat().length,
      },
      entities,
      relations,
      observations,
    };
    
    const json = JSON.stringify(exportData, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');
  }

  /**
   * 生成导出文件名
   */
  public generateExportFileName(format: 'md' | 'json'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || 'knowledge-graph';
    return `${workspaceName}-export-${timestamp}.${format}`;
  }
}

