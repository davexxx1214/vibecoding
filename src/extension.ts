import * as vscode from 'vscode';
import { generateUnitTests } from './commands/generateTests';

export function activate(context: vscode.ExtensionContext) {
    console.log('Guardian for VS Code 已激活');

    // 注册生成单元测试命令
    const generateTestsCommand = vscode.commands.registerCommand(
        'guardian.generateUnitTests',
        async () => {
            await generateUnitTests();
        }
    );

    context.subscriptions.push(generateTestsCommand);
}

export function deactivate() {
    // 清理资源（如果需要）
    // 注意：不要在 deactivate 中使用 console.log，因为输出通道可能已关闭
}

