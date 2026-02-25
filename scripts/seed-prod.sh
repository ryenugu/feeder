#!/bin/bash
# Seed the production Supabase database.
# Usage: npm run seed:prod [-- email@example.com]

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF=$(cat supabase/.temp/project-ref 2>/dev/null || true)

if [ -z "$PROJECT_REF" ]; then
  echo "❌ No linked Supabase project. Run: npx supabase link --project-ref <ref>"
  exit 1
fi

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

SERVICE_ROLE_KEY=$(npx supabase projects api-keys --project-ref "$PROJECT_REF" 2>/dev/null \
  | grep service_role \
  | awk '{print $NF}')

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Could not retrieve service_role key. Make sure you're logged in: npx supabase login"
  exit 1
fi

echo "🌐 Seeding PRODUCTION: $SUPABASE_URL"
echo ""

SEED_SUPABASE_URL="$SUPABASE_URL" \
SEED_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
npx tsx scripts/seed.ts "$@"
