#!/bin/bash
# near-phi deploy script
# Usage: bash scripts/deploy.sh ["commit message"]

set -e
cd "$(dirname "$0")/.."

MSG="${1:-update site}"
GH="/c/Program Files/GitHub CLI/gh.exe"

git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push origin main

echo ""
echo "Deployed. Site will be live in ~60s at:"
echo "  https://near-phi.github.io/"
