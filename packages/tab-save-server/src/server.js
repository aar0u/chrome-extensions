const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const AUTH_TOKEN = process.env.TAB_SAVE_TOKEN || 'changeme';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/tabs' && req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const expected = `Bearer ${AUTH_TOKEN}`;
    if (authHeader !== expected) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const content = data.content || '';
        const output = `### 📌 ${new Date().toLocaleString()}\n\n${content}`;
        fs.writeFile(path.join(__dirname, 'output.md'), output, err => {
          if (err) {
            console.error('❌ Error writing to file:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end('Internal Server Error');
          }
            console.log('✅ Content received:', content);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Content received successfully');
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
      }
    });
  } else if (req.url === '/tabs' && req.method === 'GET') {
      const filePath = path.join(__dirname, 'output.md');
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('No data found');
          }
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Internal Server Error');
        }
        const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Tabs</title></head><body><pre style="white-space: pre-wrap; word-break: break-all; background:#f8f8f8; padding:1em; border-radius:6px;">` +
          data.replace(/\((https?:\/\/[^)]+)\)/g, function(match, url) {
            return '(<a href="' + url + '" target="_blank">' + url + '</a>)';
          }) +
          '</pre></body></html>';
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
