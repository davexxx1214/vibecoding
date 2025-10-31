# Guardian 后端服务

## 安装依赖

```bash
npm install
```

## 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```env
OPENAI_API_BASE=http://23.106.155.236:3001/v1
OPENAI_API_KEY=sk-zeMDTgd3vzyznFzG370dirW1PSAQelDU8P4jsDyPrbxqVHZD
MODEL=gpt-4.1
```

## 启动服务

```bash
npm start
```

服务将在 `http://localhost:8080` 启动。

## API 端点

### POST /api/generate-tests

生成测试用例

请求体：
```json
{
  "fileContent": "完整的文件内容",
  "language": "javascript|typescript|python|java",
  "filePath": "文件路径（可选）"
}
```

响应：
```json
{
  "testCode": "生成的测试代码"
}
```

