import * as vscode from 'vscode';
import { EntityService } from '../../services/entityService';
import { RelationService } from '../../services/relationService';
import { t } from '../../i18n/i18nService';

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
    this._panel.title = t().graphView.title;
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
    const translations = t().graphView;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${translations.title}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow: hidden;
            width: 100vw;
            height: 100vh;
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
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }
        
        #graph-container {
            width: 100%;
            height: 100%;
            cursor: grab;
        }

        #graph-container:active {
            cursor: grabbing;
        }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 999;
            pointer-events: none;
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
            pointer-events: none;
        }
        
        #empty-state.hidden {
            display: none;
        }
        
        /* Tooltip */
        .tooltip {
            position: absolute;
            padding: 8px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            pointer-events: none;
            font-size: 12px;
            max-width: 300px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <button onclick="fitGraph()" title="${translations.toolbar.fit}">⛶</button>
        <button onclick="refreshGraph()" title="${translations.toolbar.refresh}">↻</button>
    </div>
    
    <div id="loading">
        <div class="spinner"></div>
        <div>${translations.loading}</div>
    </div>
    
    <div id="empty-state" class="hidden">
        <h2>${translations.emptyState.title}</h2>
        <p>${translations.emptyState.description}</p>
        <p style="margin-top: 10px;">${translations.emptyState.hint}</p>
    </div>
    
    <div id="graph-container"></div>
    <div id="tooltip" class="tooltip"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let simulation, svg, g, zoom;
        let width, height;
        
        const i18n = {
            tooltip: {
                type: '${translations.tooltip.type}',
                file: '${translations.tooltip.file}',
                description: '${translations.tooltip.description}'
            },
            cyclicDependency: '${translations.cyclicDependency}'
        };
        
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

        window.addEventListener('load', () => {
            vscode.postMessage({ type: 'ready' });
            initGraph();
        });

        window.addEventListener('resize', () => {
            if (svg) {
                width = window.innerWidth;
                height = window.innerHeight;
                svg.attr('width', width).attr('height', height)
                   .attr('viewBox', [0, 0, width, height]);
                
                if (simulation) {
                    simulation.force('center', d3.forceCenter(width / 2, height / 2));
                    simulation.alpha(0.3).restart();
                }
            }
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'graphData':
                    renderGraph(message.data);
                    break;
            }
        });

        function initGraph() {
            width = window.innerWidth;
            height = window.innerHeight;
            
            const container = d3.select('#graph-container');
            container.selectAll('*').remove();
            
            svg = container.append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [0, 0, width, height])
                .style('width', '100%')
                .style('height', '100%');
                
            // Glow filter
            const defs = svg.append('defs');
            const filter = defs.append('filter')
                .attr('id', 'glow');
            filter.append('feGaussianBlur')
                .attr('stdDeviation', '2.5')
                .attr('result', 'coloredBlur');
            const feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode').attr('in', 'coloredBlur');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            // Arrow markers
            defs.append('marker')
                .attr('id', 'arrow')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 28) // Adjust based on node size (20 radius + padding)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#999');

            g = svg.append('g');
            
            zoom = d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                });
                
            svg.call(zoom).on('dblclick.zoom', null);
        }

        function renderGraph(data) {
            document.getElementById('loading').classList.add('hidden');
            
            const { entities, relations } = data;
            
            if (!entities || entities.length === 0) {
                document.getElementById('empty-state').classList.remove('hidden');
                return;
            } else {
                document.getElementById('empty-state').classList.add('hidden');
            }

            // Prepare links (D3 requires object references or IDs)
            const links = relations.map(r => ({
                source: r.sourceId,
                target: r.targetId,
                ...r
            }));
            
            // Detect multiple links between same nodes
            const linkGroups = {};
            links.forEach(link => {
                const key = [link.source, link.target].sort().join('-');
                if (!linkGroups[key]) {
                    linkGroups[key] = [];
                }
                linkGroups[key].push(link);
            });
            
            links.forEach(link => {
                const key = [link.source, link.target].sort().join('-');
                const group = linkGroups[key];
                // Calculate index in the group
                link.linkIndex = group.indexOf(link);
                link.linkCount = group.length;
                
                // Determine direction relative to sorted key to handle A->B vs B->A
                // If source < target, we use index as is
                // If source > target, we need to be careful if we want symmetric curves
                // For now, just using index/count is enough to separate them
            });
            
            const nodes = entities.map(e => ({
                ...e
            }));

            // Simulation
            simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => d.id).distance(200)) // Increased distance
                .force('charge', d3.forceManyBody().strength(-500))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collide', d3.forceCollide().radius(50));

            g.selectAll('*').remove();

            // Links (Paths instead of Lines)
            const linkGroup = g.append('g')
                .attr('class', 'links');
                
            const link = linkGroup.selectAll('path')
                .data(links)
                .join('path')
                .attr('fill', 'none')
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6)
                .attr('stroke-width', 2)
                .attr('marker-end', 'url(#arrow)');

            // Link Labels
            const linkLabelGroup = g.append('g')
                .attr('class', 'link-labels');

            const linkLabel = linkLabelGroup.selectAll('g')
                .data(links)
                .join('g');
            
            // Label background (halo) to make text readable over lines
            linkLabel.append('text')
                .text(d => d.verb)
                .attr('font-size', 10)
                .attr('text-anchor', 'middle')
                .attr('dy', -5)
                .attr('stroke', '#1e1e1e') // Dark theme background color
                .attr('stroke-width', 3)
                .attr('opacity', 0.8);

            // Actual label text
            linkLabel.append('text')
                .text(d => d.verb)
                .attr('font-size', 10)
                .attr('fill', '#aaa')
                .attr('text-anchor', 'middle')
                .attr('dy', -5);

            // Nodes
            const nodeGroup = g.append('g')
                .attr('class', 'nodes');

            const node = nodeGroup.selectAll('g')
                .data(nodes)
                .join('g')
                .call(drag(simulation));

            // Node circles
            node.append('circle')
                .attr('r', 20)
                .attr('fill', d => typeColors[d.type] || typeColors['other'])
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .style('filter', 'url(#glow)')
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    d3.select(this).transition().duration(200).attr('r', 25);
                    showTooltip(event, d);
                })
                .on('mouseout', function(event, d) {
                    d3.select(this).transition().duration(200).attr('r', 20);
                    hideTooltip();
                })
                .on('dblclick', (event, d) => {
                    vscode.postMessage({
                        type: 'jumpToEntity',
                        entityId: d.id
                    });
                });

            // Node labels
            node.append('text')
                .text(d => d.name)
                .attr('x', 28)
                .attr('y', 5)
                .attr('fill', '#fff')
                .attr('stroke', 'none')
                .attr('font-size', 14)
                .attr('font-weight', 'bold')
                .style('pointer-events', 'none')
                .style('text-shadow', '1px 1px 2px #000');

            // Icon/Text inside node
            node.append('text')
                .text(d => getIconForType(d.type))
                .attr('text-anchor', 'middle')
                .attr('dy', 6)
                .attr('fill', '#fff')
                .attr('stroke', 'none')
                .attr('font-size', 16)
                .attr('font-weight', 'bold')
                .style('pointer-events', 'none');

            simulation.on('tick', () => {
                link.attr('d', d => {
                    const x1 = d.source.x;
                    const y1 = d.source.y;
                    const x2 = d.target.x;
                    const y2 = d.target.y;
                    
                    if (d.linkCount > 1) {
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const dr = Math.sqrt(dx * dx + dy * dy);
                        
                        // Calculate curve amount based on index
                        // We want to spread them out
                        
                        // Midpoint
                        const mx = (x1 + x2) / 2;
                        const my = (y1 + y2) / 2;
                        
                        // Normal vector
                        const normX = -dy;
                        const normY = dx;
                        
                        // Normalize
                        const len = Math.sqrt(normX * normX + normY * normY);
                        const nx = normX / len;
                        const ny = normY / len;
                        
                        let curveFactor = 0;
                        if (d.linkCount === 2) {
                            curveFactor = d.linkIndex === 0 ? 30 : -30;
                        } else {
                            // General case
                            const spread = 30;
                            const center = (d.linkCount - 1) / 2;
                            curveFactor = (d.linkIndex - center) * spread;
                        }
                        
                        const cx = mx + nx * curveFactor;
                        const cy = my + ny * curveFactor;
                        
                        return \`M\${x1},\${y1} Q\${cx},\${cy} \${x2},\${y2}\`;
                    } else {
                        // Single link - straight line
                        return \`M\${x1},\${y1} L\${x2},\${y2}\`;
                    }
                });

                linkLabel.attr('transform', d => {
                    if (d.linkCount > 1) {
                        const x1 = d.source.x;
                        const y1 = d.source.y;
                        const x2 = d.target.x;
                        const y2 = d.target.y;
                        
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        
                        const mx = (x1 + x2) / 2;
                        const my = (y1 + y2) / 2;
                        
                        const normX = -dy;
                        const normY = dx;
                        const len = Math.sqrt(normX * normX + normY * normY);
                        const nx = normX / len;
                        const ny = normY / len;
                        
                        let curveFactor = 0;
                        if (d.linkCount === 2) {
                            curveFactor = d.linkIndex === 0 ? 30 : -30;
                        } else {
                            const spread = 30;
                            const center = (d.linkCount - 1) / 2;
                            curveFactor = (d.linkIndex - center) * spread;
                        }
                        
                        const cx = mx + nx * curveFactor;
                        const cy = my + ny * curveFactor;
                        
                        // Find point on quadratic bezier at t=0.5
                        const tx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
                        const ty = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
                        
                        return \`translate(\${tx},\${ty})\`;
                    } else {
                        const x = (d.source.x + d.target.x) / 2;
                        const y = (d.source.y + d.target.y) / 2;
                        return \`translate(\${x},\${y})\`;
                    }
                });

                node
                    .attr('transform', d => \`translate(\${d.x},\${d.y})\`);
            });
            
            // Initial fit
            setTimeout(fitGraph, 1000);
        }

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            
            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            
            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            
            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }

        function getIconForType(type) {
            const icons = {
                'function': 'ƒ',
                'class': 'C',
                'interface': 'I',
                'variable': 'v',
                'component': '◆',
                'service': 'S',
                'api': 'A',
                'config': '⚙',
                'other': '?'
            };
            return icons[type] || '?';
        }

        const tooltip = document.getElementById('tooltip');
        
        function showTooltip(event, d) {
            tooltip.style.opacity = 1;
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY + 10) + 'px';
            tooltip.innerHTML = \`
                <strong>\${d.name}</strong><br>
                \${i18n.tooltip.type}: \${d.type}<br>
                \${i18n.tooltip.file}: \${d.filePath}:\${d.startLine}<br>
                \${d.description ? i18n.tooltip.description + ': ' + d.description : ''}
            \`;
        }
        
        function hideTooltip() {
            tooltip.style.opacity = 0;
        }

        function fitGraph() {
            if (!g) return;
            
            // Use D3 zoom to fit
            const bounds = g.node().getBBox();
            const parent = svg.node().parentElement;
            const fullWidth = parent.clientWidth;
            const fullHeight = parent.clientHeight;
            
            const width = bounds.width;
            const height = bounds.height;
            
            if (width === 0 || height === 0) return;
            
            const midX = bounds.x + width / 2;
            const midY = bounds.y + height / 2;
            
            const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
            
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
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
