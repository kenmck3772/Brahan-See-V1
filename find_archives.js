const { execSync } = require('child_process');
try {
  console.log('Search for any archive files across the container:');
  const out = execSync('find / -name "*.tar.gz" -o -name "*.zip" -o -name "*.tgz" -o -name "*.tar" 2>/dev/null').toString();
  console.log(out || '(None)');
} catch (e) {
  console.error(e);
}
