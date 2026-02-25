#!/bin/bash

# Push Feeder to production
# Usage: ./push-to-prod.sh [commit-message]
#
# Steps:
# 1. Push Supabase migrations (if linked to a remote project)
# 2. Stage and commit all changes
# 3. Push to origin main

cd "$(dirname "$0")"

COMMIT_MSG="${1:-Update: Push to production}"

echo ""
echo "=========================================="
echo "  Feeder — Push to Production"
echo "=========================================="
echo ""

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    exit 1
fi

# --- Supabase migrations (optional) ---

SKIP_SUPABASE=false

if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
    echo "✅ Loaded .env.production"
fi

# Check if supabase CLI is available
if ! command -v npx > /dev/null 2>&1; then
    echo "⚠️  npx not found — skipping Supabase push"
    SKIP_SUPABASE=true
fi

# Check if project is linked to a remote Supabase instance
if [ "$SKIP_SUPABASE" = false ]; then
    if ! npx supabase projects list > /dev/null 2>&1 && [ ! -f supabase/.temp/project-ref ]; then
        echo "⚠️  Supabase is not linked to a remote project — skipping db push"
        echo "   To link: npx supabase link --project-ref <your-project-ref>"
        echo ""
        SKIP_SUPABASE=true
    fi
fi

if [ "$SKIP_SUPABASE" = false ]; then
    echo "📦 Pushing Supabase migrations to remote..."
    if npx supabase db push; then
        echo "✅ Supabase migrations pushed"
    else
        echo ""
        echo "❌ Supabase db push failed."
        echo "   If you haven't linked yet: npx supabase link --project-ref <ref>"
        echo "   To skip Supabase and push code only, set SKIP_SUPABASE=true"
        echo ""
        read -r -p "Continue with git push anyway? [y/N] " response
        case "$response" in
            [yY][eE][sS]|[yY]) echo "   Continuing without Supabase push..." ;;
            *) echo "   Aborted."; exit 1 ;;
        esac
    fi
else
    echo "⏭️  Skipping Supabase db push"
fi

echo ""

# --- Git commit & push ---

if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Working tree clean — nothing to commit"
else
    echo "📝 Staging all changes..."
    git add .

    echo "💾 Committing: $COMMIT_MSG"
    if ! git commit -m "$COMMIT_MSG"; then
        echo "❌ Commit failed"
        exit 1
    fi
fi

# Determine the current branch
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

echo "🚀 Pushing to origin/$BRANCH..."
if git push -u origin "$BRANCH"; then
    echo ""
    echo "✅ Push to production complete!"
    echo "   Branch: $BRANCH"
else
    echo ""
    echo "❌ Push failed. Check your remote and credentials."
    exit 1
fi
