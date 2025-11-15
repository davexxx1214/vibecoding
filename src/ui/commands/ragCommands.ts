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
   * 诊断 RAG 状态
   */
  public async diagnoseRAGStatus(): Promise<void> {
    const diagnosticInfo: string[] = [
      '# RAG 功能诊断报告\n',
      `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`,
      '---\n',
      '## 1. Gemini Client 状态\n'
    ];

    // 检查 Gemini Client
    const clientInitialized = this.geminiClient.isInitialized();
    diagnosticInfo.push(`- **初始化状态**: ${clientInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
    
    if (clientInitialized) {
      diagnosticInfo.push(`- **配置的模型**: ${this.geminiClient.getConfiguredModel()}`);
      const apiKey = this.geminiClient.getApiKey();
      if (apiKey) {
        diagnosticInfo.push(`- **API Key**: ${apiKey.substring(0, 10)}... (已配置)`);
      }
    } else {
      diagnosticInfo.push('\n⚠️ **问题**: Gemini Client 未初始化');
      diagnosticInfo.push('**解决方案**: 请配置 Gemini API Key');
      diagnosticInfo.push('设置路径: `knowledgeGraph.gemini.apiKey`\n');
    }

    diagnosticInfo.push('\n## 2. Store 状态\n');

    // 检查 Store 信息
    const storeInfo = this.ragService.getStoreInfo();
    if (storeInfo) {
      diagnosticInfo.push(`- **Store 名称**: \`${storeInfo.storeName}\``);
      diagnosticInfo.push(`- **项目名称**: ${storeInfo.projectName}`);
      diagnosticInfo.push(`- **本地记录文件数**: ${storeInfo.fileCount}`);
      diagnosticInfo.push(`- **创建时间**: ${new Date(storeInfo.createdAt).toLocaleString('zh-CN')}`);
      
      // 尝试获取云端信息
      diagnosticInfo.push('\n**正在查询云端状态...**');
      
      try {
        const cloudInfo = await this.ragService.getStoreInfoFromCloud();
        if (cloudInfo) {
          diagnosticInfo.push('\n### 云端实时数据');
          diagnosticInfo.push(`- **活跃文档数**: ${cloudInfo.activeDocumentsCount}`);
          diagnosticInfo.push(`- **处理中文档数**: ${cloudInfo.pendingDocumentsCount}`);
          diagnosticInfo.push(`- **失败文档数**: ${cloudInfo.failedDocumentsCount}`);
          
          if (cloudInfo.activeDocumentsCount === 0) {
            diagnosticInfo.push('\n⚠️ **提示**: 云端没有活跃文档，请添加文档到 `Knowledge/` 文件夹');
          } else {
            diagnosticInfo.push('\n✅ **状态**: 云端 Store 正常，可以使用搜索功能');
          }
        } else {
          diagnosticInfo.push('\n⚠️ **无法获取云端信息** (网络问题或 Store 不存在)');
        }
      } catch (error) {
        diagnosticInfo.push(`\n❌ **错误**: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      diagnosticInfo.push('❌ **Store 信息不可用**\n');
      diagnosticInfo.push('**可能原因**:');
      diagnosticInfo.push('1. RAG Service 未正确初始化');
      diagnosticInfo.push('2. Store 创建失败');
      diagnosticInfo.push('3. 数据库损坏\n');
      diagnosticInfo.push('**建议操作**:');
      diagnosticInfo.push('1. 检查 OUTPUT 面板的 "Knowledge Graph" 日志');
      diagnosticInfo.push('2. 重新加载 VS Code 窗口');
      diagnosticInfo.push('3. 删除 `.vscode/.knowledge/graph.sqlite` 并重启');
    }

    diagnosticInfo.push('\n## 3. 已索引文件\n');
    const indexedFiles = this.ragService.getIndexedFiles();
    if (indexedFiles.length > 0) {
      diagnosticInfo.push(`✅ **本地记录**: ${indexedFiles.length} 个文件\n`);
      indexedFiles.slice(0, 10).forEach(file => {
        diagnosticInfo.push(`- ${file.fileName} (${(file.fileSize / 1024).toFixed(2)} KB)`);
      });
      if (indexedFiles.length > 10) {
        diagnosticInfo.push(`\n...还有 ${indexedFiles.length - 10} 个文件`);
      }
    } else {
      diagnosticInfo.push('⚠️ **本地无文件记录**\n');
      diagnosticInfo.push('**注意**: 即使本地无记录，云端可能有文档。');
      diagnosticInfo.push('请检查云端状态（上面的"云端实时数据"）。');
    }

    diagnosticInfo.push('\n---\n');
    diagnosticInfo.push('## 💡 故障排查步骤\n');
    diagnosticInfo.push('1. **配置 API Key**: 设置 → 搜索 "gemini" → 配置 API Key');
    diagnosticInfo.push('2. **测试连接**: 运行命令 "Knowledge: Test Gemini API Connection"');
    diagnosticInfo.push('3. **添加文档**: 在 `Knowledge/` 文件夹添加测试文档');
    diagnosticInfo.push('4. **查看日志**: OUTPUT 面板 → Knowledge Graph');
    diagnosticInfo.push('5. **查看教程**: [QUICKSTART_RAG.md](./QUICKSTART_RAG.md)');

    // 显示诊断报告
    const doc = await vscode.workspace.openTextDocument({
      content: diagnosticInfo.join('\n'),
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { preview: false });
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
      '⚠️ 这将删除云端 Store 并重新索引所有文档。\n\n' +
      '操作将：\n' +
      '1. 删除云端的所有已索引文档\n' +
      '2. 清空本地索引记录\n' +
      '3. 重新扫描 Knowledge/ 文件夹\n' +
      '4. 重新上传所有文档到云端\n\n' +
      '这可能需要几分钟时间。确定继续吗？',
      { modal: true },
      '确定重新索引',
      '取消'
    );

    if (answer !== '确定重新索引') {
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('未找到工作区文件夹');
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '正在重新索引 RAG 文档...',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: '删除云端 Store...' });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          progress.report({ message: '清空本地数据库...' });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          progress.report({ message: '创建新 Store...' });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          progress.report({ message: '扫描并上传文档...' });
          await this.ragService.reindexAll();
        }
      );

      vscode.window.showInformationMessage(
        '✅ 重新索引完成！云端和本地数据已同步。',
        '查看 Store 信息'
      ).then(action => {
        if (action === '查看 Store 信息') {
          vscode.commands.executeCommand('knowledge.rag.viewStoreInfo');
        }
      });
    } catch (error) {
      console.error('Reindex failed:', error);
      vscode.window.showErrorMessage(`重新索引失败: ${error}`);
    }
  }

  /**
   * 查看 Store 信息
   */
  public async viewStoreInfo(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '正在获取 Store 信息...',
      },
      async () => {
        const storeInfo = this.ragService.getStoreInfo();
        
        if (!storeInfo) {
          vscode.window.showWarningMessage('Store 信息不可用');
          return;
        }

        // 从云端获取实时信息
        const cloudInfo = await this.ragService.getStoreInfoFromCloud();

        // 构建信息文本
        const infoLines = [
          `# RAG Store 信息\n`,
          `**项目名称**：${storeInfo.projectName}`,
          `**Store 名称**：\`${storeInfo.storeName}\``,
          `**Display Name**：\`${cloudInfo?.displayName || 'N/A'}\``,
          `**工作区路径**：\`${storeInfo.workspaceRoot}\``,
          `\n## 📊 文档统计（云端实时数据）\n`,
          cloudInfo
            ? [
                `- **活跃文档数**：${cloudInfo.activeDocumentsCount}`,
                `- **处理中文档数**：${cloudInfo.pendingDocumentsCount}`,
                `- **失败文档数**：${cloudInfo.failedDocumentsCount}`,
                `- **总计**：${cloudInfo.activeDocumentsCount + cloudInfo.pendingDocumentsCount + cloudInfo.failedDocumentsCount}`,
              ].join('\n')
            : '⚠️ 无法获取云端信息（请检查网络连接）',
          `\n## 📝 本地元数据\n`,
          `- **本地记录的文件数**：${storeInfo.fileCount}`,
          `- **创建时间**：${new Date(storeInfo.createdAt).toLocaleString('zh-CN')}`,
          storeInfo.lastSyncAt 
            ? `- **最后同步**：${new Date(storeInfo.lastSyncAt).toLocaleString('zh-CN')}` 
            : '',
          `\n---\n`,
          `## 🔐 项目隔离说明\n`,
          `每个项目都有唯一的 **File Search Store**，确保文档不会与其他项目混淆。`,
          `\nStore 基于项目路径自动创建，即使使用相同的 API Key，`,
          `不同项目的文档也完全隔离在独立的 Store 中。`,
          `\n## ☁️ 云端 RAG\n`,
          `文档已上传到 **Google Gemini File Search Store**：`,
          `- ✅ 真正的向量语义搜索`,
          `- ✅ 自动分块和嵌入`,
          `- ✅ 支持 100+ 种文件格式`,
          `- ✅ 无需本地处理`,
          `\n💡 **提示**：本地仅保存元数据，实际文档和索引都在云端。`,
        ].filter(Boolean).join('\n');

        // 显示在新标签页
        const doc = await vscode.workspace.openTextDocument({
          content: infoLines,
          language: 'markdown',
        });

        await vscode.window.showTextDocument(doc, { preview: false });
      }
    );
  }
}

