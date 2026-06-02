const fs = require('fs');
const path = require('path');

function printContents(p) {
  try {
    console.log(`=== Listing ${p} ===`);
    const files = fs.readdirSync(p);
    for (const f of files) {
      console.log(f);
      const sub = path.join(p, f);
      try {
        const stat = fs.statSync(sub);
        if (stat.isDirectory()) {
          console.log(`  [DIR] ${f} contents:`, fs.readdirSync(sub));
        }
      } catch (e){}
    }
  } catch (e) {
    console.log(`Error reading ${p}:`, e.message);
  }
}

printContents('/usr/local/src');
printContents('/usr/src');
