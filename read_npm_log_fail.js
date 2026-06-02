const fs = require('fs');
try {
  console.log('=== Content of 2026-06-01T22_41_46_596Z-debug-0.log ===');
  console.log(fs.readFileSync('/root/.npm/_logs/2026-06-01T22_41_46_596Z-debug-0.log', 'utf8'));
} catch (e) {
  console.error(e.message);
}
