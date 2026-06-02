const fs = require('fs');
try {
  const content = fs.readFileSync('package-lock.json', 'utf8');
  const d = JSON.parse(content);
  console.log('App name in package-lock.json:', d.name);
  console.log('Dependencies:', Object.keys(d.dependencies || d.packages || {}));
} catch (e) {
  console.error(e.message);
}
