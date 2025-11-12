import * as vscode from 'vscode';
import { DatabaseService } from './services/database';
import { EntityService } from './services/entityService';
import { RelationService } from './services/relationService';
import { ObservationService } from './services/observationService';
import { KnowledgeHoverProvider } from './providers/hoverProvider';
import { KnowledgeCodeLensProvider } from './providers/codeLensProvider';
import { KnowledgeTreeDataProvider } from './providers/treeDataProvider';
import { EntityCommands } from './ui/commands/entityCommands';
import { GraphView } from './ui/webview/graphView';

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
        'knowledge.addRelation',
        async () => {
          try {
            console.log('Executing: knowledge.addRelation');
            await entityCommands.addRelation();
            // 刷新树视图和 CodeLens 显示新的关系
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in addRelation:', error);
            vscode.window.showErrorMessage(`Error adding relation: ${error}`);
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

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.deleteEntity',
        async (treeItem) => {
          try {
            console.log('Executing: knowledge.deleteEntity');
            await entityCommands.deleteEntity(treeItem);
            // 刷新树视图和 CodeLens
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in deleteEntity:', error);
            vscode.window.showErrorMessage(`Error deleting entity: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.deleteRelation',
        async () => {
          try {
            console.log('Executing: knowledge.deleteRelation');
            await entityCommands.deleteRelation();
            // 刷新树视图和 CodeLens
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in deleteRelation:', error);
            vscode.window.showErrorMessage(`Error deleting relation: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.deleteRelationFromTree',
        async (treeItem) => {
          try {
            console.log('Executing: knowledge.deleteRelationFromTree');
            await entityCommands.deleteRelationFromTree(treeItem);
            // 刷新树视图和 CodeLens
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in deleteRelationFromTree:', error);
            vscode.window.showErrorMessage(`Error deleting relation: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.deleteObservation',
        async () => {
          try {
            console.log('Executing: knowledge.deleteObservation');
            await entityCommands.deleteObservation();
            // 刷新树视图和 CodeLens
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in deleteObservation:', error);
            vscode.window.showErrorMessage(`Error deleting observation: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'knowledge.linkToEntity',
        async () => {
          try {
            console.log('Executing: knowledge.linkToEntity');
            await entityCommands.linkToEntity();
            // 刷新树视图和 CodeLens 显示新的关系
            treeDataProvider.refresh();
            codeLensProvider.refresh();
          } catch (error) {
            console.error('Error in linkToEntity:', error);
            vscode.window.showErrorMessage(`Error linking to entity: ${error}`);
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.visualizeGraph', () => {
        try {
          console.log('Executing: knowledge.visualizeGraph');
          GraphView.createOrShow(context.extensionUri, entityService, relationService);
        } catch (error) {
          console.error('Error in visualizeGraph:', error);
          vscode.window.showErrorMessage(`Error opening graph: ${error}`);
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.exportGraph', async () => {
        try {
          console.log('Executing: knowledge.exportGraph');
          await entityCommands.exportGraph();
        } catch (error) {
          console.error('Error in exportGraph:', error);
          vscode.window.showErrorMessage(`Error exporting graph: ${error}`);
        }
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

    // AI 集成命令
    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.generateCursorRules', async () => {
        try {
          console.log('Executing: knowledge.generateCursorRules');
          await entityCommands.generateCursorRules();
        } catch (error) {
          console.error('Error in generateCursorRules:', error);
          vscode.window.showErrorMessage(`Error generating Cursor Rules: ${error}`);
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.generateCopilotInstructions', async () => {
        try {
          console.log('Executing: knowledge.generateCopilotInstructions');
          await entityCommands.generateCopilotInstructions();
        } catch (error) {
          console.error('Error in generateCopilotInstructions:', error);
          vscode.window.showErrorMessage(`Error generating Copilot Instructions: ${error}`);
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('knowledge.generateAllAIConfigs', async () => {
        try {
          console.log('Executing: knowledge.generateAllAIConfigs');
          await entityCommands.generateAllAIConfigs();
        } catch (error) {
          console.error('Error in generateAllAIConfigs:', error);
          vscode.window.showErrorMessage(`Error generating AI configs: ${error}`);
        }
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
    'knowledge.addRelation',
    'knowledge.viewEntityDetails',
    'knowledge.jumpToEntity',
    'knowledge.searchGraph',
    'knowledge.deleteEntity',
    'knowledge.deleteRelation',
    'knowledge.deleteObservation',
    'knowledge.linkToEntity',
    'knowledge.visualizeGraph',
    'knowledge.exportGraph',
    'knowledge.importGraph',
    'knowledge.clearGraph',
    'knowledge.settings',
    'knowledge.refresh',
    'knowledge.deleteRelationFromTree',
    'knowledge.generateCursorRules',
    'knowledge.generateCopilotInstructions',
    'knowledge.generateAllAIConfigs',
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

