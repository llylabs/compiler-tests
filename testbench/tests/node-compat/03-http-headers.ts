// Custom response headers
import http from 'http'

const port = parseInt(process.env.PORT ?? '0')

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'X-Powered-By': 'NEX',
    'Cache-Control': 'no-store',
  })
  res.end('<h1>ok</h1>')
})

server.listen(port, '127.0.0.1', async () => {
  const addr = server.address() as { port: number }
  try {
    const r = await fetch(`http://127.0.0.1:${addr.port}/`)
    if (r.headers.get('x-powered-by') !== 'NEX')
      throw new Error(`Missing X-Powered-By header, got: ${r.headers.get('x-powered-by')}`)
    if (!r.headers.get('content-type')?.includes('text/html'))
      throw new Error(`Wrong content-type: ${r.headers.get('content-type')}`)
  } finally {
    server.close()
  }
})
