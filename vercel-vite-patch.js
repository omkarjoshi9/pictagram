// This file is used to patch the Vite configuration for Vercel deployments
const fs = require('fs');
const path = require('path');

// Path to server/vite.ts file
const viteServerPath = path.join(__dirname, 'server', 'vite.ts');

// Read the current content
let content = fs.readFileSync(viteServerPath, 'utf-8');

// Replace boolean allowedHosts with array
// The TypeScript error indicates we need to use either true, string[], or undefined
content = content.replace(
  'allowedHosts: true,',
  "allowedHosts: ['localhost', '.replit.dev', '.repl.co', '.replit.app', '.vercel.app'],"
);

// Write the updated content back
fs.writeFileSync(viteServerPath, content);

console.log('Successfully patched server/vite.ts for Vercel deployment');
