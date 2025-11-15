import * as vscode from 'vscode';
import * as path from 'path';
import { RAGService } from '../services/ragService';
import { t, getLocale } from '../i18n/i18nService';

/**
 * RAG 文档树视图节点类型
 */
type RAGTreeItemType = 'folder' | 'file' | 'stat';

/**
 * RAG 文档树视图节点
 */
class RAGTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: RAGTreeItemType,
    public readonly fileInfo?: {
      filePath: string;
      fileName: string;
      fileSize: number;
      indexedAt: number;
    },
    public readonly folderName?: string  // 添加文件夹名称属性
  ) {
    super(label, collapsibleState);

    // 设置图标
    if (type === 'folder') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (type === 'file') {
      this.iconPath = new vscode.ThemeIcon('file-text');
      this.contextValue = 'ragFile';
      
      // 添加tooltip
      if (fileInfo) {
        const common = t().common;
        this.tooltip = `${fileInfo.filePath}\n${common.size}: ${(fileInfo.fileSize / 1024).toFixed(2)} KB\n${common.indexedAt}: ${new Date(fileInfo.indexedAt).toLocaleString(getLocale())}`;
        this.description = `${(fileInfo.fileSize / 1024).toFixed(2)} KB`;
      }
    } else if (type === 'stat') {
      this.iconPath = new vscode.ThemeIcon('info');
    }

    // 文件节点可点击
    if (type === 'file' && fileInfo) {
      this.command = {
        command: 'knowledge.rag.openDocument',
        title: t().common.openDocument,
        arguments: [fileInfo.filePath],
      };
    }
  }
}

/**
 * RAG 文档树视图数据提供者
 */
export class RAGTreeDataProvider implements vscode.TreeDataProvider<RAGTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RAGTreeItem | undefined | null | void> =
    new vscode.EventEmitter<RAGTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<RAGTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private ragService: RAGService) {}

  /**
   * 刷新树视图
   */
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * 获取树节点
   */
  getTreeItem(element: RAGTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * 获取子节点
   */
  async getChildren(element?: RAGTreeItem): Promise<RAGTreeItem[]> {
    if (!element) {
      // 根节点
      return this.getRootChildren();
    }

    // 文件夹节点
    if (element.type === 'folder' && element.folderName) {
      return this.getFilesByFolder(element.folderName);
    }

    return [];
  }

  /**
   * 获取根节点
   */
  private getRootChildren(): RAGTreeItem[] {
    const indexedFiles = this.ragService.getIndexedFiles();
    const children: RAGTreeItem[] = [];

    // 统计信息
    const totalFiles = indexedFiles.length;
    const totalSize = indexedFiles.reduce((sum, f) => sum + f.fileSize, 0);

    children.push(
      new RAGTreeItem(
        t().common.indexed(totalFiles, totalSize / 1024 / 1024),
        vscode.TreeItemCollapsibleState.None,
        'stat'
      )
    );

    if (totalFiles === 0) {
      return children;
    }

    // 按文件夹分组
    const folders = this.groupFilesByFolder(indexedFiles);

    // 添加文件夹节点
    for (const folder of folders) {
      const fileCount = indexedFiles.filter(f =>
        this.getFolder(f.filePath) === folder
      ).length;

      children.push(
        new RAGTreeItem(
          `${folder || 'Knowledge'} (${fileCount})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          'folder',
          undefined,  // fileInfo
          folder      // folderName
        )
      );
    }

    return children;
  }

  /**
   * 按文件夹分组
   */
  private groupFilesByFolder(files: any[]): string[] {
    const folders = new Set<string>();

    for (const file of files) {
      const folder = this.getFolder(file.filePath);
      folders.add(folder);
    }

    return Array.from(folders).sort();
  }

  /**
   * 获取文件夹名称
   */
  private getFolder(filePath: string): string {
    // 提取 Knowledge/ 后的第一级目录
    const parts = filePath.split('/').filter(p => p);
    
    if (parts.length <= 1) {
      return 'Knowledge';
    }

    // 跳过 "Knowledge"
    if (parts[0] === 'Knowledge') {
      return parts.length > 2 ? parts[1] : 'Knowledge';
    }

    return parts[0];
  }

  /**
   * 获取指定文件夹的文件
   */
  private getFilesByFolder(folder: string): RAGTreeItem[] {
    const indexedFiles = this.ragService.getIndexedFiles();
    const files = indexedFiles.filter(f => this.getFolder(f.filePath) === folder);

    return files.map(
      file =>
        new RAGTreeItem(
          file.fileName,
          vscode.TreeItemCollapsibleState.None,
          'file',
          {
            filePath: file.filePath,
            fileName: file.fileName,
            fileSize: file.fileSize,
            indexedAt: file.indexedAt,
          }
        )
    );
  }
}

