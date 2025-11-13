import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import * as vscode from 'vscode';

/**
 * Gemini API 客户端封装
 * 处理 API 密钥管理和客户端初始化
 */
export class GeminiClient {
  private client: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  /**
   * 初始化客户端
   */
  public async initialize(silent: boolean = false): Promise<boolean> {
    try {
      // 从配置中获取 API Key
      const config = vscode.workspace.getConfiguration('knowledgeGraph');
      const apiKey = config.get<string>('gemini.apiKey');

      if (!apiKey || apiKey.trim() === '') {
        console.log('Gemini API Key not configured, RAG features will be disabled');
        if (!silent) {
          vscode.window.showInformationMessage(
            '💡 提示：在设置中配置 Gemini API Key 以启用 RAG 功能\n' +
            '设置路径：knowledgeGraph.gemini.apiKey',
            '打开设置'
          ).then(action => {
            if (action === '打开设置') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'knowledgeGraph.gemini.apiKey');
            }
          });
        }
        return false;
      }

      // 验证 API Key 格式
      if (!apiKey.startsWith('AIza')) {
        if (!silent) {
          vscode.window.showWarningMessage(
            '⚠️ Gemini API Key 格式可能不正确（应该以 AIza 开头）',
            '打开设置'
          ).then(action => {
            if (action === '打开设置') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'knowledgeGraph.gemini.apiKey');
            }
          });
        }
        return false;
      }

      this.apiKey = apiKey;

      // 初始化客户端
      this.client = new GoogleGenerativeAI(this.apiKey);
      
      console.log('Gemini API client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      if (!silent) {
        vscode.window.showErrorMessage(`初始化 Gemini 客户端失败: ${error}`);
      }
      return false;
    }
  }

  /**
   * 获取 Generative Model 实例
   */
  public getModel(modelName?: string): GenerativeModel | null {
    if (!this.client) {
      vscode.window.showWarningMessage('Gemini 客户端未初始化，请先配置 API Key');
      return null;
    }

    // 如果没有指定模型，使用配置的模型
    const model = modelName || this.getConfiguredModel();
    return this.client.getGenerativeModel({ model });
  }

  /**
   * 检查客户端是否已初始化
   */
  public isInitialized(): boolean {
    return this.client !== null && this.apiKey !== null;
  }


  /**
   * 测试 API 连接
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const model = this.getModel();
      if (!model) {
        return false;
      }

      // 发送测试请求
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      if (response.text()) {
        vscode.window.showInformationMessage('✅ Gemini API 连接测试成功');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      vscode.window.showErrorMessage(`API 连接测试失败: ${error}`);
      return false;
    }
  }

  /**
   * 获取配置的模型名称
   */
  public getConfiguredModel(): string {
    const config = vscode.workspace.getConfiguration('knowledgeGraph');
    return config.get<string>('gemini.model') || 'gemini-2.5-flash';
  }
}

