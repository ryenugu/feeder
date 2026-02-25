# Feeder

Clean recipe aggregator for your family. Paste recipe URLs, get beautifully formatted recipes without the clutter.

## Features

- **Paste & Extract** - Paste any recipe URL and get clean, structured data
- **Meal Planning** - Weekly meal planner to organize your dinners
- **iOS Share Sheet** - Send recipes directly from Safari, Instagram, or any app
- **Ingredient Checkoff** - Track your progress while cooking
- **Serving Adjuster** - Scale ingredient quantities up or down

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS v4
- Deployed on Vercel

## Getting Started

### Quick Start (Automated)

The easiest way to start the app is using the automated startup script:

```bash
bash start-app.sh
```

This script will automatically:
- Kill any process using port 3000
- Check and start Docker Desktop if needed
- Start Supabase local instance
- Launch the Next.js dev server

### Manual Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

**Option A: Local development (requires Docker)**

```bash
npx supabase init
npx supabase start
```

Copy the API URL and anon key from the output into `.env.local`.

**Option B: Hosted Supabase**

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the URL and anon key into `.env.local`

### 3. Apply the database migration

Run the SQL in `supabase/migrations/00001_initial_schema.sql` in your Supabase SQL editor (Dashboard > SQL Editor), or if using local Supabase it applies automatically.

### 4. Configure environment variables

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## iOS Share Sheet Setup

You can send recipe URLs directly from any app on your iPhone using an Apple Shortcut.

### Create the Shortcut

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** to create a new shortcut
3. Tap **Add Action** and search for **"Receive"** — select **"Receive input from Share Sheet"**
4. Set the input types to **URLs** and **Text**
5. Add a **"Get URLs from Input"** action
6. Add a **"Get Contents of URL"** action:
   - URL: `https://your-app.vercel.app/api/recipes/quick-save`
   - Method: **POST**
   - Headers: Add `Content-Type` = `application/json`
   - Request Body (JSON): `{"url": "URLs from step 5"}`
7. Add a **"Show Notification"** action with text "Recipe saved!"
8. Name the shortcut **"Save to Feeder"**
9. Tap the **settings icon** > enable **"Show in Share Sheet"**

### How to use

1. Find a recipe on any app (Instagram, Safari, Chrome, etc.)
2. Tap the **Share** button
3. Select **"Save to Feeder"** from the share sheet
4. The recipe is extracted and saved automatically

> **Note:** For the shortcut to authenticate, you'll need to be signed in on Safari first. The shortcut uses your browser cookies. Alternatively, you can add an API key to the shortcut for direct authentication.

## Deploy to Vercel

1. Push your repo to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add your Supabase environment variables
4. Deploy

Update the iOS Shortcut URL to point to your Vercel deployment.

## Development Scripts

### `start-app.sh`

Automated startup script for local development:

```bash
bash start-app.sh
```

This script handles the entire startup process:
- Checks if port 3000 is in use and kills the process if needed
- Detects your OS (Windows/Mac/Linux) and starts Docker Desktop if not running
- Starts Supabase local instance (waits until fully ready)
- Starts the Next.js dev server
- Opens the app at http://localhost:3000

Works on Windows (Git Bash/WSL), macOS, and Linux.

### `push-to-prod.sh`

Deploy Supabase migrations and push to production:

```bash
bash push-to-prod.sh "Your commit message"
```

This script:
1. Pushes Supabase migrations to your remote Supabase project
2. Stages and commits all changes
3. Pushes to the main branch on GitHub

**Setup required:**
1. Create `.env.production` (copy from `.env.production.example`)
2. Add your production Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_DB_PASSWORD=your-db-password
   ```

## Environment Files

- `.env.local` - Local development (used by Next.js and start-app.sh)
- `.env.production` - Production credentials (used by push-to-prod.sh)
- `.env.example` - Template for local development
- `.env.production.example` - Template for production
