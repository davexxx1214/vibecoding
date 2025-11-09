import * as vscode from 'vscode';
import { EntityService } from '../../services/entityService';
import { RelationService } from '../../services/relationService';

/**
 * 图谱可视化 Webview
 */
export class GraphView {
  public static currentPanel: GraphView | undefined;
  
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _entityService: EntityService;
  private readonly _relationService: RelationService;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    entityService: EntityService,
    relationService: RelationService
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._entityService = entityService;
    this._relationService = relationService;
    
    // 设置初始内容
    this._update();
    
    // 监听来自 webview 的消息
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        this._handleMessage(message);
      },
      null,
      this._disposables
    );
    
    // 监听面板关闭
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    entityService: EntityService,
    relationService: RelationService
  ) {
    // 如果已经存在，则更新数据并显示
    if (GraphView.currentPanel) {
      GraphView.currentPanel._panel.reveal(vscode.ViewColumn.One);
      GraphView.currentPanel._update();
      return;
    }

    // 创建新的面板
    const panel = vscode.window.createWebviewPanel(
      'knowledgeGraph',
      'Knowledge Graph Visualization',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    GraphView.currentPanel = new GraphView(
      panel,
      extensionUri,
      entityService,
      relationService
    );
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
    this._panel.title = 'Knowledge Graph Visualization';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _handleMessage(message: any) {
    switch (message.type) {
      case 'ready':
        // Webview 准备好了，发送图谱数据
        this._sendGraphData();
        break;
      case 'jumpToEntity':
        // 跳转到实体位置
        this._jumpToEntity(message.entityId);
        break;
      case 'refresh':
        // 刷新图谱数据
        this._sendGraphData();
        break;
    }
  }

  private _sendGraphData() {
    // 获取所有实体和关系
    const entities = this._entityService.listEntities();
    const allRelations: any[] = [];

    // 收集所有关系
    for (const entity of entities) {
      const relations = this._relationService.getRelations(entity.id, 'outgoing');
      allRelations.push(...relations);
    }

    // 发送数据到 webview
    this._panel.webview.postMessage({
      type: 'graphData',
      data: {
        entities: entities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          filePath: e.filePath,
          startLine: e.startLine,
          endLine: e.endLine,
          description: e.description,
        })),
        relations: allRelations.map(r => ({
          id: r.id,
          sourceId: r.sourceEntityId,
          targetId: r.targetEntityId,
          verb: r.verb,
        })),
      },
    });
  }

  private async _jumpToEntity(entityId: string) {
    const entity = this._entityService.getEntity(entityId);
    if (!entity) {
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, entity.filePath);
    
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // 跳转到实体位置
      const range = new vscode.Range(
        entity.startLine - 1,
        0,
        entity.endLine - 1,
        0
      );

      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Graph</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow: hidden;
        }
        
        #toolbar {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 1000;
            display: flex;
            gap: 8px;
        }
        
        button {
            background-color: rgba(30, 30, 30, 0.8);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
            width: 36px;
            height: 36px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        button:hover {
            background-color: rgba(50, 50, 50, 0.9);
            transform: scale(1.05);
        }
        
        button:active {
            transform: scale(0.95);
        }
        
        #mynetwork {
            width: 100%;
            height: 100vh;
        }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 999;
        }
        
        #loading.hidden {
            display: none;
        }
        
        .spinner {
            border: 4px solid var(--vscode-panel-border);
            border-top: 4px solid var(--vscode-button-background);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #empty-state {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 999;
        }
        
        #empty-state.hidden {
            display: none;
        }
        
        #empty-state h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        #empty-state p {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <button onclick="fitGraph()" title="适应窗口">⛶</button>
        <button onclick="refreshGraph()" title="刷新">↻</button>
    </div>
    
    <div id="loading">
        <div class="spinner"></div>
        <div>加载知识图谱中...</div>
    </div>
    
    <div id="empty-state" class="hidden">
        <h2>📊 知识图谱为空</h2>
        <p>请先创建实体和关系</p>
        <p style="margin-top: 10px;">使用右键菜单 "Knowledge: Create Entity" 开始</p>
    </div>
    
    <div id="mynetwork"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let network = null;
        
        // 实体类型颜色映射
        const typeColors = {
            'function': '#61AFEF',
            'class': '#E06C75',
            'interface': '#C678DD',
            'variable': '#98C379',
            'component': '#E5C07B',
            'service': '#56B6C2',
            'api': '#D19A66',
            'config': '#ABB2BF',
            'other': '#5C6370'
        };
        
        // 页面加载完成
        window.addEventListener('load', () => {
            // 通知扩展 webview 已准备好
            vscode.postMessage({ type: 'ready' });
        });
        
        // 接收来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'graphData':
                    renderGraph(message.data);
                    break;
            }
        });
        
        // 检测循环依赖
        function detectCycles(relations) {
            const cycles = new Set();
            
            // 为每对节点检查是否存在双向关系
            for (let i = 0; i < relations.length; i++) {
                const rel1 = relations[i];
                for (let j = i + 1; j < relations.length; j++) {
                    const rel2 = relations[j];
                    // 检查是否为循环：A -> B 且 B -> A
                    if (rel1.sourceId === rel2.targetId && rel1.targetId === rel2.sourceId) {
                        cycles.add(rel1.id);
                        cycles.add(rel2.id);
                    }
                }
            }
            
            return cycles;
        }
        
        function renderGraph(data) {
            const { entities, relations } = data;
            
            // 隐藏加载提示
            document.getElementById('loading').classList.add('hidden');
            
            // 检查是否为空
            if (entities.length === 0) {
                document.getElementById('empty-state').classList.remove('hidden');
                return;
            } else {
                document.getElementById('empty-state').classList.add('hidden');
            }
            
            // 检测循环依赖
            const cycleEdges = detectCycles(relations);
            const hasCycles = cycleEdges.size > 0;
            
            // 如果有循环依赖，显示警告
            if (hasCycles) {
                console.warn(\`⚠️ 检测到 \${cycleEdges.size / 2} 个循环依赖！\`);
            }
            
            // 构建节点
            const nodes = entities.map(entity => ({
                id: entity.id,
                label: entity.name,
                title: \`<strong>\${entity.name}</strong><br>
                        类型: \${entity.type}<br>
                        文件: \${entity.filePath}:\${entity.startLine}<br>
                        \${entity.description ? '描述: ' + entity.description : ''}\`,
                color: {
                    background: typeColors[entity.type] || typeColors['other'],
                    border: '#2B2B2B',
                    highlight: {
                        background: typeColors[entity.type] || typeColors['other'],
                        border: '#FFFFFF'
                    }
                },
                font: {
                    color: '#FFFFFF',
                    size: 14,
                    face: 'Arial'
                },
                shape: getNodeShape(entity.type),
                size: 25,
                entityData: entity
            }));
            
            // 构建边
            const edges = relations.map(relation => {
                const isCycle = cycleEdges.has(relation.id);
                
                return {
                    id: relation.id,
                    from: relation.sourceId,
                    to: relation.targetId,
                    label: isCycle ? \`⚠️ \${relation.verb}\` : relation.verb,
                    title: isCycle ? '循环依赖' : undefined,  // 鼠标悬停提示
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: 1.2,
                            type: 'arrow'
                        }
                    },
                    color: {
                        color: '#A0A0A0',        // 统一使用灰色
                        highlight: '#FFFFFF',
                        hover: '#FFFFFF'
                    },
                    font: {
                        color: '#FFFFFF',
                        size: 16,
                        face: 'Arial',
                        align: 'middle',
                        strokeWidth: 2,
                        strokeColor: '#000000',
                        background: 'rgba(0, 0, 0, 0.7)',  // 统一使用黑色背景
                        vadjust: -10
                    },
                    width: 2,                    // 统一线条粗细
                    dashes: false,               // 统一使用实线
                    smooth: isCycle ? {
                        type: 'curvedCW',        // 循环依赖使用弯曲边，避免重叠
                        roundness: 0.2
                    } : {
                        type: 'cubicBezier',
                        roundness: 0.4
                    }
                };
            });
            
            // 创建数据集
            const nodesDataSet = new vis.DataSet(nodes);
            const edgesDataSet = new vis.DataSet(edges);
            
            // 图谱配置
            const options = {
                nodes: {
                    borderWidth: 2,
                    borderWidthSelected: 4,
                    font: {
                        size: 16,
                        face: 'Arial',
                        color: '#FFFFFF'
                    }
                },
                edges: {
                    width: 2,
                    selectionWidth: 5,
                    hoverWidth: 3,
                    smooth: {
                        enabled: true,
                        type: 'cubicBezier',
                        roundness: 0.4
                    }
                },
                physics: {
                    enabled: true,
                    barnesHut: {
                        gravitationalConstant: -10000,
                        centralGravity: 0.3,
                        springLength: 200,
                        springConstant: 0.04,
                        damping: 0.09,
                        avoidOverlap: 0.6
                    },
                    stabilization: {
                        iterations: 250,
                        updateInterval: 25
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    hideEdgesOnDrag: false,
                    hideEdgesOnZoom: false
                },
                layout: {
                    improvedLayout: true,
                    hierarchical: false
                }
            };
            
            // 创建网络
            const container = document.getElementById('mynetwork');
            const graphData = {
                nodes: nodesDataSet,
                edges: edgesDataSet
            };
            
            network = new vis.Network(container, graphData, options);
            
            // 双击节点跳转到代码
            network.on('doubleClick', function(params) {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    vscode.postMessage({
                        type: 'jumpToEntity',
                        entityId: nodeId
                    });
                }
            });
            
            // 稳定后适应窗口
            network.once('stabilizationIterationsDone', function() {
                network.fit({
                    animation: {
                        duration: 1000,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            });
        }
        
        function getNodeShape(type) {
            const shapes = {
                'function': 'box',
                'class': 'ellipse',
                'interface': 'diamond',
                'variable': 'dot',
                'component': 'star',
                'service': 'box',
                'api': 'triangleDown',
                'config': 'square',
                'other': 'dot'
            };
            return shapes[type] || 'dot';
        }
        
        function fitGraph() {
            if (network) {
                network.fit({
                    animation: {
                        duration: 500,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            }
        }
        
        function refreshGraph() {
            document.getElementById('loading').classList.remove('hidden');
            vscode.postMessage({ type: 'refresh' });
        }
    </script>
</body>
</html>`;
  }
}
