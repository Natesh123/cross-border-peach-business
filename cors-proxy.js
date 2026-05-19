const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 8090;
const TARGET_BASE = 'https://betadev.kashremit.com/CashUIMR.svc';

const server = http.createServer((req, res) => {
    // CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Strip the /proxy prefix to get the real API path
    const apiPath = req.url.replace(/^\/proxy/, '') || '/';
    const targetUrl = `${TARGET_BASE}${apiPath}`;
    const parsedTarget = url.parse(targetUrl);

    const options = {
        hostname: parsedTarget.hostname,
        port: 443,
        path: parsedTarget.path,
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
    console.log(`✅ CORS Proxy running at http://localhost:${PROXY_PORT}/proxy/`);
    console.log(`   Forwarding to: ${TARGET_BASE}`);
});
