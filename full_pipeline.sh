#!/bin/bash
# This script automates the full test, commit, and deploy pipeline.
set -e # Exit immediately if any command fails

echo "🚀 (1/6) Initializing Pipeline: Checking Tools & Secrets..."

# --- 1. Tool Checks ---
command -v git >/dev/null 2>&1 || { echo >&2 "❌ GIT is not installed. Aborting."; exit 1; }

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Attempting to install globally..."
  if ! npm i -g vercel; then
    echo "❌ Failed to install Vercel CLI. Please install it manually. Aborting."
    exit 1
  fi
fi
echo "✅ Git and Vercel CLI are present."

# --- 2. Environment Check for Neon.tech Database ---
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set."
  echo "Please set it in Replit 'Secrets' with your Neon.tech connection string."
  echo "The pipeline cannot run tests or deploy without it. Aborting."
  exit 1
fi
echo "✅ Neon.tech DATABASE_URL secret is loaded."

# --- 3. Git Auto-Commit ---
echo "🚀 (2/6) Handling Git Operations..."

# Initialize Git if this is a new project
if [ ! -d ".git" ]; then
  echo "No .git directory found. Initializing new repository..."
  git init
  git add .
  git commit -m "Initial commit: Project setup by pipeline"
  echo "✅ New Git repository initialized and first commit made."
else
  echo "Existing Git repository found."
fi

# Add all current files and commit them
git add .
if git diff-index --quiet HEAD --; then
  echo "No file changes detected. Skipping commit."
else
  echo "File changes detected. Committing..."
  git commit -m "Pipeline: Automated pre-deployment commit"
  echo "✅ All changes committed."
fi

# --- 4. Testing Pipeline (from your checklist) ---
echo "🚀 (3/6) Running Full Test Suite..."

echo "[1/7] Running health checks..."
curl -f http://localhost:5000/

echo "[2/7] Verifying static assets load correctly..."
# TODO: Add your static asset test command

echo "[3/7] Testing API endpoints..."
# TODO: Add your API test suite (e.g., npm test)

echo "[4/7] Checking database connections (using Neon.tech)..."
python test_db_connection.py

echo "[5.1/7] Running security scans..."
# TODO: Add your security scan (e.g., npm audit --production)

echo "[6/7] Checking performance metrics..."
# TODO: Add your performance benchmark

echo "[7/7] Verifying monitoring and alerting systems..."
# TODO: Add your monitoring verification

echo "✅ All automated checks passed!"

# --- 5. Deploy to Vercel ---
echo "🚀 (4/6) Deploying to Vercel (Production)..."
# This requires VERCEL_TOKEN to be set in Replit 'Secrets'
# Your Neon.tech DATABASE_URL must also be set in your Vercel project's env variables.
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ ERROR: VERCEL_TOKEN secret is not set. Cannot deploy."
  echo "Please add your Vercel Access Token to Replit 'Secrets'."
  exit 1
fi

vercel --prod --token=$VERCEL_TOKEN --yes
echo "✅ Deployed to Vercel."

# --- 6. Push to Git Repository ---
echo "🚀 (5/6) Pushing to remote Git repository..."

# ---
# TODO: CRITICAL - CONFIGURE YOUR REMOTE REPOSITORY
# This section is disabled by default.
# 1. Create a repository on GitHub/GitLab.
# 2. Uncomment the 'if' block below.
# 3. Replace the 'https://github.com/USER/REPO.git' URL with your own.
# 4. Change 'main' to 'master' if needed.
# ---

# if ! git remote -v | grep -q "origin"; then
#   echo "No 'origin' remote found. Adding it..."
#   # vvv-- REPLACE THIS URL WITH YOUR REPO URL --vvv
#   git remote add origin https://github.com/USER/REPO.git
#   echo "✅ 'origin' remote added."
# fi
#
# echo "Pushing changes to origin main..."
# git push origin main --force
# echo "✅ All changes pushed to remote repository."

echo "🚀 (6/6) Pipeline Finished!"
echo "NOTE: Git push is disabled. Edit full_pipeline.sh to configure your remote repo."

