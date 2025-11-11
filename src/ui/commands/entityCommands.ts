import * as vscode from 'vscode';
import * as path from 'path';
import { EntityService } from '../../services/entityService';
import { RelationService } from '../../services/relationService';
import { ObservationService } from '../../services/observationService';
import { ExportService } from '../../services/exportService';
import { Entity, EntityType } from '../../utils/types';

/**
 * 实体相关的命令处理器
 */
export class EntityCommands {
  private exportService: ExportService;

  constructor(
    private entityService: EntityService,
    private relationService: RelationService,
    private observationService: ObservationService
  ) {
    this.exportService = new ExportService(
      entityService,
      relationService,
      observationService
    );
  }

  /**
   * 获取文件相对于工作区的路径
   */
  private getRelativePath(document: vscode.TextDocument): string | null {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return null;
    }
    
    // 使用 path.relative 计算相对路径，确保返回字符串
    const absolutePath = document.uri.fsPath;
    const workspacePath = workspaceFolder.uri.fsPath;
    const relativePath = path.relative(workspacePath, absolutePath);
    
    // 统一使用正斜杠（跨平台兼容）
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * 从选中的代码创建实体
   */
  public async createEntityFromSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (!workspaceFolder) {
      vscode.window.showWarningMessage('File is not in a workspace');
      return;
    }

    // 获取选中的文本
    const selectedText = editor.document.getText(selection);
    const defaultName = selectedText.trim().split(/\s+/)[0] || 'New Entity';

    // 输入实体名称
    const name = await vscode.window.showInputBox({
      prompt: 'Enter entity name',
      value: defaultName,
      validateInput: (value) => {
        return value.trim() ? null : 'Name cannot be empty';
      },
    });

    if (!name) {
      return;
    }

    // 选择实体类型
    const typeOptions: vscode.QuickPickItem[] = [
      { label: 'function', description: 'Function or method' },
      { label: 'class', description: 'Class definition' },
      { label: 'interface', description: 'Interface definition' },
      { label: 'variable', description: 'Variable or constant' },
      { label: 'component', description: 'UI Component' },
      { label: 'service', description: 'Service class' },
      { label: 'api', description: 'API endpoint' },
      { label: 'config', description: 'Configuration' },
      { label: 'other', description: 'Other type' },
    ];

    const selectedType = await vscode.window.showQuickPick(typeOptions, {
      placeHolder: 'Select entity type',
    });

    if (!selectedType) {
      return;
    }

    // 输入描述（可选）
    const description = await vscode.window.showInputBox({
      prompt: 'Enter description (optional)',
      placeHolder: 'Brief description of this entity',
    });

