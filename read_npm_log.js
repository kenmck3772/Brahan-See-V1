const fs = require('fs');
try {
  const files = fs.readdirSync('/root/.npm/_logs');
  console.log('Log files:', files);
  if (files.length > 0) {
     const lastLog = '/root/.npm/_logs/' + files[files.length - 1];
     console.log(`=== Content of ${lastLog} ===`);
     console.log(fs.readFileSync(lastLog, 'utf8'));
  }
} catch (e) {
  console.error(e.message);
}
