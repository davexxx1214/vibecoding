import * as vscode from 'vscode';
import { AutoGraphService, CodeAnalyzer, AutoGraphStats } from '../../services/autoGraph';
import { t } from '../../i18n/i18nService';

/**
 * 自动图谱命令处理器
 */
export class AutoGraphCommands {
  constructor(
    private autoGraphService: AutoGraphService,
    private codeAnalyzer: CodeAnalyzer
  ) {}

  /**
   * 分析整个工作区
   */
  public async analyzeWorkspace(): Promise<void> {
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: t().autoGraph.commands.analyzeWorkspace.title,
        cancellable: false,
      },
      async (progress) => {
        return await this.codeAnalyzer.analyzeWorkspace(progress);
      }
    );

    if (result.errors.length > 0) {
      const errorMessages = result.errors
        .slice(0, 5)
        .map((e) => `${e.filePath}: ${e.message}`)
        .join('\n');
      
      vscode.window.showWarningMessage(
        t().autoGraph.commands.analyzeWorkspace.completedWithErrors(
          result.entities.length,
          result.relations.length,
          result.errors.length
        ),
        t().autoGraph.commands.analyzeWorkspace.viewErrors
      ).then((action) => {
        if (action === t().autoGraph.commands.analyzeWorkspace.viewErrors) {
          const outputChannel = vscode.window.createOutputChannel('Auto Graph Errors');
          outputChannel.appendLine('Analysis Errors:');
          result.errors.forEach((e) => {
            outputChannel.appendLine(`${e.filePath}:${e.line || ''} - ${e.message}`);
          });
          outputChannel.show();
        }
      });
    } else {
      vscode.window.showInformationMessage(
        t().autoGraph.commands.analyzeWorkspace.completed(
          result.entities.length,
          result.relations.length,
          result.filesCached
        )
      );
    }
  }

  /**
   * 分析当前文件
   */
  public async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(t().autoGraph.commands.analyzeFile.noActiveFile);
      return;
    }

    const uri = editor.document.uri;
    const fileName = vscode.workspace.asRelativePath(uri);

    // 检查文件类型
    if (!this.isAnalyzableFile(uri.fsPath)) {
      vscode.window.showWarningMessage(
        t().autoGraph.commands.analyzeFile.unsupportedType(fileName)
      );
      return;
    }

    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: t().autoGraph.commands.analyzeFile.title(fileName),
        cancellable: false,
      },
      async () => {
        return await this.codeAnalyzer.analyzeFile(uri, true);
      }
    );

    if (!result) {
      vscode.window.showInformationMessage(
        t().autoGraph.commands.analyzeFile.unchanged(fileName)
      );
      return;
    }

    if (result.errors.length > 0) {
      vscode.window.showWarningMessage(
        t().autoGraph.commands.analyzeFile.error(fileName, result.errors[0].message)
      );
    } else {
      vscode.window.showInformationMessage(
        t().autoGraph.commands.analyzeFile.completed(
          fileName,
          result.entities.length,
          result.relations.length
        )
      );
    }
  }

  /**
   * 清空自动图谱
   */
  public async clearAutoGraph(): Promise<void> {
    const answer = await vscode.window.showWarningMessage(
      t().autoGraph.commands.clear.confirm,
      { modal: true },
      t().autoGraph.commands.clear.yes,
      t().autoGraph.commands.clear.no
    );

    if (answer === t().autoGraph.commands.clear.yes) {
      this.autoGraphService.clearAll();
      vscode.window.showInformationMessage(t().autoGraph.commands.clear.completed);
    }
  }

  /**
   * 查看自动图谱统计
   */
  public async viewAutoGraphStats(): Promise<void> {
    const stats = this.autoGraphService.getStats();

    const statsContent = this.formatStats(stats);

    const doc = await vscode.workspace.openTextDocument({
      content: statsContent,
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { preview: true });
  }

  /**
   * 格式化统计信息
   */
  private formatStats(stats: AutoGraphStats): string {
    const lines: string[] = [
      '# Auto Graph Statistics',
      '',
      `## Overview`,
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| **Entities** | ${stats.entityCount} |`,
      `| **Relations** | ${stats.relationCount} |`,
      `| **Files** | ${stats.fileCount} |`,
      '',
    ];

    if (stats.lastAnalyzedAt) {
      lines.push(`**Last Analyzed:** ${new Date(stats.lastAnalyzedAt).toLocaleString()}`);
      lines.push('');
    }

    if (Object.keys(stats.entitiesByType).length > 0) {
      lines.push('## Entities by Type');
      lines.push('');
      lines.push('| Type | Count |');
      lines.push('|------|-------|');
      for (const [type, count] of Object.entries(stats.entitiesByType)) {
        lines.push(`| ${type} | ${count} |`);
      }
      lines.push('');
    }

    if (Object.keys(stats.relationsByVerb).length > 0) {
      lines.push('## Relations by Verb');
      lines.push('');
      lines.push('| Verb | Count |');
      lines.push('|------|-------|');
      for (const [verb, count] of Object.entries(stats.relationsByVerb)) {
        lines.push(`| ${verb} | ${count} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 检查文件是否可分析
   */
  private isAnalyzableFile(filePath: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return extensions.some((ext) => filePath.endsWith(ext));
  }
}

