import { describe, it, expect, beforeEach, vi } from 'vitest';

// 由于 I18nService 是单例模式，我们需要测试纯逻辑部分

describe('I18n Utilities', () => {
  describe('Language validation', () => {
    const isValidLanguage = (lang: string): lang is 'en' | 'zh' => {
      return lang === 'en' || lang === 'zh';
    };

    it('应该验证有效的语言代码', () => {
      expect(isValidLanguage('en')).toBe(true);
      expect(isValidLanguage('zh')).toBe(true);
    });

    it('应该拒绝无效的语言代码', () => {
      expect(isValidLanguage('fr')).toBe(false);
      expect(isValidLanguage('de')).toBe(false);
      expect(isValidLanguage('')).toBe(false);
      expect(isValidLanguage('english')).toBe(false);
    });
  });

  describe('Locale code mapping', () => {
    const getLocaleCode = (lang: 'en' | 'zh'): string => {
      return lang === 'zh' ? 'zh-CN' : 'en-US';
    };

    it('应该返回正确的 locale 代码', () => {
      expect(getLocaleCode('zh')).toBe('zh-CN');
      expect(getLocaleCode('en')).toBe('en-US');
    });
  });

  describe('Available languages', () => {
    const availableLanguages = [
      { code: 'zh' as const, label: '中文 (Chinese)' },
      { code: 'en' as const, label: 'English' },
    ];

    it('应该包含中文和英文选项', () => {
      expect(availableLanguages).toHaveLength(2);
      expect(availableLanguages.find((l) => l.code === 'zh')).toBeDefined();
      expect(availableLanguages.find((l) => l.code === 'en')).toBeDefined();
    });

    it('应该有正确的标签', () => {
      const zh = availableLanguages.find((l) => l.code === 'zh');
      const en = availableLanguages.find((l) => l.code === 'en');

      expect(zh?.label).toBe('中文 (Chinese)');
      expect(en?.label).toBe('English');
    });
  });
});

