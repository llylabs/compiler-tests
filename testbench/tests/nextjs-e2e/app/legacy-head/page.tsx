import Head from 'next/head';

export default function LegacyHeadPage() {
  return (
    <div>
      <Head>
        <title>Legacy Head Title</title>
        <meta name="description" content="from next/head"/>
        <meta name="og:custom" content="hi"/>
        <link rel="preload" href="/foo.css" as="style"/>
      </Head>
      <h1>Legacy Head</h1>
    </div>
  );
}
