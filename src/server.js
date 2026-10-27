/**
 * TrueSource Cloud - Core Server Entrypoint
 * High-performance, zero-dependency Node.js HTTP server.
 * Serves both the REST API and the Interactive Visual Search & Arbitrage Playground.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { handleApiRequest } = require('./routes/api');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(PUBLIC_DIR, relativePath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Route API endpoints
  if (pathname.startsWith('/api/v1/')) {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 5 * 1024 * 1024) { // 5MB limit
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload Too Large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      let parsedBody = {};
      if (bodyData) {
        try {
          parsedBody = JSON.parse(bodyData);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
          return;
        }
      }
      handleApiRequest(req, res, parsedUrl, parsedBody);
    });
    return;
  }

  // Serve Frontend Playground Static Files
  if (req.method === 'GET') {
    serveStaticFile(req, res, pathname);
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TrueSource Cloud Server running on http://localhost:${PORT}`);
    console.log(`🌐 Interactive Playground: http://localhost:${PORT}`);
    console.log(`⚡ API Health Check:     http://localhost:${PORT}/api/v1/health`);
    console.log(`======================================================\n`);
  });
}

module.exports = server;
