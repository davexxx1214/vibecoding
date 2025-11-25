import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RagEngine, RagAnswer } from '../rag/ragEngine.js';
import type { Logger } from '../server.js';

export function registerTools(
  server: McpServer,
  ragEngine: RagEngine | null,
  logger: Logger
): void {
  if (!ragEngine) {
    return;
  }

  const inputSchema = z.object({
    question: z
      .string()
      .min(1, 'question 不能为空')
      .describe('需要回答的问题')
  });

  server.registerTool(
    'ask_question',
    {
      title: 'Ask Question',
      description:
        '基于 VibeKnowledge RAG 文档回答问题，并返回相关引用文件。',
      inputSchema
    },
    async ({ question }) => {
      try {
        logger.info(
          `[ask_question] executing, mode=${ragEngine.getMode()}, storeId=${ragEngine.getStoreId()}`
        );
        const result = await ragEngine.ask(question);
        logger.info(
          `[ask_question] success. sources=${result.sources.length}`
        );
        return {
          content: [
            {
              type: 'text',
              text: formatAnswer(result)
            }
          ]
        };
      } catch (error) {
        logger.error('[ask_question] failed:', error);
        const message =
          error instanceof Error ? error.message : '未知错误，无法完成问答';
        return {
          content: [
            {
              type: 'text',
              text: `ask_question 执行失败：${message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

function formatAnswer(result: RagAnswer): string {
  const sources =
    result.sources.length === 0
      ? '（无引用）'
      : result.sources
          .map(
            (source, index) =>
              `${index + 1}. ${source.relativePath} (relevance: ${
                source.relevance
              })`
          )
          .join('\n');

  return `${result.answer.trim()}\n\n来源：\n${sources}`;
}

