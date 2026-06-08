// POST with request body reading
import http from 'http'

const port = parseInt(process.env.PORT ?? '0')

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('method not allowed'); return
  }

  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  req.on('end', () => {
    try {
      const data = JSON.parse(body)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ echo: data.message, received: true }))
    } catch {
      res.writeHead(400)
      res.end('invalid json')
    }
  })
})

server.listen(port, '127.0.0.1', async () => {
  const addr = server.address() as { port: number }
  try {
    const r = await fetch(`http://127.0.0.1:${addr.port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello nex' }),
    })
    const data: any = await r.json()
    if (data.echo !== 'hello nex') throw new Error(`Expected echo 'hello nex', got: ${JSON.stringify(data)}`)
    if (data.received !== true)    throw new Error(`Expected received true, got: ${JSON.stringify(data)}`)
  } finally {
    server.close()
  }
})
