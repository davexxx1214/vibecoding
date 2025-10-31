import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

/**
 * 生成单元测试的主命令处理函数
 * 读取整个文件内容，使用 LLM 生成所有函数的测试用例
 */
export async function generateUnitTests(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        vscode.window.showErrorMessage('请先打开一个文件');
        return;
    }

    const document = editor.document;
    const language = document.languageId;
    const filePath = document.fileName;
    const fileContent = document.getText();

    // 显示进度指示器
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Guardian',
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: '正在读取文件内容...' });

        progress.report({ increment: 20, message: '正在调用 LLM 生成测试用例...' });

        // 调用后端生成测试代码
        let testCode: string;
        try {
            const config = vscode.workspace.getConfiguration('guardian');
            const backendUrl = config.get<string>('backendUrl', 'http://localhost:8080');

            const response = await axios.post(
                `${backendUrl}/api/generate-tests`,
                {
                    fileContent: fileContent,
                    language: language,
                    filePath: filePath
                },
                {
                    timeout: 60000 // 60秒超时
                }
            );

            testCode = response.data.testCode || '';
            
            if (!testCode) {
                vscode.window.showErrorMessage('LLM 未返回测试代码');
                return;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    vscode.window.showErrorMessage(
                        '无法连接到后端服务。请确保后端服务正在运行（cd backend && npm start）'
                    );
                } else {
                    vscode.window.showErrorMessage(
                        `生成测试失败: ${error.response?.data?.error || error.message}`
                    );
                }
            } else {
                vscode.window.showErrorMessage(`生成测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
            return;
        }

        progress.report({ increment: 80, message: '正在创建测试文件...' });

        // 确定测试文件路径
        const testFilePath = await getTestFilePath(filePath, language);
        
        // 确保测试目录存在
        const testDir = path.dirname(testFilePath);
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // 写入测试文件
        const testFileUri = vscode.Uri.file(testFilePath);
        const encoder = new TextEncoder();
        const testFileContent = encoder.encode(testCode);

        await vscode.workspace.fs.writeFile(testFileUri, testFileContent);

        progress.report({ increment: 100, message: '完成！' });

        // 打开测试文件
        await vscode.window.showTextDocument(testFileUri);
        
        vscode.window.showInformationMessage(
            `测试文件已生成: ${path.basename(testFilePath)}`
        );
    });
}

/**
 * 获取测试文件路径
 */
async function getTestFilePath(sourceFilePath: string, language: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('guardian');
    const testDirectory = config.get<string>('testDirectory', '__tests__');
    
    const sourceDir = path.dirname(sourceFilePath);
    const sourceFileName = path.basename(sourceFilePath, path.extname(sourceFilePath));
    
    // 根据语言确定测试文件扩展名
    const testExtension = getTestFileExtension(language);
    const testFileName = `${sourceFileName}.test${testExtension}`;
    
    // 尝试在源文件同级目录的测试目录中创建
    const testDir = path.join(sourceDir, testDirectory);
    return path.join(testDir, testFileName);
}

/**
 * 根据语言获取测试文件扩展名
 */
function getTestFileExtension(language: string): string {
    switch (language) {
        case 'typescript':
            return '.ts';
        case 'javascript':
            return '.js';
        case 'python':
            return '.py';
        case 'java':
            return '.java';
        default:
            return '.js';
    }
}

/**
 * 获取项目结构信息（用于上下文）
 */
async function getProjectStructure(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }

    // 简化实现：只返回工作区根目录信息
    // 实际可以递归读取项目结构
    return `工作区: ${workspaceFolders[0].name}`;
}

