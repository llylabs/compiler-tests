export default function RootLayout({children}) {
  return (
    <html lang="en">
      <head>
        <title>NEX Blog</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A blog about NEX, WebAssembly, and modern web development" />
      </head>
      <body style={{fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, color: '#333', backgroundColor: '#fff'}}>
        <header style={{backgroundColor: '#1a1a2e', color: 'white', padding: '16px 24px'}}>
          <div style={{maxWidth: 1200, margin: '0 auto', display: 'flex'}}>
            <a href="/" style={{color: 'white', fontSize: 24, fontWeight: 700}}>NEX Blog</a>
            <nav style={{marginLeft: 40, display: 'flex', gap: 20}}>
              <a href="/blog" style={{color: '#ccc'}}>Blog</a>
              <a href="/authors" style={{color: '#ccc'}}>Authors</a>
              <a href="/about" style={{color: '#ccc'}}>About</a>
              <a href="/contact" style={{color: '#ccc'}}>Contact</a>
            </nav>
          </div>
        </header>
        <main style={{maxWidth: 1200, margin: '0 auto', padding: '24px'}}>
          {children}
        </main>
        <footer style={{backgroundColor: '#f5f5f5', padding: '24px', marginTop: 40, textAlign: 'center', color: '#666'}}>
          <p>Built with NEX Runtime &mdash; React SSR on WebAssembly</p>
          <p>&copy; 2024 NEX Blog. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
