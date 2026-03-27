import '@testing-library/jest-dom';

// Mock next-intl translations
jest.mock('next-intl', () => ({
  useTranslations: () => {
    return new Proxy(
      {},
      {
        get: (_, key: string) => key,
      }
    );
  },
  useLocale: () => 'en',
}));

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getMessages: () => ({}),
  getLocale: () => 'en',
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error('Not found');
  },
}));
