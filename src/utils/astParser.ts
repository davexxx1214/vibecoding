import * as vscode from 'vscode';

export interface FunctionInfo {
    name: string;
    code: string;
    startLine: number;
    endLine: number;
    language: string;
    parameters: string[];
    returnType?: string;
}

/**
 * 从编辑器中提取当前光标所在的函数信息
 */
export async function extractFunctionAtCursor(
    editor: vscode.TextEditor
): Promise<FunctionInfo | null> {
    const document = editor.document;
    const position = editor.selection.active;
    const language = document.languageId;
    const text = document.getText();

    // 根据语言选择不同的解析策略
    switch (language) {
        case 'typescript':
        case 'javascript':
            return extractJavaScriptFunction(text, position.line, document);
        case 'python':
            return extractPythonFunction(text, position.line, document);
        case 'java':
            return extractJavaFunction(text, position.line, document);
        default:
            // 通用解析：查找最近的函数定义
            return extractGenericFunction(text, position.line, document);
    }
}

/**
 * 提取 JavaScript/TypeScript 函数
 */
function extractJavaScriptFunction(
    text: string,
    cursorLine: number,
    document: vscode.TextDocument
): FunctionInfo | null {
    const lines = text.split('\n');
    let functionStart = -1;
    let functionEnd = -1;
    let functionName = '';
    let parameters: string[] = [];
    let braceCount = 0;

    // 从光标位置向上查找函数定义
    // 策略：找到最近的函数定义，并确保光标在其内部
    for (let i = cursorLine; i >= 0; i--) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // 尝试匹配函数定义的多种格式
        // 格式1: function name() {} 或 async function name() {}
        let match1 = trimmedLine.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
        // 格式2: const name = () => {} 或 const name = function() {}
        let match2 = trimmedLine.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:\(([^)]*)\)\s*=>|function\s*\(([^)]*)\))/);
        // 格式3: name: function() {} 或 name: () => {} (对象方法)
        let match3 = trimmedLine.match(/(\w+)\s*:\s*(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>)/);
        // 格式4: class methods: name() {} 或 async name() {}
        let match4 = trimmedLine.match(/(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*{/);
        
        const functionMatch = match1 || match2 || match3 || match4;
        if (functionMatch) {
            // 提取函数名和参数
            if (match1) {
                functionName = match1[1];
                parameters = (match1[2] || '').split(',').map(p => p.trim()).filter(p => p && p !== '');
            } else if (match2) {
                functionName = match2[1];
                parameters = (match2[2] || match2[3] || '').split(',').map(p => p.trim()).filter(p => p && p !== '');
            } else if (match3) {
                functionName = match3[1];
                parameters = (match3[2] || match3[3] || '').split(',').map(p => p.trim()).filter(p => p && p !== '');
            } else if (match4) {
                functionName = match4[1];
                parameters = (match4[2] || '').split(',').map(p => p.trim()).filter(p => p && p !== '');
            }
            
            functionStart = i;
            braceCount = 0;
            
            // 计算大括号数量（从函数定义行开始）
            for (let j = 0; j < line.length; j++) {
                if (line[j] === '{') braceCount++;
                if (line[j] === '}') braceCount--;
            }
            
            // 如果函数在同一行结束
            if (braceCount === 0 && line.includes('}')) {
                functionEnd = i;
            } else {
                // 向下查找函数结束位置
                for (let j = i + 1; j < lines.length; j++) {
                    const currentLine = lines[j];
                    for (let k = 0; k < currentLine.length; k++) {
                        if (currentLine[k] === '{') braceCount++;
                        if (currentLine[k] === '}') braceCount--;
                    }
                    if (braceCount === 0) {
                        functionEnd = j;
                        break;
                    }
                }
                
                // 如果到文件末尾还没找到闭合大括号，使用文件末尾
                if (functionEnd === -1) {
                    functionEnd = lines.length - 1;
                }
            }
            
            // 检查光标是否在函数内部（包括函数定义行）
            if (cursorLine >= functionStart && cursorLine <= functionEnd) {
                break;
            } else {
                // 光标不在这个函数内部，重置并继续查找
                functionStart = -1;
                functionEnd = -1;
                functionName = '';
                parameters = [];
            }
        }
    }

    if (functionStart === -1 || functionEnd === -1) {
        return null;
    }

    // 再次确保光标在函数内部
    if (cursorLine < functionStart || cursorLine > functionEnd) {
        return null;
    }

    const functionCode = lines.slice(functionStart, functionEnd + 1).join('\n');
    
    return {
        name: functionName,
        code: functionCode,
        startLine: functionStart,
        endLine: functionEnd,
        language: document.languageId,
        parameters
    };
}

