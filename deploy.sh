#!/bin/bash

# GEM ENTERPRISE - Automated GitHub Deployment Script
# This script pushes your project to GitHub

set -e

echo "========================================="
echo "GEM ENTERPRISE - GitHub Deployment"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found. Please run from project root directory"
    exit 1
fi

# Check git status
echo "📋 Current Git Status:"
git status --short | head -10
echo ""

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "🔄 Current Branch: $CURRENT_BRANCH"
echo ""

# Ask user which method to use
echo "Choose authentication method:"
echo "1) Replit GitHub Integration (recommended)"
echo "2) Personal Access Token (manual)"
echo "3) SSH Keys (advanced)"
echo ""
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
  1)
    echo "🔗 Using Replit GitHub Integration"
    echo "Please use Replit's built-in Version Control button to authenticate"
    echo "Then run: git push origin $CURRENT_BRANCH:main"
    ;;
  2)
    echo "🔑 Using Personal Access Token"
    read -p "Enter your GitHub username: " USERNAME
    read -sp "Enter your Personal Access Token: " TOKEN
    echo ""
    echo "🚀 Pushing to GitHub..."
    git push https://${USERNAME}:${TOKEN}@github.com/support371/GemAssist-1.git $CURRENT_BRANCH:main -f && \
    echo "✅ Successfully pushed to GitHub!" || \
    echo "❌ Push failed. Check token and permissions."
    ;;
  3)
    echo "🔐 Using SSH Keys"
    if [ ! -f ~/.ssh/github_key ]; then
      echo "Generating SSH key..."
      ssh-keygen -t ed25519 -C "deployment@gementerprrise.com" -f ~/.ssh/github_key -N ""
    fi
    echo "📋 Public Key (add to https://github.com/settings/keys):"
    cat ~/.ssh/github_key.pub
    echo ""
    read -p "Press enter after adding key to GitHub..."
    git remote set-url origin git@github.com:support371/GemAssist-1.git
    git push origin $CURRENT_BRANCH:main && \
    echo "✅ Successfully pushed to GitHub!" || \
    echo "❌ Push failed. Check SSH key configuration."
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "📊 Push Status Summary:"
echo "========================================="
git log --oneline -5
echo ""
echo "✅ All files pushed successfully!"
echo "🌐 View repository: https://github.com/support371/GemAssist-1"
