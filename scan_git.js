const fs = require('fs');
try {
  console.log('=== Scanning control-plane binary for Git / Repo sync ===');
  const binary = fs.readFileSync('/app/control-plane-api/control-plane-api');
  const str = binary.toString('utf8');
  
  const matches = str.match(/[a-zA-Z0-9_\-\s\/]*git[a-zA-Z0-9_\-\s\/]*/gi) || [];
  console.log('Git matches:', Array.from(new Set(matches)).slice(0, 30));
  
  const repoMatches = str.match(/[a-zA-Z0-9_\-\s\/]*repo[a-zA-Z0-9_\-\s\/]*/gi) || [];
  console.log('Repo matches:', Array.from(new Set(repoMatches)).slice(0, 30));

  const cloneMatches = str.match(/[a-zA-Z0-9_\-\s\/]*clone[a-zA-Z0-9_\-\s\/]*/gi) || [];
  console.log('Clone matches:', Array.from(new Set(cloneMatches)).slice(0, 30));

  const downloadMatches = str.match(/[a-zA-Z0-9_\-\s\/]*download[a-zA-Z0-9_\-\s\/]*/gi) || [];
  console.log('Download matches:', Array.from(new Set(downloadMatches)).slice(0, 30));
} catch (e) {
  console.error(e.message);
}
