import * as vscode from 'vscode';
import { EntityService } from '../services/entityService';
import { RelationService } from '../services/relationService';
import { ObservationService } from '../services/observationService';

/**
 * CodeLens 提供者
 * 在代码上方显示实体的统计信息
 */
export class KnowledgeCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    private entityService: EntityService,
    private relationService: RelationService,
    private observationService: ObservationService
  ) {}

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    // 获取当前文件的所有实体
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return codeLenses;
    }

    const relativePath = vscode.workspace.asRelativePath(document.uri);
    const entities = this.entityService.getEntitiesByFile(relativePath);

    for (const entity of entities) {
      // 获取统计信息
      const observationCount = this.observationService.getObservationCount(entity.id);
      const relationCount = this.relationService.getRelationCount(entity.id);

      // 创建 CodeLens 范围
      const range = new vscode.Range(
        entity.startLine - 1, // VSCode 行号从 0 开始
        0,
        entity.startLine - 1,
        0
      );

      // 创建 CodeLens
      const codeLens = new vscode.CodeLens(range, {
        title: `🧠 KG: ${observationCount} observations, ${relationCount} relations`,
        command: 'knowledge.viewEntityDetails',
        arguments: [entity.id],
      });

      codeLenses.push(codeLens);
    }

    return codeLenses;
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}

