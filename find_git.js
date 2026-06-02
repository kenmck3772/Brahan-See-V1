const { execSync } = require('child_process');
try {
  console.log('Search for any .git folders across the container:');
  const out = execSync('find / -name ".git" -type d 2>/dev/null').toString();
  console.log(out || '(None)');
} catch (e) {
  console.error(e);
}