    // 创建实体
    try {
      const relativePath = this.getRelativePath(editor.document);
      if (!relativePath) {
        vscode.window.showWarningMessage('File is not in a workspace');
        return;
      }
      
      const entity = this.entityService.createEntity(
        name,
        selectedType.label as EntityType,
        {
          filePath: relativePath,
          startLine: selection.start.line + 1,
          endLine: selection.end.line + 1,
        },
        description
      );

      vscode.window.showInformationMessage(`Entity "${entity.name}" created successfully`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create entity: ${error}`);
    }
  }

  /**
   * 为实体添加观察记录
   */
  public async addObservationToEntity(entityId?: string | any): Promise<void> {
    let targetEntityId: string | undefined;

    // 检查 entityId 参数类型
    // 如果是 URI 对象（从右键菜单调用），忽略它
    if (entityId && typeof entityId === 'string') {
      targetEntityId = entityId;
    }

    // 如果没有提供有效的实体 ID，尝试从当前位置查找
    if (!targetEntityId) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const relativePath = this.getRelativePath(editor.document);
      if (!relativePath) {
        return;
      }

      const line = editor.selection.active.line + 1;
      const entity = this.entityService.findEntityAtLocation(relativePath, line);

      if (!entity) {
        vscode.window.showWarningMessage('No entity found at current location');
        return;
      }

      targetEntityId = entity.id;
    }

    // 输入观察内容
    const content = await vscode.window.showInputBox({
      prompt: 'Enter observation',
      placeHolder: 'e.g., Performance issue: N+1 query problem',
      validateInput: (value) => {
        return value.trim() ? null : 'Observation cannot be empty';
      },
    });

    if (!content) {
      return;
    }

    try {
      this.observationService.addObservation(targetEntityId!, content);
      vscode.window.showInformationMessage('Observation added successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to add observation: ${error}`);
    }
  }

  /**
   * 查看实体详情
   */
  public async viewEntityDetails(entityId?: string | any): Promise<void> {
    let entity: Entity | null = null;

    // 检查 entityId 参数类型
    // 如果是 URI 对象（从右键菜单调用），忽略它
    if (entityId && typeof entityId === 'string') {
      entity = this.entityService.getEntity(entityId);
    }
    
    if (!entity) {
      // 从当前位置查找实体
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const relativePath = this.getRelativePath(editor.document);
      if (!relativePath) {
        return;
      }

      const line = editor.selection.active.line + 1;
      entity = this.entityService.findEntityAtLocation(relativePath, line);
    }

    if (!entity) {
      vscode.window.showWarningMessage('Entity not found');
      return;
    }

    // 获取相关信息
    const observations = this.observationService.getObservations(entity.id);
    const relations = this.relationService.getRelatedEntities(entity.id);

    // 构建详情信息
    const lines: string[] = [
      `Entity: ${entity.name}`,
      `Type: ${entity.type}`,
      `Location: ${entity.filePath}:${entity.startLine}-${entity.endLine}`,
      '',
    ];

    if (entity.description) {
      lines.push(`Description: ${entity.description}`, '');
    }

    if (observations.length > 0) {
      lines.push(`Observations (${observations.length}):`);
      observations.forEach((obs, i) => {
        lines.push(`  ${i + 1}. ${obs.content}`);
      });
      lines.push('');
    }

    if (relations.length > 0) {
      lines.push(`Relations (${relations.length}):`);
      relations.forEach((rel) => {
        const arrow = rel.direction === 'outgoing' ? '→' : '←';
        lines.push(`  ${arrow} ${rel.relation.verb} ${arrow} ${rel.entity.name}`);
      });
    }

    // 显示在输出面板
    const output = vscode.window.createOutputChannel('Knowledge Graph');
    output.clear();
    output.appendLine(lines.join('\n'));
    output.show();
  }

  /**
   * 跳转到实体位置
   */
  public async jumpToEntity(entity: Entity): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, entity.filePath);
    
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // 跳转到实体位置
      const range = new vscode.Range(
        entity.startLine - 1,
        0,
        entity.endLine - 1,
        0
      );

      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  /**
   * 搜索图谱
   */
  public async searchGraph(): Promise<void> {
    const query = await vscode.window.showInputBox({
      prompt: 'Search entities by name',
      placeHolder: 'Enter search query',
    });

    if (!query) {
      return;
    }

    const entities = this.entityService.listEntities({ name: query });

    if (entities.length === 0) {
      vscode.window.showInformationMessage('No entities found');
      return;
    }

    // 显示搜索结果
    const items: vscode.QuickPickItem[] = entities.map(entity => ({
      label: entity.name,
      description: `${entity.type} - ${entity.filePath}:${entity.startLine}`,
      detail: entity.description,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select an entity to view',
    });

    if (selected) {
      const entity = entities.find(e => e.name === selected.label);
      if (entity) {
        await this.jumpToEntity(entity);
      }
    }
  }

  /**
   * 从当前位置链接到实体（快捷方式）
   */
  public async linkToEntity(): Promise<void> {
    // 1. 获取当前编辑器和位置
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    // 2. 查找当前位置的实体
    const relativePath = this.getRelativePath(editor.document);
    if (!relativePath) {
      vscode.window.showWarningMessage('File is not in workspace');
      return;
    }

    const line = editor.selection.active.line + 1;
    const sourceEntity = this.entityService.findEntityAtLocation(relativePath, line);

    if (!sourceEntity) {
      vscode.window.showWarningMessage(
        'No entity found at current location. Create an entity first using "Knowledge: Create Entity from Selection"'
      );
      return;
    }

    // 3. 获取所有其他实体
    const allEntities = this.entityService.listEntities();
    const targetEntities = allEntities.filter(e => e.id !== sourceEntity.id);

    if (targetEntities.length === 0) {
      vscode.window.showWarningMessage(
        `No other entities to link to. Create more entities first.`
      );
      return;
    }

    // 4. 选择目标实体
    const targetItems = targetEntities.map(entity => ({
      label: entity.name,
      description: `${entity.type} - ${entity.filePath}:${entity.startLine}`,
      detail: entity.description,
      entity: entity
    }));

    const selectedTarget = await vscode.window.showQuickPick(targetItems, {
      placeHolder: `Link from: ${sourceEntity.name} → To:`,
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selectedTarget) {
      return;
    }

    // 5. 选择关系类型
    const verbOptions: (vscode.QuickPickItem & { verb: string })[] = [
      { 
        label: 'uses', 
        verb: 'uses',
        description: 'Uses or utilizes',
        detail: `${sourceEntity.name} uses ${selectedTarget.label}`
      },
      { 
        label: 'calls', 
        verb: 'calls',
        description: 'Calls or invokes',
        detail: `${sourceEntity.name} calls ${selectedTarget.label}`
      },
      { 
        label: 'extends', 
        verb: 'extends',
        description: 'Extends or inherits from',
        detail: `${sourceEntity.name} extends ${selectedTarget.label}`
      },
      { 
        label: 'implements', 
        verb: 'implements',
        description: 'Implements an interface',
        detail: `${sourceEntity.name} implements ${selectedTarget.label}`
      },
      { 
        label: 'depends_on', 
        verb: 'depends_on',
        description: 'Depends on',
        detail: `${sourceEntity.name} depends on ${selectedTarget.label}`
      },
      { 
        label: 'contains', 
        verb: 'contains',
        description: 'Contains or includes',
        detail: `${sourceEntity.name} contains ${selectedTarget.label}`
      },
      { 
        label: 'references', 
        verb: 'references',
        description: 'References or mentions',
        detail: `${sourceEntity.name} references ${selectedTarget.label}`
      },
      { 
        label: 'imports', 
        verb: 'imports',
        description: 'Imports from',
        detail: `${sourceEntity.name} imports ${selectedTarget.label}`
      },
      { 
        label: 'exports', 
        verb: 'exports',
        description: 'Exports to',
        detail: `${sourceEntity.name} exports ${selectedTarget.label}`
      }
    ];

    const selectedVerb = await vscode.window.showQuickPick(verbOptions, {
      placeHolder: 'Select relation type',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selectedVerb) {
      return;
    }

    // 6. 检查关系是否已存在
    const exists = this.relationService.relationExists(
      sourceEntity.id,
      selectedTarget.entity.id,
      selectedVerb.verb as any
    );

    if (exists) {
      const overwrite = await vscode.window.showWarningMessage(
        `Relation already exists: ${sourceEntity.name} ${selectedVerb.label} ${selectedTarget.label}`,
        'Continue Anyway',
        'Cancel'
      );
      
      if (overwrite !== 'Continue Anyway') {
        return;
      }
    }

    // 7. 创建关系
    try {
      this.relationService.addRelation(
        sourceEntity.id,
        selectedTarget.entity.id,
        selectedVerb.verb as any
      );

      vscode.window.showInformationMessage(
        `✅ Linked: ${sourceEntity.name} ${selectedVerb.label} ${selectedTarget.label}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to link entities: ${error}`);
    }
  }

  /**
   * 添加关系
   */
  public async addRelation(): Promise<void> {
    // 1. 获取所有实体
    const allEntities = this.entityService.listEntities();
    
    if (allEntities.length < 2) {
      vscode.window.showWarningMessage('Need at least 2 entities to create a relation');
      return;
    }

    // 2. 选择源实体（From）
    const sourceItems = allEntities.map(entity => ({
      label: entity.name,
      description: `${entity.type} - ${entity.filePath}:${entity.startLine}`,
      detail: entity.description,
      entity: entity
    }));

    const selectedSource = await vscode.window.showQuickPick(sourceItems, {
      placeHolder: 'Select source entity (From)',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selectedSource) {
      return;
    }

    // 3. 选择目标实体（To）
    const targetItems = allEntities
      .filter(e => e.id !== selectedSource.entity.id) // 排除源实体
      .map(entity => ({
        label: entity.name,
        description: `${entity.type} - ${entity.filePath}:${entity.startLine}`,
        detail: entity.description,
        entity: entity
      }));

    const selectedTarget = await vscode.window.showQuickPick(targetItems, {
      placeHolder: `Select target entity (To) - From: ${selectedSource.label}`,
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selectedTarget) {
      return;
    }

    // 4. 选择关系类型（Verb）
    const verbOptions: (vscode.QuickPickItem & { verb: string })[] = [
      { 
        label: 'uses', 
        verb: 'uses',
        description: 'Uses or utilizes',
        detail: `${selectedSource.label} uses ${selectedTarget.label}`
      },
      { 
        label: 'calls', 
        verb: 'calls',
        description: 'Calls or invokes',
        detail: `${selectedSource.label} calls ${selectedTarget.label}`
      },
      { 
        label: 'extends', 
        verb: 'extends',
        description: 'Extends or inherits from',
        detail: `${selectedSource.label} extends ${selectedTarget.label}`
      },
      { 
        label: 'implements', 
        verb: 'implements',
        description: 'Implements an interface',
        detail: `${selectedSource.label} implements ${selectedTarget.label}`
      },
      { 
        label: 'depends_on', 
        verb: 'depends_on',
        description: 'Depends on',
        detail: `${selectedSource.label} depends on ${selectedTarget.label}`
      },
      { 
        label: 'contains', 
        verb: 'contains',
        description: 'Contains or includes',
        detail: `${selectedSource.label} contains ${selectedTarget.label}`
      },
      { 
        label: 'references', 
        verb: 'references',
        description: 'References or mentions',
        detail: `${selectedSource.label} references ${selectedTarget.label}`
      },
      { 
        label: 'imports', 
        verb: 'imports',
        description: 'Imports from',
        detail: `${selectedSource.label} imports ${selectedTarget.label}`
      },
      { 
        label: 'exports', 
        verb: 'exports',
        description: 'Exports to',
        detail: `${selectedSource.label} exports ${selectedTarget.label}`
      }
    ];

    const selectedVerb = await vscode.window.showQuickPick(verbOptions, {
      placeHolder: 'Select relation type',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selectedVerb) {
      return;
    }

    // 5. 检查关系是否已存在
    const exists = this.relationService.relationExists(
      selectedSource.entity.id,
      selectedTarget.entity.id,
      selectedVerb.verb as any
    );

    if (exists) {
      const overwrite = await vscode.window.showWarningMessage(
        `Relation already exists: ${selectedSource.label} ${selectedVerb.label} ${selectedTarget.label}`,
        'Continue Anyway',
        'Cancel'
      );
      
      if (overwrite !== 'Continue Anyway') {
        return;
      }
    }

    // 6. 创建关系
    try {
      this.relationService.addRelation(
        selectedSource.entity.id,
        selectedTarget.entity.id,
        selectedVerb.verb as any
      );

      vscode.window.showInformationMessage(
        `✅ Relation created: ${selectedSource.label} ${selectedVerb.label} ${selectedTarget.label}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create relation: ${error}`);
    }
  }

  /**
   * 删除观察记录
   */
  public async deleteObservation(): Promise<void> {
    // 1. 获取所有实体
    const allEntities = this.entityService.listEntities();
    
    if (allEntities.length === 0) {
      vscode.window.showWarningMessage('No entities found');
      return;
    }

    // 收集所有观察记录
    const allObservations: Array<{
      observation: any;
      entity: any;
      displayLabel: string;
    }> = [];

    for (const entity of allEntities) {
      const observations = this.observationService.getObservations(entity.id);
      for (const observation of observations) {
        // 截断长文本用于显示
        const preview = observation.content.length > 80 
          ? observation.content.substring(0, 80) + '...'
          : observation.content;
        
        allObservations.push({
          observation,
          entity,
          displayLabel: preview
        });
      }
    }

    if (allObservations.length === 0) {
      vscode.window.showInformationMessage('No observations to delete');
      return;
    }

    // 2. 让用户选择要删除的观察记录
    const observationItems = allObservations.map(item => ({
      label: item.displayLabel,
      description: `${item.entity.name} (${item.entity.type})`,
      detail: `${item.entity.filePath}:${item.entity.startLine}`,
      observationData: item
    }));

    const selected = await vscode.window.showQuickPick(observationItems, {
      placeHolder: 'Select observation to delete',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selected) {
      return;
    }

    // 3. 确认删除（显示完整内容）
    const fullContent = selected.observationData.observation.content;
    const answer = await vscode.window.showWarningMessage(
      `Delete observation?\n\n"${fullContent}"\n\nFrom: ${selected.observationData.entity.name}`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (answer !== 'Delete') {
      return;
    }

    // 4. 执行删除
    try {
      this.observationService.deleteObservation(selected.observationData.observation.id);
      vscode.window.showInformationMessage(
        `✅ Observation deleted from ${selected.observationData.entity.name}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete observation: ${error}`);
    }
  }

  /**
   * 从树视图删除关系
   */
  public async deleteRelationFromTree(treeItem: any): Promise<void> {
    if (!treeItem || !treeItem.relationData) {
      vscode.window.showErrorMessage('Invalid relation data');
      return;
    }

    const relationData = treeItem.relationData;
    const displayLabel = `${relationData.sourceName} ${relationData.verb} ${relationData.targetName}`;

    // 确认删除
    const answer = await vscode.window.showWarningMessage(
      `Delete relation?\n\n${displayLabel}`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (answer !== 'Delete') {
      return;
    }

    // 执行删除
    try {
      this.relationService.removeRelation(relationData.id);
      vscode.window.showInformationMessage(`✅ Relation deleted: ${displayLabel}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete relation: ${error}`);
    }
  }

  /**
   * 删除关系（从命令面板，显示列表选择）
   */
  public async deleteRelation(): Promise<void> {
    // 1. 获取所有关系
    const allEntities = this.entityService.listEntities();
    
    if (allEntities.length === 0) {
      vscode.window.showWarningMessage('No entities found');
      return;
    }

    // 收集所有关系
    const allRelations: Array<{
      relation: any;
      sourceEntity: any;
      targetEntity: any;
      displayLabel: string;
    }> = [];

    for (const entity of allEntities) {
      const relations = this.relationService.getRelations(entity.id, 'outgoing');
      for (const relation of relations) {
        const targetEntity = this.entityService.getEntity(relation.targetEntityId);
        if (targetEntity) {
          allRelations.push({
            relation,
            sourceEntity: entity,
            targetEntity,
            displayLabel: `${entity.name} ${relation.verb} ${targetEntity.name}`
          });
        }
      }
    }

    if (allRelations.length === 0) {
      vscode.window.showInformationMessage('No relations to delete');
      return;
    }

    // 2. 让用户选择要删除的关系
    const relationItems = allRelations.map(item => ({
      label: item.displayLabel,
      description: `${item.sourceEntity.filePath}:${item.sourceEntity.startLine} → ${item.targetEntity.filePath}:${item.targetEntity.startLine}`,
      detail: `Type: ${item.relation.verb}`,
      relationData: item
    }));

    const selected = await vscode.window.showQuickPick(relationItems, {
      placeHolder: 'Select relation to delete',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selected) {
      return;
    }

    // 3. 确认删除
    const answer = await vscode.window.showWarningMessage(
      `Delete relation: ${selected.label}?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (answer !== 'Delete') {
      return;
    }

    // 4. 执行删除
    try {
      this.relationService.removeRelation(selected.relationData.relation.id);
      vscode.window.showInformationMessage(`✅ Relation deleted: ${selected.label}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete relation: ${error}`);
    }
  }

  /**
   * 删除实体（从树视图右键调用）
   */
  public async deleteEntity(treeItem?: any): Promise<void> {
    let entityToDelete: Entity | null = null;

    // 如果从树视图右键调用，treeItem.entity 包含实体信息
    if (treeItem && treeItem.entity && treeItem.type === 'entity') {
      entityToDelete = treeItem.entity;
    } else {
      // 如果没有传入实体，让用户选择
      const entities = this.entityService.listEntities();
      if (entities.length === 0) {
        vscode.window.showInformationMessage('No entities to delete');
        return;
      }

      const selected = await vscode.window.showQuickPick(
        entities.map(e => ({
          label: e.name,
          description: `${e.type} - ${e.filePath}:${e.startLine}`,
          entity: e
        })),
        { placeHolder: 'Select entity to delete' }
      );

      if (!selected) {
        return;
      }

      entityToDelete = selected.entity;
    }

    if (!entityToDelete) {
      return;
    }

    // 确认删除
    const answer = await vscode.window.showWarningMessage(
      `Are you sure you want to delete entity "${entityToDelete.name}"?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (answer !== 'Delete') {
      return;
    }

    try {
      // 检查是否有关联的观察记录
      const observations = this.observationService.getObservations(entityToDelete.id);
      const relations = this.relationService.getRelations(entityToDelete.id);

      let confirmMessage = `Deleting entity "${entityToDelete.name}"`;
      if (observations.length > 0 || relations.length > 0) {
        confirmMessage += `\n\nThis will also delete:\n`;
        if (observations.length > 0) {
          confirmMessage += `- ${observations.length} observation(s)\n`;
        }
        if (relations.length > 0) {
          confirmMessage += `- ${relations.length} relation(s)\n`;
        }
        confirmMessage += `\nContinue?`;

        const finalConfirm = await vscode.window.showWarningMessage(
          confirmMessage,
          { modal: true },
          'Delete All',
          'Cancel'
        );

        if (finalConfirm !== 'Delete All') {
          return;
        }
      }

      // 执行删除
      const success = this.entityService.deleteEntity(entityToDelete.id);

      if (success) {
        vscode.window.showInformationMessage(`✅ Entity "${entityToDelete.name}" deleted successfully`);
      } else {
        vscode.window.showErrorMessage(`Failed to delete entity "${entityToDelete.name}"`);
      }
    } catch (error: any) {
      console.error('Error deleting entity:', error);
      vscode.window.showErrorMessage(`Error deleting entity: ${error.message}`);
    }
  }

  /**
   * 导出知识图谱
   */
  public async exportGraph(): Promise<void> {
    // 选择导出格式
    const format = await vscode.window.showQuickPick(
      [
        { label: 'Markdown', description: '导出为 Markdown 格式 (.md)', value: 'md' },
        { label: 'JSON', description: '导出为 JSON 格式 (.json)', value: 'json' },
      ],
      {
        placeHolder: '选择导出格式',
      }
    );

    if (!format) {
      return;
    }

    // 选择保存位置
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('请先打开一个工作区');
      return;
    }

    const defaultFileName = this.exportService.generateExportFileName(format.value as 'md' | 'json');
    const defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, defaultFileName);

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: format.value === 'md' 
        ? { 'Markdown': ['md'] }
        : { 'JSON': ['json'] },
      saveLabel: '导出',
    });

    if (!saveUri) {
      return;
    }

    try {
      // 执行导出
      if (format.value === 'md') {
        await this.exportService.exportToMarkdown(saveUri.fsPath);
      } else {
        await this.exportService.exportToJSON(saveUri.fsPath);
      }

      // 询问是否打开导出的文件
      const action = await vscode.window.showInformationMessage(
        `✅ 知识图谱已成功导出到 ${path.basename(saveUri.fsPath)}`,
        '打开文件',
        '在文件夹中显示'
      );

      if (action === '打开文件') {
        const doc = await vscode.workspace.openTextDocument(saveUri);
        await vscode.window.showTextDocument(doc);
      } else if (action === '在文件夹中显示') {
        await vscode.commands.executeCommand('revealFileInOS', saveUri);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`导出失败: ${error}`);
    }
  }
}

