import { describe, it, expect } from 'vitest';
import { CodeParser } from '../../src/utils/codeParser';

describe('CodeParser', () => {
  describe('extractSymbolName', () => {
    it('应该从函数声明中提取名称', () => {
      expect(CodeParser.extractSymbolName('function myFunction() {}')).toBe('myFunction');
      expect(CodeParser.extractSymbolName('async function fetchData() {}')).toBe('fetchData');
      expect(CodeParser.extractSymbolName('export function exportedFunc() {}')).toBe('exportedFunc');
    });

    it('应该从类声明中提取名称', () => {
      expect(CodeParser.extractSymbolName('class MyClass {}')).toBe('MyClass');
      expect(CodeParser.extractSymbolName('export class ExportedClass {}')).toBe('ExportedClass');
      expect(CodeParser.extractSymbolName('abstract class AbstractClass {}')).toBe('AbstractClass');
    });

    it('应该从接口声明中提取名称', () => {
      expect(CodeParser.extractSymbolName('interface MyInterface {}')).toBe('MyInterface');
      expect(CodeParser.extractSymbolName('export interface ExportedInterface {}')).toBe('ExportedInterface');
    });

    it('应该从变量声明中提取名称', () => {
      expect(CodeParser.extractSymbolName('const myConst = 123')).toBe('myConst');
      expect(CodeParser.extractSymbolName('let myLet = "hello"')).toBe('myLet');
      expect(CodeParser.extractSymbolName('var myVar = true')).toBe('myVar');
      expect(CodeParser.extractSymbolName('export const exportedConst = {}')).toBe('exportedConst');
    });

    it('应该从赋值函数表达式中提取名称', () => {
      expect(CodeParser.extractSymbolName('const handler = function() {}')).toBe('handler');
      expect(CodeParser.extractSymbolName('myFunc = function() {}')).toBe('myFunc');
    });

    it('应该从箭头函数中提取名称', () => {
      expect(CodeParser.extractSymbolName('const arrowFn = () => {}')).toBe('arrowFn');
    });

    it('应该返回 null 当无法识别符号时', () => {
      expect(CodeParser.extractSymbolName('')).toBeNull();
      expect(CodeParser.extractSymbolName('// comment')).toBeNull();
      expect(CodeParser.extractSymbolName('return value;')).toBeNull();
    });

    it('应该处理多行代码，提取第一个符号', () => {
      const code = `function firstFunc() {
        // some code
      }`;
      expect(CodeParser.extractSymbolName(code)).toBe('firstFunc');
    });

    it('应该处理带有 export default 的声明', () => {
      expect(CodeParser.extractSymbolName('export default class MyComponent {}')).toBe('MyComponent');
      expect(CodeParser.extractSymbolName('export default function defaultFunc() {}')).toBe('defaultFunc');
    });
  });
});

