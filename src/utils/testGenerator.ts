import axios from 'axios';
import * as vscode from 'vscode';
import { FunctionInfo } from './astParser';

/**
 * 调用后端服务生成测试用例
 */
export async function generateTestCases(
    functionInfo: FunctionInfo,
    context: {
        filePath: string;
        projectStructure?: string;
    }
): Promise<string> {
    const config = vscode.workspace.getConfiguration('guardian');
    const backendUrl = config.get<string>('backendUrl', 'http://localhost:8080');

    try {
        const response = await axios.post(`${backendUrl}/api/generate-tests`, {
            function: {
                name: functionInfo.name,
                code: functionInfo.code,
                language: functionInfo.language,
                parameters: functionInfo.parameters,
                returnType: functionInfo.returnType
            },
            context: {
                filePath: context.filePath,
                projectStructure: context.projectStructure
            }
        }, {
            timeout: 30000 // 30秒超时
        });

        return response.data.testCode || '';
    } catch (error) {
        // 如果后端服务不可用，返回一个基础的测试模板
        if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
            console.warn('后端服务不可用，使用基础测试模板');
            return generateBasicTestTemplate(functionInfo);
        }
        throw error;
    }
}

/**
 * 生成基础测试模板（当后端不可用时使用）
 */
function generateBasicTestTemplate(functionInfo: FunctionInfo): string {
    const testFramework = getTestFramework(functionInfo.language);
    
    switch (functionInfo.language) {
        case 'typescript':
        case 'javascript':
            return generateJestTemplate(functionInfo);
        case 'python':
            return generatePytestTemplate(functionInfo);
        case 'java':
            return generateJUnitTemplate(functionInfo);
        default:
            return generateGenericTemplate(functionInfo);
    }
}

function getTestFramework(language: string): string {
    switch (language) {
        case 'typescript':
        case 'javascript':
            return 'jest';
        case 'python':
            return 'pytest';
        case 'java':
            return 'junit';
        default:
            return 'generic';
    }
}

function generateJestTemplate(functionInfo: FunctionInfo): string {
    const imports = functionInfo.language === 'typescript' 
        ? `import { ${functionInfo.name} } from '../${getFileName(functionInfo)}';`
        : `const { ${functionInfo.name} } = require('../${getFileName(functionInfo)}');`;

    return `${imports}

describe('${functionInfo.name}', () => {
    it('should work correctly', () => {
        // TODO: 添加测试用例
        // const result = ${functionInfo.name}(${functionInfo.parameters.map(p => 'arg').join(', ')});
        // expect(result).toBeDefined();
    });

    it('should handle edge cases', () => {
        // TODO: 添加边界情况测试
    });
});
`;
}

function generatePytestTemplate(functionInfo: FunctionInfo): string {
    return `import pytest
from ${getModuleName(functionInfo)} import ${functionInfo.name}

def test_${functionInfo.name}():
    """测试 ${functionInfo.name} 函数"""
    # TODO: 添加测试用例
    # result = ${functionInfo.name}(${functionInfo.parameters.map(p => 'arg').join(', ')})
    # assert result is not None

def test_${functionInfo.name}_edge_cases():
    """测试 ${functionInfo.name} 边界情况"""
    # TODO: 添加边界情况测试
    pass
`;
}

function generateJUnitTemplate(functionInfo: FunctionInfo): string {
    return `import org.junit.Test;
import static org.junit.Assert.*;

public class ${functionInfo.name}Test {
    
    @Test
    public void test${capitalize(functionInfo.name)}() {
        // TODO: 添加测试用例
        // ${functionInfo.returnType || 'void'} result = ${functionInfo.name}(${functionInfo.parameters.map(p => 'arg').join(', ')});
        // assertNotNull(result);
    }
    
    @Test
    public void test${capitalize(functionInfo.name)}EdgeCases() {
        // TODO: 添加边界情况测试
    }
}
`;
}

function generateGenericTemplate(functionInfo: FunctionInfo): string {
    return `// Test for ${functionInfo.name}
// TODO: 实现测试用例

function test${capitalize(functionInfo.name)}() {
    // 测试基本功能
    // const result = ${functionInfo.name}(${functionInfo.parameters.map(p => 'arg').join(', ')});
    // assert result !== undefined;
}

function test${capitalize(functionInfo.name)}EdgeCases() {
    // 测试边界情况
}
`;
}

function getFileName(functionInfo: FunctionInfo): string {
    // 简化处理，实际应该从文件路径提取
    return 'source';
}

function getModuleName(functionInfo: FunctionInfo): string {
    // 简化处理，实际应该从文件路径提取
    return 'module';
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

