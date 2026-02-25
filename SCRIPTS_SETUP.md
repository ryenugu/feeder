# Setup Scripts Summary

## Files Added/Modified

### New Files
1. **`start-app.sh`** - Automated development startup script
2. **`push-to-prod.sh`** - Production deployment script
3. **`.env.example`** - Template for local development environment
4. **`.env.production.example`** - Template for production environment

### Modified Files
1. **`.gitignore`** - Updated to allow example env files while ignoring actual env files
2. **`README.md`** - Added documentation for new scripts and environment setup

## Key Changes Made

### 1. start-app.sh
**Adapted from ankimal to feeder:**
- Changed port from 5173 → 3000 (Next.js default)
- Changed env file from `.env.development` → `.env.local` (Next.js convention)
- Updated Supabase start command from `npm run db:start` → `npx supabase start`
- Removed manual env export (Next.js auto-loads .env.local)
- Updated branding to "Feeder App"

**Features:**
- Cross-platform (Windows/Mac/Linux)
- Kills processes on port 3000
- Auto-starts Docker Desktop if needed
- Auto-starts Supabase if needed
- Waits for everything to be ready
- Robust error handling

### 2. push-to-prod.sh
**Adapted from ankimal to feeder:**
- Removed dependency on `sync-to-main.sh` (simplified workflow)
- Made SUPABASE_DB_PASSWORD optional with warning (not fatal error)
- Added git commit and push functionality directly in script
- Better commit message handling
- Added status messages for git operations

**Features:**
- Pushes Supabase migrations to production
- Commits all changes with custom message
- Pushes to origin main branch
- Loads .env.production for credentials

## Usage

### Starting Development
```bash
# Quick start (everything automated)
bash start-app.sh

# Manual start (if you prefer)
npm run dev
```

### Deploying to Production
```bash
# With custom commit message
bash push-to-prod.sh "Add new recipe features"

# With default message
bash push-to-prod.sh
```

## Environment Setup

### Local Development (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### Production (.env.production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_DB_PASSWORD=your-db-password
```

## Next Steps

1. ✅ Scripts are executable and ready to use
2. ✅ Documentation updated in README.md
3. ✅ .gitignore configured properly
4. 📝 Create `.env.production` when ready to deploy (copy from .env.production.example)
5. 📝 Link Supabase remote project: `npx supabase link --project-ref your-project-ref`

## Differences from Ankimal Project

| Feature | Ankimal | Feeder |
|---------|---------|--------|
| Port | 5173 (Vite) | 3000 (Next.js) |
| Env File | .env.development | .env.local |
| Supabase Start | npm run db:start | npx supabase start |
| Env Loading | Manual export | Automatic (Next.js) |
| Sync Script | Uses sync-to-main.sh | Self-contained |
| DB Password | Required | Optional with warning |
