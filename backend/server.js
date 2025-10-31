/**
 * Guardian 后端服务
 * 负责处理 LLM API 调用和测试用例生成
 */

require('dotenv').config();
const http = require('http');
const url = require('url');
const axios = require('axios');

const PORT = 8080;

// 从环境变量读取配置
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'http://23.106.155.236:3001/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.MODEL || 'gpt-4.1';

/**
 * 调用 LLM API 生成测试用例
 */
async function callLLM(fileContent, language, filePath) {
    try {
        const prompt = `你是一个专业的测试代码生成器。请为以下 ${language} 代码文件生成完整的单元测试。

文件路径: ${filePath}
语言: ${language}

请分析代码中的所有函数和方法，为每个函数生成测试用例。测试应该包括：
1. 正常输入测试
2. 边界情况测试
3. 错误处理测试

要求：
- 使用标准的测试框架（JavaScript/TypeScript用Jest，Python用pytest，Java用JUnit）
- 测试应该完整且可运行
- 包含清晰的测试描述
- 如果文件已存在测试文件，更新并合并测试

代码文件内容：
\`\`\`${language}
${fileContent}
\`\`\`

请只返回测试代码，不要包含任何解释或markdown代码块标记。`;

        // 构建 API URL：如果 base 已经以 /v1 结尾，就直接使用；否则添加 /chat/completions
        let apiUrl;
        if (OPENAI_API_BASE.endsWith('/v1')) {
            apiUrl = `${OPENAI_API_BASE}/chat/completions`;
        } else if (OPENAI_API_BASE.endsWith('/v1/')) {
            apiUrl = `${OPENAI_API_BASE}chat/completions`;
        } else {
            // 如果 base 不包含 /v1，检查是否需要添加
            apiUrl = `${OPENAI_API_BASE}/v1/chat/completions`;
        }

        console.log(`调用 LLM API: ${apiUrl}`);
        console.log(`使用模型: ${MODEL}`);

        const response = await axios.post(
            apiUrl,
            {
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的测试代码生成器，专门生成高质量、可运行的单元测试。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 120秒超时（增加超时时间）
            }
        );

        const testCode = response.data.choices[0]?.message?.content || '';
        return { testCode: testCode.trim() };
    } catch (error) {
        if (error.response) {
            // 服务器返回了错误响应
            console.error('API 错误响应:', error.response.status, error.response.data);
            throw new Error(`LLM API 调用失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // 请求已发出但没有收到响应
            console.error('API 请求超时或网络错误:', error.message);
            throw new Error(`LLM API 调用失败: 请求超时或网络错误。请检查 API 地址是否正确: ${OPENAI_API_BASE}`);
        } else {
            // 其他错误
            console.error('LLM API 调用失败:', error.message);
            throw new Error(`LLM API 调用失败: ${error.message}`);
        }
    }
}

// 旧的模板函数已移除，现在使用 LLM 生成测试代码

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    
    // 根路径：返回 API 介绍
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'Guardian Backend API',
            version: '0.0.1',
            description: 'AI 代码可信度增强插件后端服务',
            endpoints: {
                'POST /api/generate-tests': '生成单元测试用例'
            },
            status: 'running'
        }, null, 2));
        return;
    }
    
    if (parsedUrl.pathname === '/api/generate-tests' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                
                // 新的请求格式：包含整个文件内容
                const { fileContent, language, filePath } = requestData;
                
                if (!fileContent || !language) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing fileContent or language' }));
                    return;
                }
                
                const result = await callLLM(fileContent, language, filePath || '');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Guardian 后端服务运行在 http://localhost:${PORT}`);
});

