// Basic http.createServer — start, request, assert, exit
import http from 'http'

const port = parseInt(process.env.PORT ?? '0')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('hello nex')
})

server.listen(port, '127.0.0.1', async () => {
  const addr = server.address() as { port: number }
  try {
    const r = await fetch(`http://127.0.0.1:${addr.port}/`)
    const body = await r.text()
    if (body !== 'hello nex') throw new Error(`Expected 'hello nex', got: ${JSON.stringify(body)}`)
  } finally {
    server.close()
  }
})
