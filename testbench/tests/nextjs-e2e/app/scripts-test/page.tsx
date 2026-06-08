import Script from 'next/script';

export default function ScriptsTestPage() {
  return (
    <div>
      <h1>Scripts</h1>
      <Script src="/analytics.js" strategy="afterInteractive" id="analytics" />
      <Script id="inline-1" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>
    </div>
  );
}
