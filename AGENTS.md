# Feeder — Development Guide

## Cursor Cloud specific instructions

### Overview

Feeder is a Next.js 16 recipe aggregator app using Supabase (Auth + Postgres), Tailwind CSS v4, React 19, and TypeScript. See `README.md` for full project description and manual setup steps.

### Services

| Service | Port | Purpose |
|---|---|---|
| Next.js dev server | 3000 | `npm run dev` |
| Supabase (local, Docker) | 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Mailpit) | Auth + database |

### Starting the development environment

1. **Docker must be running** before Supabase can start. In Cloud Agent VMs, Docker requires special setup (fuse-overlayfs, iptables-legacy). See the dockerd startup notes below.
2. **Start Supabase**: `npx supabase start` — pulls images on first run (~2 min), subsequent starts are fast. Migrations in `supabase/migrations/` auto-apply.
3. **Create `.env.local`** with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `npx supabase status -o env` (use `API_URL` and `ANON_KEY` values).
4. **Start dev server**: `npm run dev` (port 3000).

### Docker in Cloud Agent VMs (gotcha)

The Cloud Agent VM is a Docker container inside Firecracker. To run Docker-in-Docker:
- Install `fuse-overlayfs` and configure `/etc/docker/daemon.json` with `{"storage-driver": "fuse-overlayfs"}`.
- Switch iptables to legacy: `sudo update-alternatives --set iptables /usr/sbin/iptables-legacy`.
- Start dockerd manually: `sudo dockerd &>/tmp/dockerd.log &` then `sudo chmod 666 /var/run/docker.sock`.

### Common commands

See `package.json` scripts. Key ones:
- **Lint**: `npm run lint` (ESLint 9; note: codebase has some pre-existing lint errors)
- **Test**: `npm test` (Vitest; tests do NOT require Supabase; 1 pre-existing test failure in `validations.test.ts`)
- **Build**: `npm run build`
- **Dev**: `npm run dev`

### Optional API keys

- `FEEDER_ANTHROPIC_API_KEY` — enables PDF/image recipe upload via Claude (set in `.env.local`)
- `SCRAPER_API_KEY` — bypasses Cloudflare on some recipe sites (set in `.env.local`)

### Notes

- Recipe URL extraction may return empty results for sites with anti-scraping protections (e.g., AllRecipes, SimplyRecipes); this is expected without `SCRAPER_API_KEY`.
- Supabase local uses default demo JWT keys. The anon key is stable across restarts.
- Mailpit at `http://127.0.0.1:54324` catches confirmation emails during local development.
