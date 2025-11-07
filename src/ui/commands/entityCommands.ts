import * as vscode from 'vscode';
import * as path from 'path';
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
}

