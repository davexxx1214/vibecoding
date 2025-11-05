import * as vscode from 'vscode';
import { DatabaseService } from './services/database';
import { EntityService } from './services/entityService';
import { RelationService } from './services/relationService';
import { ObservationService } from './services/observationService';
import { KnowledgeHoverProvider } from './providers/hoverProvider';
import { KnowledgeCodeLensProvider } from './providers/codeLensProvider';
import { KnowledgeTreeDataProvider } from './providers/treeDataProvider';
import { EntityCommands } from './ui/commands/entityCommands';

/**
 * 插件激活时调用
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Knowledge Graph extension is now active');

  // 检查是否有工作区
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('Knowledge Graph: Please open a folder to use this extension');
    // 注册占位命令，避免命令未定义错误
    registerPlaceholderCommands(context);
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  console.log('Workspace root:', workspaceRoot);

  try {
    // 初始化服务层
    console.log('Initializing database...');
    const dbService = new DatabaseService();
    await dbService.initialize(workspaceRoot);
    console.log('Database initialized successfully');

    const entityService = new EntityService(dbService);
    const relationService = new RelationService(dbService, entityService);
    const observationService = new ObservationService(dbService, entityService);

    // 初始化命令处理器
    const entityCommands = new EntityCommands(
      entityService,
      relationService,
      observationService
    );

    // 注册树视图
    const treeDataProvider = new KnowledgeTreeDataProvider(
      entityService,
      relationService,
      observationService
    );
    const treeView = vscode.window.createTreeView('knowledgeGraphExplorer', {
      treeDataProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // 注册 CodeLens Provider
    const codeLensProvider = new KnowledgeCodeLensProvider(
      entityService,
      relationService,
      observationService
    );
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { scheme: 'file' },
        codeLensProvider
      )
    );

    // 注册命令
    console.log('Registering commands...');
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.createEntity',
        async () => {
          try {
            console.log('Executing: knowledge.createEntity');
            await entityCommands.createEntityFromSelection();
            // 刷新树视图和 CodeLens
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in createEntity:', error);
            vscode.window.showErrorMessage(`Error creating entity: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.addObservation',
        async (entityId?: string) => {
          try {
            console.log('Executing: knowledge.addObservation');
            await entityCommands.addObservationToEntity(entityId);
            // 刷新 CodeLens 显示更新的统计
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in addObservation:', error);
            vscode.window.showErrorMessage(`Error adding observation: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.viewEntityDetails',
        async (entityId?: string) => {
          try {
            console.log('Executing: knowledge.viewEntityDetails');
            await entityCommands.viewEntityDetails(entityId);
          } catch (error) {
            console.error('Error in viewEntityDetails:', error);
            vscode.window.showErrorMessage(`Error viewing entity: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.jumpToEntity',
        async (entity) => {
          try {
            console.log('Executing: knowledge.jumpToEntity');
            await entityCommands.jumpToEntity(entity);
          } catch (error) {
            console.error('Error in jumpToEntity:', error);
            vscode.window.showErrorMessage(`Error jumping to entity: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.searchGraph',
        async () => {
          try {
            console.log('Executing: knowledge.searchGraph');
            await entityCommands.searchGraph();
          } catch (error) {
            console.error('Error in searchGraph:', error);
            vscode.window.showErrorMessage(`Error searching graph: ${error}`);
          }
        }
      )
    );

    // 注册占位命令（后续实现）
    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.linkToEntity', () => {
        vscode.window.showInformationMessage('Link to Entity - Coming soon!');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.visualizeGraph', () => {
        vscode.window.showInformationMessage('Visualize Graph - Coming soon!');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.exportGraph', () => {
        vscode.window.showInformationMessage('Export Graph - Coming soon!');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.importGraph', () => {
        vscode.window.showInformationMessage('Import Graph - Coming soon!');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.clearGraph', async () => {
        const answer = await vscode.window.showWarningMessage(
          'Are you sure you want to clear the entire knowledge graph?',
          'Yes', 'No'
        );
        if (answer === 'Yes') {
          vscode.window.showInformationMessage('Clear Graph - Coming soon!');
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.settings', () => {
        vscode.window.showInformationMessage('Settings - Coming soon!');
      })
    );

    // 注册 Hover Provider
    const hoverProvider = new KnowledgeHoverProvider(
      entityService,
      relationService,
      observationService
    );
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        { scheme: 'file' },
        hoverProvider
      )
    );

    // 注册刷新命令
    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.refresh', () => {
        treeDataProvider.refresh();
        codeLensProvider.refresh();
        vscode.window.showInformationMessage('Knowledge Graph refreshed');
      })
    );

    // 清理资源
    context.subscriptions.push({
      dispose: () => {
        dbService.close();
      },
    });

    console.log('All commands registered successfully');
    vscode.window.showInformationMessage('✅ Knowledge Graph extension activated successfully!');
  } catch (error) {
    console.error('Failed to activate Knowledge Graph:', error);
    vscode.window.showErrorMessage(`Failed to activate Knowledge Graph: ${error}`);
    // 即使激活失败，也注册占位命令
    registerPlaceholderCommands(context);
  }
}

/**
 * 注册占位命令
 */
function registerPlaceholderCommands(context: vscode.ExtensionContext) {
  const placeholderCommands = [
    'knowledge.createEntity',
    'knowledge.addObservation',
    'knowledge.viewEntityDetails',
    'knowledge.jumpToEntity',
    'knowledge.searchGraph',
    'knowledge.linkToEntity',
    'knowledge.visualizeGraph',
    'knowledge.exportGraph',
    'knowledge.importGraph',
    'knowledge.clearGraph',
    'knowledge.settings',
    'knowledge.refresh',
  ];

  placeholderCommands.forEach(commandId => {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, () => {
        vscode.window.showWarningMessage('Please open a folder to use Knowledge Graph features');
      })
    );
  });
}

/**
 * 插件停用时调用
 */
export function deactivate() {
  console.log('Knowledge Graph extension is now deactivated');
}

