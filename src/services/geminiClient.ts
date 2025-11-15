import { GoogleGenAI } from '@google/genai';
import * as vscode from 'vscode';

/**
 * Gemini API 客户端封装
 * 处理 API 密钥管理和客户端初始化
 * 使用新的 @google/genai SDK，支持 File Search Store API
 */
export class GeminiClient {
  private client: GoogleGenAI | null = null;
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

      // 初始化新的 GoogleGenAI 客户端
      this.client = new GoogleGenAI({
        apiKey: this.apiKey
      });
      
      console.log('Gemini API client initialized successfully (using @google/genai SDK)');
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
   * 获取客户端实例（用于 RAG Service）
   */
  public getClient(): GoogleGenAI | null {
    return this.client;
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
    if (!this.isInitialized() || !this.client) {
      return false;
    }

    try {
      // 使用新 SDK 的 generateContent 方法
      const result = await this.client.models.generateContent({
        model: this.getConfiguredModel(),
        contents: 'Hello'
      });

      if (result.text) {
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

  /**
   * 获取 API Key（用于日志和调试）
   */
  public getApiKey(): string | null {
    return this.apiKey;
  }
}
