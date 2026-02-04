#!/bin/bash

# BRUTAL App - Frontend Clean Rebuild Script
# This script removes all build artifacts and caches to ensure a fresh deployment

set -e

echo "🧹 Starting BRUTAL frontend clean rebuild..."

# Navigate to frontend directory
cd "$(dirname "$0")/.."

echo "📦 Removing build artifacts..."
# Remove build output
rm -rf dist/

echo "🗑️  Removing dependency caches..."
# Remove node_modules (will be reinstalled)
rm -rf node_modules/

# Remove package manager lock files (will be regenerated)
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

echo "🧼 Removing tool caches..."
# Remove Vite cache
rm -rf .vite/
rm -rf node_modules/.vite/

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Remove any temp files
rm -rf .cache/
rm -rf .temp/

echo "✅ Clean complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm install' to reinstall dependencies"
echo "2. Run 'dfx generate backend' to regenerate backend bindings"
echo "3. Run 'pnpm build:skip-bindings' to build the frontend"
echo "4. Deploy with 'dfx deploy'"
echo ""
echo "Or use the full deployment command:"
echo "  pnpm install && dfx generate backend && pnpm build:skip-bindings && dfx deploy"
