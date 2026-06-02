const fs = require('fs');
try {
  console.log('=== Scanning control-plane binary for Auth patterns ===');
  const binary = fs.readFileSync('/app/control-plane-api/control-plane-api');
  const str = binary.toString('utf8');
  
  // Search for Authorization or other auth patterns
  const matches = str.match(/[a-zA-Z0-9_\-\s]*Auth[a-zA-Z0-9_\-\s]*/gi) || [];
  console.log('Auth matches:', Array.from(new Set(matches)).slice(0, 30));
  
  const tokenMatches = str.match(/[a-zA-Z0-9_\-\s]*Token[a-zA-Z0-9_\-\s]*/gi) || [];
  console.log('Token matches:', Array.from(new Set(tokenMatches)).slice(0, 30));
  
  const headerMatches = str.match(/[a-zA-Z0-9_\-\s]*Header[a-zA-Z0-9_\-\s]*/gi) || [];
  console.log('Header matches:', Array.from(new Set(headerMatches)).slice(0, 30));
} catch (e) {
  console.error(e.message);
}
