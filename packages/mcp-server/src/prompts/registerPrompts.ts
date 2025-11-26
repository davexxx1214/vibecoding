import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer): void {
    server.registerPrompt(
        'get_observations',
        {
            description: '获取当前项目的所有观察记录（Observations）'
        },
        async () => {
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: '请调用 MCP 工具 search_observations，返回最近的观察记录并附上实体名称、文件路径与更新时间。'
                        }
                    }
                ]
            };
        }
    );
}
