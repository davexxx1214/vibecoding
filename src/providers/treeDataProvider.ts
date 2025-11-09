import * as vscode from 'vscode';
import { Entity, EntityType } from '../utils/types';
import { EntityService } from '../services/entityService';
import { RelationService } from '../services/relationService';
import { ObservationService } from '../services/observationService';

/**
 * 树视图项
 */
export class KnowledgeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly entity?: Entity,
    public readonly type?: 'root' | 'category' | 'entity' | 'relation',
    public readonly relationData?: any
  ) {
    super(label, collapsibleState);

    if (entity) {
      this.tooltip = `${entity.name} (${entity.type})`;
      this.description = `${entity.filePath}:${entity.startLine}`;
      this.contextValue = 'entity';
      
      // 设置命令：点击时跳转到代码位置
      this.command = {
        command: 'knowledge.jumpToEntity',
        title: 'Jump to Entity',
        arguments: [entity],
      };

      // 设置图标
      this.iconPath = new vscode.ThemeIcon(this.getIconForType(entity.type));
    } else if (type === 'relation' && relationData) {
      // 关系节点
      this.tooltip = `${relationData.sourceName} ${relationData.verb} ${relationData.targetName}`;
      this.description = relationData.verb;
      this.contextValue = 'relation';
      this.iconPath = new vscode.ThemeIcon('arrow-right');
      
      // 设置命令：点击时跳转到源实体
      if (relationData.sourceEntity) {
        this.command = {
          command: 'knowledge.jumpToEntity',
          title: 'Jump to Source Entity',
          arguments: [relationData.sourceEntity],
        };
      }
    } else if (type === 'root') {
      // 根节点
      this.contextValue = 'root';
      this.iconPath = new vscode.ThemeIcon(
        label.startsWith('Entities') ? 'symbol-namespace' : 'references'
      );
    } else if (type === 'category') {
      this.contextValue = 'category';
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }

  private getIconForType(type: EntityType): string {
    const iconMap: Record<EntityType, string> = {
      function: 'symbol-function',
      class: 'symbol-class',
      interface: 'symbol-interface',
      variable: 'symbol-variable',
      file: 'file',
      directory: 'folder',
      api: 'globe',
      config: 'settings-gear',
      database: 'database',
      service: 'server',
      component: 'symbol-module',
      other: 'symbol-misc',
    };

    return iconMap[type] || 'symbol-misc';
  }
}

/**
 * 树视图数据提供者
 */
export class KnowledgeTreeDataProvider implements vscode.TreeDataProvider<KnowledgeTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<KnowledgeTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<KnowledgeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<KnowledgeTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private searchQuery: string = '';

  constructor(
    private entityService: EntityService,
    private relationService: RelationService,
    private observationService: ObservationService
  ) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public setSearchQuery(query: string): void {
    this.searchQuery = query;
    this.refresh();
  }

  getTreeItem(element: KnowledgeTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: KnowledgeTreeItem): Thenable<KnowledgeTreeItem[]> {
    if (!element) {
      // 最顶层：显示 Entities 和 Relations 两个根节点
      return Promise.resolve(this.getRootNodes());
    } else if (element.type === 'root') {
      // 根节点：Entities 或 Relations
      if (element.label.startsWith('Entities')) {
        return Promise.resolve(this.getEntityCategories());
      } else if (element.label.startsWith('Relations')) {
        return Promise.resolve(this.getRelations());
      }
    } else if (element.type === 'category' && element.entity) {
      // 类别节点：显示该类型的所有实体
      const entityType = element.entity.type;
      const entities = this.entityService.getEntitiesByType(entityType);
      
      return Promise.resolve(
        entities.map(entity => 
          new KnowledgeTreeItem(
            entity.name,
            vscode.TreeItemCollapsibleState.None,
            entity,
            'entity'
          )
        )
      );
    }

    return Promise.resolve([]);
  }

  /**
   * 获取根节点：Entities 和 Relations
   */
  private getRootNodes(): KnowledgeTreeItem[] {
    const entities = this.entityService.listEntities();
    const relations = this.getAllRelations();
    
    return [
      new KnowledgeTreeItem(
        `Entities (${entities.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        'root'
      ),
      new KnowledgeTreeItem(
        `Relations (${relations.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        'root'
      )
    ];
  }

  /**
   * 获取实体分类
   */
  private getEntityCategories(): KnowledgeTreeItem[] {
    const entities = this.searchQuery 
      ? this.entityService.listEntities({ name: this.searchQuery })
      : this.entityService.listEntities();

    // 按类型分组
    const groupedByType = new Map<EntityType, number>();
    entities.forEach(entity => {
      const count = groupedByType.get(entity.type) || 0;
      groupedByType.set(entity.type, count + 1);
    });

    // 创建类别节点
    const categories: KnowledgeTreeItem[] = [];
    groupedByType.forEach((count, type) => {
      const label = `${this.capitalizeFirst(type)} (${count})`;
      // 创建一个临时实体对象来存储类型信息
      const categoryEntity: Entity = {
        id: `category-${type}`,
        name: label,
        type: type,
        filePath: '',
        startLine: 0,
        endLine: 0,
        createdAt: 0,
        updatedAt: 0,
      };
      
      categories.push(
        new KnowledgeTreeItem(
          label,
          vscode.TreeItemCollapsibleState.Collapsed,
          categoryEntity,
          'category'
        )
      );
    });

    return categories;
  }

  /**
   * 获取所有关系
   */
  private getAllRelations(): any[] {
    const entities = this.entityService.listEntities();
    const relations: any[] = [];
    
    entities.forEach(entity => {
      const outgoingRelations = this.relationService.getRelations(entity.id, 'outgoing');
      outgoingRelations.forEach(relation => {
        const targetEntity = this.entityService.getEntity(relation.targetEntityId);
        if (targetEntity) {
          relations.push({
            id: relation.id,
            sourceId: entity.id,
            sourceName: entity.name,
            sourceEntity: entity,
            verb: relation.verb,
            targetId: targetEntity.id,
            targetName: targetEntity.name,
            targetEntity: targetEntity
          });
        }
      });
    });
    
    return relations;
  }

  /**
   * 获取关系列表
   */
  private getRelations(): KnowledgeTreeItem[] {
    const relations = this.getAllRelations();
    
    return relations.map(relation => 
      new KnowledgeTreeItem(
        `${relation.sourceName} → ${relation.targetName}`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        'relation',
        relation
      )
    );
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

