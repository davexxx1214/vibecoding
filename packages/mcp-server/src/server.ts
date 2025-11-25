import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerConfig } from './config.js';
import type { GraphDatabase } from './database.js';
import { registerBaseResources } from './resources/registerResources.js';

export async function startMcpServer(
  config: ServerConfig,
  db: GraphDatabase
): Promise<McpServer> {
  const server = new McpServer({
    name: 'VibeKnowledge MCP',
    version: config.serverVersion
  });

  registerBaseResources(server, db);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  return server;
}

