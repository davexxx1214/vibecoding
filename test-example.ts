// 测试示例文件 - 用于测试函数提取功能
// 将光标放在函数内部，然后运行 "Generate Unit Tests" 命令

export function calculateSum(a: number, b: number): number {
    return a + b;
}

async function fetchUserData(userId: string): Promise<User> {
    // 将光标放在这里
    return { id: userId, name: 'Test' };
}

const multiply = (x: number, y: number): number => {
    return x * y;
};

interface User {
    id: string;
    name: string;
}