/**
 * 提取 Python 函数
 */
function extractPythonFunction(
    text: string,
    cursorLine: number,
    document: vscode.TextDocument
): FunctionInfo | null {
    const lines = text.split('\n');
    let functionStart = -1;
    let functionEnd = -1;
    let functionName = '';
    let parameters: string[] = [];

    // 从光标位置向上查找函数定义
    for (let i = cursorLine; i >= 0; i--) {
        const line = lines[i];
        const functionMatch = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
            functionName = functionMatch[1];
            const params = functionMatch[2] || '';
            parameters = params.split(',').map(p => p.trim()).filter(p => p);
            functionStart = i;
            
            // Python 函数通过缩进确定结束位置
            const indentLevel = line.match(/^(\s*)/)?.[1]?.length || 0;
            
            for (let j = i + 1; j < lines.length; j++) {
                const currentLine = lines[j];
                // 空行不算结束
                if (currentLine.trim() === '') continue;
                // 当前行的缩进级别
                const currentIndent = currentLine.match(/^(\s*)/)?.[1]?.length || 0;
                // 如果缩进小于等于函数定义，说明函数结束
                if (currentIndent <= indentLevel) {
                    functionEnd = j - 1;
                    break;
                }
                // 如果到文件末尾
                if (j === lines.length - 1) {
                    functionEnd = j;
                }
            }
            
            if (functionEnd === -1) {
                functionEnd = lines.length - 1;
            }
            break;
        }
    }

    if (functionStart === -1 || functionEnd === -1) {
        return null;
    }

    const functionCode = lines.slice(functionStart, functionEnd + 1).join('\n');
    
    return {
        name: functionName,
        code: functionCode,
        startLine: functionStart,
        endLine: functionEnd,
        language: document.languageId,
        parameters
    };
}

/**
 * 提取 Java 函数
 */
function extractJavaFunction(
    text: string,
    cursorLine: number,
    document: vscode.TextDocument
): FunctionInfo | null {
    const lines = text.split('\n');
    let functionStart = -1;
    let functionEnd = -1;
    let functionName = '';
    let parameters: string[] = [];
    let returnType = 'void';

    // 从光标位置向上查找方法定义
    for (let i = cursorLine; i >= 0; i--) {
        const line = lines[i];
        // 匹配 Java 方法：public/private/protected returnType methodName(params) {}
        const methodMatch = line.match(/(?:public|private|protected)\s+\S+\s+(\w+)\s*\(([^)]*)\)/);
        if (methodMatch) {
            functionName = methodMatch[1];
            const params = methodMatch[2] || '';
            parameters = params.split(',').map(p => p.trim()).filter(p => p);
            
            // 提取返回类型
            const returnTypeMatch = line.match(/(?:public|private|protected)\s+(\S+)\s+\w+\s*\(/);
            if (returnTypeMatch) {
                returnType = returnTypeMatch[1];
            }
            
            functionStart = i;
            let braceCount = 0;
            
            // 计算大括号
            for (let j = 0; j < line.length; j++) {
                if (line[j] === '{') braceCount++;
                if (line[j] === '}') braceCount--;
            }
            
            if (braceCount === 0 && line.includes('}')) {
                functionEnd = i;
                break;
            }
            
            for (let j = i + 1; j < lines.length; j++) {
                const currentLine = lines[j];
                for (let k = 0; k < currentLine.length; k++) {
                    if (currentLine[k] === '{') braceCount++;
                    if (currentLine[k] === '}') braceCount--;
                }
                if (braceCount === 0) {
                    functionEnd = j;
                    break;
                }
            }
            break;
        }
    }

    if (functionStart === -1 || functionEnd === -1) {
        return null;
    }

    const functionCode = lines.slice(functionStart, functionEnd + 1).join('\n');
    
    return {
        name: functionName,
        code: functionCode,
        startLine: functionStart,
        endLine: functionEnd,
        language: document.languageId,
        parameters,
        returnType
    };
}

/**
 * 通用函数提取（适用于其他语言）
 */
function extractGenericFunction(
    text: string,
    cursorLine: number,
    document: vscode.TextDocument
): FunctionInfo | null {
    // 尝试使用 JavaScript 解析器作为后备
    return extractJavaScriptFunction(text, cursorLine, document);
}

