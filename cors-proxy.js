const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 8090;
const TARGET_BASE = 'https://tpinservice.kashremit.com/CashUIMR.svc';

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

    const apiPath = req.url.replace(/^\/proxy/, '') || '/';
    const targetUrl = `${TARGET_BASE}${apiPath}`;
    const parsedTarget = url.parse(targetUrl);

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    headers['host'] = parsedTarget.hostname;

    const options = {
        hostname: parsedTarget.hostname,
        port: 443,
        path: parsedTarget.path,
        method: req.method,
        headers: headers,
    };

    console.log(`\n=== PROXY REQUEST TO: ${targetUrl} ===`);
    console.log('Headers:', headers);

    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`Response Status: ${proxyRes.statusCode}`);
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

    let bodyData = [];
    req.on('data', chunk => bodyData.push(chunk));
    req.on('end', () => {
        const bodyBuffer = Buffer.concat(bodyData);
        if (bodyBuffer.length > 0) {
            console.log('Body:', bodyBuffer.toString());
        }
        proxyReq.write(bodyBuffer);
        proxyReq.end();
    });
});

server.listen(PROXY_PORT, () => {
    console.log(`✅ CORS Proxy running at http://localhost:${PROXY_PORT}/proxy/`);
    console.log(`   Forwarding to: ${TARGET_BASE}`);
});

