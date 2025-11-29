/**
 * VS Code API Mock for testing
 * 提供测试所需的 VS Code API 模拟实现
 */

export const workspace = {
  getConfiguration: (section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T => defaultValue as T,
    update: async () => {},
  }),
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
  workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
};

export const window = {
  showInformationMessage: async (message: string) => undefined,
  showErrorMessage: async (message: string) => undefined,
  showWarningMessage: async (message: string) => undefined,
  showInputBox: async () => '',
  showQuickPick: async () => undefined,
  createOutputChannel: () => ({
    appendLine: () => {},
    append: () => {},
    show: () => {},
    dispose: () => {},
  }),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, path }),
  parse: (value: string) => ({ fsPath: value, path: value }),
};

export const Position = class {
  constructor(public line: number, public character: number) {}
};

export const Range = class {
  constructor(
    public start: { line: number; character: number },
    public end: { line: number; character: number }
  ) {}
};

export const Selection = class {
  constructor(
    public anchor: { line: number; character: number },
    public active: { line: number; character: number }
  ) {}
  
  get start() { return this.anchor; }
  get end() { return this.active; }
  get isEmpty() { return this.anchor === this.active; }
};

export const EventEmitter = class<T> {
  private listeners: Array<(e: T) => void> = [];
  
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    }};
  };
  
  fire(data: T) {
    this.listeners.forEach(listener => listener(data));
  }
  
  dispose() {
    this.listeners = [];
  }
};

export const TreeItem = class {
  label?: string;
  description?: string;
  collapsibleState?: number;
  
  constructor(label: string, collapsibleState?: number) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
};

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: async () => {},
};

export const languages = {
  registerHoverProvider: () => ({ dispose: () => {} }),
  registerCodeLensProvider: () => ({ dispose: () => {} }),
};

export const ExtensionContext = class {
  subscriptions: { dispose: () => void }[] = [];
  globalState = {
    get: () => undefined,
    update: async () => {},
  };
  workspaceState = {
    get: () => undefined,
    update: async () => {},
  };
};

export default {
  workspace,
  window,
  Uri,
  Position,
  Range,
  Selection,
  EventEmitter,
  TreeItem,
  TreeItemCollapsibleState,
  ConfigurationTarget,
  commands,
  languages,
  ExtensionContext,
};

