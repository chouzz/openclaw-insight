import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../../i18n';
import "../globals.css";

// System font stack - no external dependencies
const fontVariables = {
  sans: '--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const resolvedLocale = await getLocale();

  return (
    <html
      lang={resolvedLocale}
      className="h-full antialiased"
      style={{
        fontFamily: 'var(--font-sans)',
      }}
    >
      <body className="min-h-full flex flex-col" style={{
        fontFamily: 'var(--font-mono)',
      }}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
