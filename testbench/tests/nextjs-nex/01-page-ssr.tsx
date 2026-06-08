// @expect-contains: <html lang="en">
// @expect-contains: <h1>Hello from NEX</h1>
// @expect-contains: Next.js running on NEX runtime
// @expect-contains: </html>
import React from 'react'

// --- Page component (like app/page.tsx) ---
function Home() {
  return (
    <main>
      <h1>Hello from NEX</h1>
      <p>Next.js running on NEX runtime</p>
    </main>
  )
}

// --- Layout component (like app/layout.tsx) ---
function RootLayout({children}: {children: any}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// --- SSR render ---
var page = <Home />;
var html = renderToString(<RootLayout>{page}</RootLayout>);

if (!html.includes('Hello from NEX')) throw new Error('Missing heading');
if (!html.includes('<html')) throw new Error('Missing html tag');
console.log(html);
