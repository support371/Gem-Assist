#!/bin/bash
# A script to run a full diagnostic check, fix what's possible,
# and report on the rest.
set -e # Stop the script if any command fails

echo "🚀 (1/4) Fixing Security & Code Style..."
echo "--- Running npm audit fix ---"
npm audit fix
echo "--- Running linter fix (if configured in package.json) ---"
# This assumes you have an "eslint" and "lint:fix" script
npm run lint:fix || echo "Lint fix skipped or passed."

echo "✅ Fixes applied."
echo ""

echo "🚀 (2/4) Checking Database Connection (Neon.tech)..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL secret is not set. Cannot test database."
  exit 1
fi
# This uses Node.js to try and connect. Requires 'pg' package.
node -e "const { Client } = require('pg'); const client = new Client({ connectionString: process.env.DATABASE_URL }); client.connect().then(() => { console.log('✅ Neon.tech DB connection SUCCESSFUL.'); client.end(); }).catch(err => { console.error('❌ Neon.tech DB connection FAILED:', err.message); process.exit(1); })"

echo ""

echo "🚀 (3/4) Running All Local Tests..."
echo "This will run your 'npm test' command to check all app logic."
npm test
echo "✅ All local tests passed."
echo ""

echo "🚀 (4/4) Checking Live Deployment Logs (Vercel)..."
echo "Fetching the last 50 lines of logs from your Vercel deployment."
echo "Look for any 'ERROR' or '500' status codes below."
echo "---"
# This will fetch logs for your project's latest deployment
# You must have Vercel CLI installed and linked (run 'vercel' once to link)
vercel logs --limit=50
echo "---"

echo "✅ Diagnostic complete."
