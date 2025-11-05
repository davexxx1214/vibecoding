import * as vscode from 'vscode';
import { EntityService } from '../../services/entityService';
import { RelationService } from '../../services/relationService';
import { ObservationService } from '../../services/observationService';
import { Entity, EntityType } from '../../utils/types';

/**
 * 实体相关的命令处理器
 */
export class EntityCommands {
  constructor(
    private entityService: EntityService,
    private relationService: RelationService,
    private observationService: ObservationService
  ) {}

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
      const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
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
  public async addObservationToEntity(entityId?: string): Promise<void> {
    let targetEntityId = entityId;

    // 如果没有提供实体 ID，尝试从当前位置查找
    if (!targetEntityId) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (!workspaceFolder) {
        return;
      }

      const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
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
      this.observationService.addObservation(targetEntityId, content);
      vscode.window.showInformationMessage('Observation added successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to add observation: ${error}`);
    }
  }

  /**
   * 查看实体详情
   */
  public async viewEntityDetails(entityId?: string): Promise<void> {
    let entity: Entity | null = null;

    if (entityId) {
      entity = this.entityService.getEntity(entityId);
    } else {
      // 从当前位置查找实体
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (!workspaceFolder) {
        return;
      }

      const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
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
}

