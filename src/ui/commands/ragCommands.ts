import * as vscode from 'vscode';
import { RAGService, SearchResult, QuestionAnswerResult, StoreInfo } from '../../services/ragService';
import { GeminiClient } from '../../services/geminiClient';

/**
 * RAG 相关命令处理器
 */
export class RAGCommands {
  constructor(
    private ragService: RAGService,
    private geminiClient: GeminiClient
  ) {}

  /**
   * 搜索文档
   */
  public async searchDocuments(): Promise<void> {
    // 确保客户端已初始化
    if (!this.geminiClient.isInitialized()) {
      await this.geminiClient.initialize();
      if (!this.geminiClient.isInitialized()) {
        vscode.window.showWarningMessage(
          '请先在设置中配置 Gemini API Key',
          '打开设置'
        ).then(action => {
          if (action === '打开设置') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'knowledgeGraph.gemini.apiKey');
          }
        });
        return;
      }
    }

    // 检查是否有已索引的文档
    const indexedFiles = this.ragService.getIndexedFiles();
    if (indexedFiles.length === 0) {
      vscode.window.showWarningMessage(
        '没有已索引的文档。请在 Knowledge/ 文件夹中添加文档。'
      );
      return;
    }

    // 输入搜索查询
    const query = await vscode.window.showInputBox({
      prompt: '输入搜索查询',
      placeHolder: '例如：如何配置数据库连接？',
      validateInput: (value) => {
        return value.trim() ? null : '查询不能为空';
      },
    });

    if (!query) {
      return;
    }

    try {
      // 显示进度
      const results = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '正在搜索文档...',
          cancellable: false,
        },
        async () => {
          return await this.ragService.searchDocuments(query);
        }
      );

      if (results.length === 0) {
        vscode.window.showInformationMessage('未找到相关文档');
        return;
      }

      // 显示搜索结果
      await this.showSearchResults(results, query);
    } catch (error) {
      console.error('Search error:', error);
      vscode.window.showErrorMessage(`搜索失败: ${error}`);
    }
  }

  /**
   * 显示搜索结果
   */
  private async showSearchResults(
    results: SearchResult[],
    query: string
  ): Promise<void> {
    // 构建 Markdown 格式的搜索结果
    let markdown = `# 文档搜索结果\n\n`;
    markdown += `**查询**：${query}\n\n`;
    markdown += `**找到 ${results.length} 个相关文档**\n\n`;
    markdown += `---\n\n`;

    // 按相关度排序
    const sortedResults = results.sort((a, b) => b.relevance - a.relevance);

    sortedResults.forEach((result, index) => {
      markdown += `## ${index + 1}. ${result.fileName}\n\n`;
      markdown += `**文件路径**：\`${result.filePath}\`\n\n`;
      markdown += `**相关度**：${result.relevance}%\n\n`;
      
      if (result.snippet) {
        markdown += `**相关内容**：\n\n`;
        markdown += `> ${result.snippet}\n\n`;
      }
      
      markdown += `[📂 打开文件](command:knowledge.rag.openDocument?${encodeURIComponent(JSON.stringify(result.filePath))})\n\n`;
      markdown += `---\n\n`;
    });

    markdown += `\n_搜索时间：${new Date().toLocaleString('zh-CN')}_\n`;

    // 在新标签页显示
    const doc = await vscode.workspace.openTextDocument({
      content: markdown,
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { 
      preview: false,
      viewColumn: vscode.ViewColumn.Beside  // 在侧边打开，不覆盖当前文件
    });

    // 提供操作选项
    const action = await vscode.window.showInformationMessage(
      `✅ 找到 ${results.length} 个相关文档`,
      '复制结果',
      '保存为文件'
    );

    if (action === '复制结果') {
      await vscode.env.clipboard.writeText(markdown);
      vscode.window.showInformationMessage('搜索结果已复制到剪贴板');
    } else if (action === '保存为文件') {
      await this.saveSearchResultsToFile(markdown, query);
    }
  }

  /**
   * 保存搜索结果到文件
   */
  private async saveSearchResultsToFile(
    markdown: string,
    query: string
  ): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // 生成文件名
    const safeQuery = query.substring(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `search-${safeQuery}-${timestamp}.md`;

    const defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, 'Knowledge', fileName);

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'Markdown': ['md'] },
      saveLabel: '保存',
    });

    if (saveUri) {
      const fs = require('fs');
      fs.writeFileSync(saveUri.fsPath, markdown, 'utf-8');
      vscode.window.showInformationMessage(`搜索结果已保存到 ${saveUri.fsPath}`);
    }
  }

  /**
   * 智能问答
   */
  public async askQuestion(): Promise<void> {
    // 确保客户端已初始化
    if (!this.geminiClient.isInitialized()) {
      await this.geminiClient.initialize();
      if (!this.geminiClient.isInitialized()) {
        vscode.window.showWarningMessage(
          '请先在设置中配置 Gemini API Key',
          '打开设置'
        ).then(action => {
          if (action === '打开设置') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'knowledgeGraph.gemini.apiKey');
          }
        });
        return;
      }
    }

    // 检查是否有已索引的文档
    const indexedFiles = this.ragService.getIndexedFiles();
    if (indexedFiles.length === 0) {
      vscode.window.showWarningMessage(
        '没有已索引的文档。请在 Knowledge/ 文件夹中添加文档。'
      );
      return;
    }

    // 输入问题
    const question = await vscode.window.showInputBox({
      prompt: '向文档提问',
      placeHolder: '例如：这个项目使用了什么数据库？',
      validateInput: (value) => {
        return value.trim() ? null : '问题不能为空';
      },
    });

    if (!question) {
      return;
    }

    try {
      // 显示进度
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '正在思考...',
          cancellable: false,
        },
        async () => {
          return await this.ragService.askQuestion(question);
        }
      );

      // 显示问答结果
      await this.showQuestionAnswerResult(result, question);
    } catch (error) {
      console.error('Question answering error:', error);
      vscode.window.showErrorMessage(`问答失败: ${error}`);
    }
  }

  /**
   * 显示问答结果
   */
  private async showQuestionAnswerResult(
    result: QuestionAnswerResult,
    question: string
  ): Promise<void> {
    // 构建 Markdown 格式的答案
    let markdown = `# 问答结果\n\n`;
    markdown += `**问题**：${question}\n\n`;
    markdown += `---\n\n`;
    markdown += `## 答案\n\n`;
    markdown += `${result.answer}\n\n`;

    if (result.sources.length > 0) {
      markdown += `---\n\n`;
      markdown += `## 参考来源\n\n`;
      result.sources.forEach((source, i) => {
        markdown += `${i + 1}. ${source}\n`;
      });
    }

    if (result.citations.length > 0) {
      markdown += `\n## 引用\n\n`;
      result.citations.forEach((citation, i) => {
        markdown += `**${citation.fileName}**:\n`;
        markdown += `> ${citation.snippet}\n\n`;
      });
    }

    markdown += `---\n\n`;
    markdown += `_生成时间：${new Date().toLocaleString('zh-CN')}_\n`;

    // 在新标签页显示
    const doc = await vscode.workspace.openTextDocument({
      content: markdown,
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { preview: false });

    // 提供操作选项
    const action = await vscode.window.showInformationMessage(
      '✅ 问答完成',
      '复制到剪贴板',
      '保存为文件'
    );

    if (action === '复制到剪贴板') {
      await vscode.env.clipboard.writeText(markdown);
      vscode.window.showInformationMessage('已复制到剪贴板');
    } else if (action === '保存为文件') {
      await this.saveAnswerToFile(markdown, question);
    }
  }

  /**
   * 保存答案到文件
   */
  private async saveAnswerToFile(
    markdown: string,
    question: string
  ): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // 生成文件名
    const safeQuestion = question.substring(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `qa-${safeQuestion}-${timestamp}.md`;

    const defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, 'Knowledge', fileName);

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'Markdown': ['md'] },
      saveLabel: '保存',
    });

    if (saveUri) {
      const fs = require('fs');
      fs.writeFileSync(saveUri.fsPath, markdown, 'utf-8');

      const openAction = await vscode.window.showInformationMessage(
        `✅ 已保存到 ${require('path').basename(saveUri.fsPath)}`,
        '打开文件'
      );

      if (openAction === '打开文件') {
        const doc = await vscode.workspace.openTextDocument(saveUri);
        await vscode.window.showTextDocument(doc);
      }
    }
  }

  /**
   * 查看已索引的文档
   */
  public async viewIndexedDocuments(): Promise<void> {
    const indexedFiles = this.ragService.getIndexedFiles();

    if (indexedFiles.length === 0) {
      vscode.window.showInformationMessage(
        '没有已索引的文档。请在 Knowledge/ 文件夹中添加文档。'
      );
      return;
    }

    const items = indexedFiles.map(file => ({
      label: `$(file-text) ${file.fileName}`,
      description: file.filePath,
      detail: `大小: ${(file.fileSize / 1024).toFixed(2)} KB | 索引时间: ${new Date(
        file.indexedAt
      ).toLocaleString('zh-CN')}`,
      file,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `已索引 ${indexedFiles.length} 个文档`,
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await this.openDocument(selected.file.filePath);
    }
  }

  /**
   * 打开文档
   */
  private async openDocument(relativePath: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`无法打开文件: ${error}`);
    }
  }

  /**
   * 测试 API 连接
   */
  public async testConnection(): Promise<void> {
    // 先尝试初始化（如果还没初始化的话）
    if (!this.geminiClient.isInitialized()) {
      await this.geminiClient.initialize();
    }

    // 再次检查是否初始化成功
    if (!this.geminiClient.isInitialized()) {
      vscode.window.showWarningMessage(
        'Gemini 客户端未初始化，请在设置中配置 API Key',
        '打开设置'
      ).then(action => {
        if (action === '打开设置') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'knowledgeGraph.gemini.apiKey');
        }
      });
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '正在测试 API 连接...',
        cancellable: false,
      },
      async () => {
        await this.geminiClient.testConnection();
      }
    );
  }

  /**
   * 重新索引所有文档
   */
  public async reindexAll(): Promise<void> {
    const answer = await vscode.window.showWarningMessage(
      '确定要重新索引所有文档吗？这可能需要一些时间。',
      '确定',
      '取消'
    );

    if (answer !== '确定') {
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // TODO: 实现重新索引逻辑
    vscode.window.showInformationMessage('重新索引功能开发中...');
  }

  /**
   * 查看 Store 信息
   */
  public async viewStoreInfo(): Promise<void> {
    const storeInfo = this.ragService.getStoreInfo();
    
    if (!storeInfo) {
      vscode.window.showWarningMessage('Store 信息不可用');
      return;
    }

    // 构建信息文本
    const infoLines = [
      `# RAG Store 信息\n`,
      `**项目名称**：${storeInfo.projectName}`,
      `**Store ID**：\`${storeInfo.storeId}\``,
      `**工作区路径**：\`${storeInfo.workspaceRoot}\``,
      `**已索引文件数**：${storeInfo.fileCount}`,
      `**创建时间**：${new Date(storeInfo.createdAt).toLocaleString('zh-CN')}`,
      storeInfo.lastSyncAt 
        ? `**最后同步**：${new Date(storeInfo.lastSyncAt).toLocaleString('zh-CN')}` 
        : '',
      `\n---\n`,
      `## 📝 说明\n`,
      `每个项目都有唯一的 Store ID，确保文档不会与其他项目混淆。`,
      `\nStore ID 基于项目路径生成，即使使用相同的 API Key，`,
      `不同项目的文档也完全隔离。`,
      `\n**当前状态**：本地模式`,
      `文档索引存储在本地 SQLite 数据库中。`,
    ].filter(Boolean).join('\n');

    // 显示在新标签页
    const doc = await vscode.workspace.openTextDocument({
      content: infoLines,
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { preview: false });
  }
}

