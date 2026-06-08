// Multiple routes + 404 handling
import http from 'http'

const port = parseInt(process.env.PORT ?? '0')

const routes: Record<string, string> = {
  '/':        'home',
  '/about':   'about',
  '/contact': 'contact',
}

const server = http.createServer((req, res) => {
  const body = routes[req.url ?? '/']
  if (body) {
    res.writeHead(200)
    res.end(body)
  } else {
    res.writeHead(404)
    res.end('not found')
  }
})

server.listen(port, '127.0.0.1', async () => {
  const addr = server.address() as { port: number }
  const base = `http://127.0.0.1:${addr.port}`

  try {
    const checks = [
      { path: '/',        expected: 'home',      status: 200 },
      { path: '/about',   expected: 'about',     status: 200 },
      { path: '/contact', expected: 'contact',   status: 200 },
      { path: '/missing', expected: 'not found', status: 404 },
    ]

    for (const check of checks) {
      const r = await fetch(`${base}${check.path}`)
      if (r.status !== check.status)
        throw new Error(`${check.path}: expected status ${check.status}, got ${r.status}`)
      const body = await r.text()
      if (body !== check.expected)
        throw new Error(`${check.path}: expected '${check.expected}', got '${body}'`)
    }
  } finally {
    server.close()
  }
})
