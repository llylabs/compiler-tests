// JSON API endpoint — request body parsing + JSON response
import http from 'http'

const port = parseInt(process.env.PORT ?? '0')

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', runtime: 'nex' }))
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, '127.0.0.1', async () => {
  const addr = server.address() as { port: number }
  try {
    const r = await fetch(`http://127.0.0.1:${addr.port}/api/status`)
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`)
    const ct = r.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) throw new Error(`Expected JSON content-type, got: ${ct}`)
    const data: any = await r.json()
    if (data.status !== 'ok') throw new Error(`Expected status ok, got: ${JSON.stringify(data)}`)
    if (data.runtime !== 'nex') throw new Error(`Expected runtime nex, got: ${JSON.stringify(data)}`)
  } finally {
    server.close()
  }
})
