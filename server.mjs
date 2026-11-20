import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, 'simple-notes');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // 1. Redirect requests with .html extension to clean URL
  if (pathname.endsWith('.html')) {
    let cleanPath = pathname.slice(0, -5);
    if (cleanPath.endsWith('/index') || cleanPath === '/index') {
      cleanPath = cleanPath.slice(0, -5) || '/';
    }
    const redirectTarget = cleanPath + (parsedUrl.search || '') + (parsedUrl.hash || '');
    res.writeHead(301, {
      'Location': redirectTarget || '/',
      'Cache-Control': 'no-cache',
    });
    res.end();
    return;
  }

  // 2. Resolve clean paths
  let filePath;
  if (pathname === '/' || pathname === '') {
    filePath = path.join(STATIC_DIR, 'index.html');
  } else if (pathname === '/auth' || pathname === '/auth/') {
    filePath = path.join(STATIC_DIR, 'auth.html');
  } else if (pathname === '/notes' || pathname === '/dashboard') {
    filePath = path.join(STATIC_DIR, 'index.html');
  } else {
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(STATIC_DIR, safePath);

    // If directory, look for index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    // If exact file doesn't exist, try appending .html
    else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  // 3. Fallback / 404
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  });

  fs.createReadStream(filePath).pipe(res);
});

const DEFAULT_PORT = 3000;

function start(port) {
  server.listen(port, '127.0.0.1', () => {
    console.log(`\n======================================================`);
    console.log(` AsmetNotes clean-routing server is running!`);
    console.log(` Main Dashboard: http://localhost:${port}/`);
    console.log(` Authentication: http://localhost:${port}/auth`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      start(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

start(DEFAULT_PORT);
