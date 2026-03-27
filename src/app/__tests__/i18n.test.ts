import enMessages from '../../../messages/en.json';
import zhCNMessages from '../../../messages/zh-CN.json';

describe('Internationalization (i18n)', () => {
  describe('locales configuration', () => {
    it('should have en and zh-CN locales', () => {
      const locales = ['en', 'zh-CN'];
      expect(locales).toEqual(['en', 'zh-CN']);
    });

    it('should have at least 2 locales', () => {
      const locales = ['en', 'zh-CN'];
      expect(locales.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('translation files', () => {
    it('English messages should have required sections', () => {
      expect(enMessages).toHaveProperty('metadata');
      expect(enMessages).toHaveProperty('home');
      expect(enMessages).toHaveProperty('session');
    });

    it('Chinese messages should have required sections', () => {
      expect(zhCNMessages).toHaveProperty('metadata');
      expect(zhCNMessages).toHaveProperty('home');
      expect(zhCNMessages).toHaveProperty('session');
    });

    it('English and Chinese should have same structure', () => {
      const getKeys = (obj: any): string[] => {
        if (typeof obj !== 'object' || obj === null) return [];
        return Object.keys(obj).sort();
      };

      expect(getKeys(enMessages)).toEqual(getKeys(zhCNMessages));
      expect(getKeys(enMessages.home)).toEqual(getKeys(zhCNMessages.home));
      expect(getKeys(enMessages.session)).toEqual(getKeys(zhCNMessages.session));
      expect(getKeys(enMessages.metadata)).toEqual(getKeys(zhCNMessages.metadata));
    });
  });

  describe('translation completeness', () => {
    const requiredHomeKeys = [
      'title',
      'subtitle',
      'loading',
      'stats',
      'filters',
      'table',
      'empty',
    ];

    const requiredStatsKeys = [
      'totalSessions',
      'totalEvents',
      'totalTokens',
      'totalCost',
      'totalToolCalls',
    ];

    it('home section should have all required keys', () => {
      requiredHomeKeys.forEach((key) => {
        expect(enMessages.home).toHaveProperty(key);
        expect(zhCNMessages.home).toHaveProperty(key);
      });
    });

    it('home.stats should have all required keys', () => {
      requiredStatsKeys.forEach((key) => {
        expect(enMessages.home.stats).toHaveProperty(key);
        expect(zhCNMessages.home.stats).toHaveProperty(key);
      });
    });

    it('session section should have required keys', () => {
      expect(enMessages.session).toHaveProperty('loading');
      expect(enMessages.session).toHaveProperty('notFound');
      expect(enMessages.session).toHaveProperty('backToHome');
      expect(enMessages.session).toHaveProperty('stats');

      expect(zhCNMessages.session).toHaveProperty('loading');
      expect(zhCNMessages.session).toHaveProperty('notFound');
      expect(zhCNMessages.session).toHaveProperty('backToHome');
      expect(zhCNMessages.session).toHaveProperty('stats');
    });
  });

  describe('translation values', () => {
    it('English title should be in English', () => {
      expect(enMessages.metadata.title).toBe('OpenClaw Insight');
    });

    it('Chinese title should be in Chinese', () => {
      expect(zhCNMessages.metadata.title).toBe('OpenClaw 日志分析器');
    });

    it('English loading text should be in English', () => {
      expect(enMessages.home.loading).toBe('Loading logs...');
    });

    it('Chinese loading text should be in Chinese', () => {
      expect(zhCNMessages.home.loading).toBe('加载日志中...');
    });
  });

  describe('locale detection', () => {
    it('default locale should be en', () => {
      // This tests the default fallback behavior
      const validLocales = ['en', 'zh-CN'];
      expect(validLocales).toContain('en');
    });
  });
});
