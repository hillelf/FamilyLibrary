#!/usr/bin/env bash
# Initialize git and create the first commit (run from your machine, not the agent sandbox).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -d .git ]; then
  echo "Git is already initialized here."
  exit 0
fi

git init --initial-branch=main
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
  exit 1
fi
git commit -m "Initial commit: Family Library app"

echo ""
echo "Repository ready. Next steps:"
echo "  1. Create an empty repo on GitHub (no README) named e.g. FamilyLibrary."
echo "  2. Add the remote and push:"
echo "       git remote add origin git@github.com:YOUR_USER/FamilyLibrary.git"
echo "       git push -u origin main"
echo "     (Use HTTPS if you prefer: https://github.com/YOUR_USER/FamilyLibrary.git)"
