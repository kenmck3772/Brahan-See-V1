const fs = require('fs');
const path = require('path');

function search(dir, depth = 0) {
  if (depth > 5) return;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === '.npm') continue;
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        console.log('  '.repeat(depth) + '[D] ' + full);
        search(full, depth + 1);
      } else {
        console.log('  '.repeat(depth) + '[F] ' + full);
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log('Searching /app and subfolders:');
search('/app');
console.log('Searching process.cwd():');
search('.');
