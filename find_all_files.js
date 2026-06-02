const fs = require('fs');
const path = require('path');

const scanned = new Set();

function scan(dir) {
  if (scanned.has(dir)) return;
  scanned.add(dir);
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === '.npm' || file === 'proc' || file === 'sys' || file === 'dev') continue;
      const full = path.join(dir, file);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          // If we find any directory that looks like a project, print it
          if (file === 'components' || file === 'src') {
             console.log('FOUND PROJECT DIR IN:', full);
          }
          // Scan recursively up to some depth
          if (full.split(path.sep).length < 5) {
            scan(full);
          }
        } else {
          if (file === 'package.json' || file === 'App.tsx' || file === 'SovereignTerminal.tsx') {
            console.log('FOUND CRITICAL FILE:', full);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Scanning entire filesystem...');
scan('/');
console.log('Scan complete.');
