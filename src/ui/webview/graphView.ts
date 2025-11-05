import * as vscode from 'vscode';

/**
 * 图谱可视化 Webview
 * 阶段五实现
 */
export class GraphView {
  public static currentPanel: GraphView | undefined;
  
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
    
    // 设置初始内容
    this._update();
    
    // 监听面板关闭
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    // 如果已经存在，则显示
    if (GraphView.currentPanel) {
      GraphView.currentPanel._panel.reveal(vscode.ViewColumn.One);
      return;
    }

    // 创建新的面板
    const panel = vscode.window.createWebviewPanel(
      'knowledgeGraph',
      'Knowledge Graph',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    GraphView.currentPanel = new GraphView(panel);
  }

  public dispose() {
    GraphView.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Knowledge Graph';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Graph</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .placeholder {
            text-align: center;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 16px;
        }
        p {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <h1>🧠 Knowledge Graph Visualization</h1>
        <p>This feature will be implemented in Phase 5</p>
        <p>Coming soon: Interactive graph visualization with React Flow</p>
    </div>
</body>
</html>`;
  }
}

