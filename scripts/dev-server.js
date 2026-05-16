const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

function setCrossOriginHeaders(res) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
}

function sendJson(res, status, body) {
  setCrossOriginHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  setCrossOriginHeaders(res);
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/health') {
    const modelPath = path.join(publicDir, 'models', 'yolov8n.onnx');
    const modelExists = fs.existsSync(modelPath);
    const modelSize = modelExists ? fs.statSync(modelPath).size : 0;
    return sendJson(res, 200, {
      status: 'ok',
      model: modelExists ? 'ready' : 'missing',
      model_size_mb: (modelSize / 1e6).toFixed(1),
    });
  }

  if (pathname === '/models' && req.method === 'GET') {
    const modelsDir = path.join(publicDir, 'models');
    if (!fs.existsSync(modelsDir)) return sendJson(res, 200, { models: [] });
    const models = fs
      .readdirSync(modelsDir)
      .filter((f) => f.endsWith('.onnx'))
      .map((f) => ({
        name: f,
        size_mb: (fs.statSync(path.join(modelsDir, f)).size / 1e6).toFixed(1),
        url: `/models/${f}`,
      }));
    return sendJson(res, 200, { models });
  }

  let rel = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(publicDir, rel));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n' + '='.repeat(50));
  console.log('  EdgeVision Runtime — Running');
  console.log('='.repeat(50));
  console.log(`\n  ✓ Server: ${url}`);
  console.log(`  ✓ Model:  ${url}/models/yolov8n.onnx`);
  console.log(`  ✓ Health: ${url}/health`);
  console.log('\n  Open your browser at:');
  console.log(`  → ${url}`);
  console.log('\n  Press Ctrl+C to stop\n');

  const cmd =
    process.platform === 'win32'
      ? `start ${url}`
      : process.platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`;
  exec(cmd, (err) => {
    if (err) console.log('  (open browser manually)');
  });
});
