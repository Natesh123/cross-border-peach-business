const cors_proxy = require('cors-anywhere');

const host = 'localhost';
const port = 8089;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [],
    removeHeaders: ['cookie', 'cookie2'],
    setHeaders: {
        'origin': 'https://live.kashremit.com',
        'referer': 'https://live.kashremit.com/'
    }
}).listen(port, host, function() {
    console.log('CORS Proxy Server running on ' + host + ':' + port);
});
