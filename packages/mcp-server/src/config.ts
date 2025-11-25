import { join, resolve } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };

export type LogLevel = 'debug' | 'info' | 'error';

export interface ServerConfig {
  /**
   * 用户的工作区根目录（即包含 .vscode/.knowledge 的项目路径）
   */
  workspaceRoot: string;
  /**
   * graph.sqlite 的绝对路径
   */
  dbPath: string;
  /**
   * 控制日志输出的级别
   */
  logLevel: LogLevel;
  /**
   * MCP Server 对外暴露的版本号
   */
  serverVersion: string;
}

type RawArgs = {
  workspace?: string;
  dbPath?: string;
  logLevel?: LogLevel;
  helpRequested?: boolean;
};

const USAGE = `
VibeKnowledge MCP Server

用法：
  vibeknowledge-mcp [选项]

选项：
  -w, --workspace <path>   指定工作区根目录（默认为当前工作目录）
  --db <path>              指定 graph.sqlite 文件路径（默认 <workspace>/.vscode/.knowledge/graph.sqlite）
  --log-level <level>      设置日志级别：debug | info | error（默认 info）
  -h, --help               查看帮助说明
`.trim();

export function loadConfig(argv: string[] = process.argv.slice(2)): ServerConfig {
  const raw = parseArgs(argv);

  if (raw.helpRequested) {
    console.error(USAGE);
    process.exit(0);
  }

  const workspaceRoot = resolve(
    raw.workspace ??
      process.env.VIBEKNOWLEDGE_WORKSPACE ??
      process.cwd()
  );

  const dbPath = resolve(
    raw.dbPath ?? join(workspaceRoot, '.vscode', '.knowledge', 'graph.sqlite')
  );

  return {
    workspaceRoot,
    dbPath,
    logLevel: raw.logLevel ?? 'info',
    serverVersion:
      typeof packageJson.version === 'string' ? packageJson.version : '0.0.0'
  };
}

function parseArgs(argv: string[]): RawArgs {
  const result: RawArgs = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '-w':
      case '--workspace':
        result.workspace = expectNextValue(arg, argv[++i]);
        break;
      case '--db':
      case '--db-path':
        result.dbPath = expectNextValue(arg, argv[++i]);
        break;
      case '--log-level': {
        const value = expectNextValue(arg, argv[++i]);
        if (!isLogLevel(value)) {
          throw new Error(
            `无效的日志级别：${value}，可选项为 debug | info | error`
          );
        }
        result.logLevel = value;
        break;
      }
      case '-h':
      case '--help':
        result.helpRequested = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`未知参数：${arg}`);
        }
        // 允许用户只传一个路径作为 workspace
        result.workspace = arg;
        break;
    }
  }

  return result;
}

function expectNextValue(flag: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${flag} 需要一个值`);
  }
  return value;
}

function isLogLevel(value: string): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'error';
}

