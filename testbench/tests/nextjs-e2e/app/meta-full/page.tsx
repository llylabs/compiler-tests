export const metadata = {
  title: 'Meta Full',
  description: 'C1 metadata stage 2 test',
  keywords: ['c1', 'metadata', 'opengraph'],
  authors: [{ name: 'Leon', url: 'https://lilylabs.io' }],
  creator: 'Lily Labs',
  publisher: 'Lily Labs',
  applicationName: 'lly nextjs',
  generator: 'lly nextjs',
  referrer: 'no-referrer',
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, maxSnippet: -1 } },
  openGraph: {
    title: 'OG Title',
    description: 'OG Desc',
    url: 'https://example.com/x',
    siteName: 'Example',
    type: 'article',
    locale: 'de_DE',
    alternateLocale: ['en_US'],
    images: [
      { url: 'https://example.com/og.png', width: 1200, height: 630, alt: 'OG' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@example',
    creator: '@creator',
    title: 'TW Title',
    description: 'TW Desc',
    images: [{ url: 'https://example.com/tw.png', alt: 'TW' }],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/short.png',
    apple: [{ url: '/apple.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: 'https://example.com/x',
    languages: { de: '/de/x', 'en-US': '/en/x' },
    media: { 'only screen and (max-width: 600px)': '/mobile/x' },
  },
  verification: { google: 'g-tok', yandex: 'y-tok' },
  category: 'tech',
  manifest: '/manifest.json',
};

export default function MetaFullPage() {
  return (
    <div>
      <h1>Meta Full</h1>
      <p>see &lt;head&gt;</p>
    </div>
  );
}
