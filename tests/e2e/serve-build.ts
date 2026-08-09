/**
 * A static file server for `build/client`, matching how the site is deployed.
 *
 * Unknown paths get `404.html` with a real 404 status, which is the behaviour the
 * hosting configuration in the README asks for — so the tests verify the contract
 * the host has to honour, not a friendlier local approximation of it.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = join(process.cwd(), 'build', 'client')
const PORT = Number(process.env.PORT ?? 4173)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

const send = async (
  response: import('node:http').ServerResponse,
  path: string,
  status: number,
) => {
  response.writeHead(status, {
    'content-type': MIME[extname(path)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  })
  response.end(await readFile(path))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
  const candidates = [
    join(ROOT, normalize(url.pathname)),
    join(ROOT, normalize(url.pathname), 'index.html'),
  ]

  for (const candidate of candidates) {
    try {
      if (!(await stat(candidate)).isFile()) continue
      await send(response, candidate, 200)
      return
    } catch {
      /* next candidate */
    }
  }

  try {
    await send(response, join(ROOT, '404', 'index.html'), 404)
  } catch {
    response.writeHead(404).end('not found')
  }
})

server.listen(PORT, () => {
  console.log(`serving build/client on http://localhost:${PORT}`)
})
