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
    public readonly type?: 'category' | 'entity'
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
      // 根节点：显示按类型分组的类别
      return Promise.resolve(this.getCategories());
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

  private getCategories(): KnowledgeTreeItem[] {
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

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

