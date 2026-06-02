const fs = require('fs');
try {
  console.log('=== Nginx Access Log ===');
  console.log(fs.readFileSync('/var/log/nginx/access.log', 'utf8').slice(-4000));
} catch (e) {
  console.error(e.message);
}
try {
  console.log('=== Nginx Error Log ===');
  console.log(fs.readFileSync('/var/log/nginx/error.log', 'utf8').slice(-4000));
} catch (e) {
  console.error(e.message);
}
