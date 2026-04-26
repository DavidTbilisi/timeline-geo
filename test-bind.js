const http = require('http');
const port = process.env.PORT || 5173;
const host = process.env.HOST || '127.0.0.1';
const srv = http.createServer((req, res) => { res.end('ok') });
srv.listen(port, host, () => console.log(`listening ${host}:${port}`));
srv.on('error', e => { console.error('error', e); process.exit(1); });
