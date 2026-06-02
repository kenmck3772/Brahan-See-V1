const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 8000,
      path: path,
      timeout: 2000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
  });
}

async function test() {
  const paths = [
    '/health',
    '/status',
    '/sync',
    '/files',
    '/applet',
    '/dev/status',
    '/fs/archive-build-artifact',
    '/dev/op/status'
  ];
  for (const p of paths) {
    try {
      const res = await get(p);
      console.log(`GET ${p} -> Status: ${res.status}`);
      console.log('Body snippet:', res.body.slice(0, 200));
    } catch (e) {
      console.log(`GET ${p} failed: ${e.message}`);
    }
  }
}

test();
