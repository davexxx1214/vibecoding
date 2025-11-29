/**
 * Vitest 测试设置文件
 * 在所有测试运行前执行
 */

import { vi } from 'vitest';

// 全局 mock console.log 以减少测试输出噪音
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // 在测试中静默常规日志，但保留错误日志
  console.log = vi.fn();
});

afterAll(() => {
  // 恢复原始 console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

