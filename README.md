# TOIL Tracker

A self-hosted time-off-in-lieu (TOIL) tracking application with a REST API backend and a React frontend. Clock in and out via iOS Shortcuts (location-triggered automations or manual home-screen shortcuts) and review your TOIL balance in a clean web dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Local Setup](#local-setup)
5. [Docker Deployment](#docker-deployment)
6. [Environment Variables](#environment-variables)
7. [Production Build](#production-build)
8. [API Key Setup](#api-key-setup)
9. [iOS Shortcuts Setup](#ios-shortcuts-setup)
10. [Deployment Notes](#deployment-notes)

---

## Overview

**TOIL Tracker** records work sessions (clock-in / clock-out events with optional breaks) and calculates how much TOIL you have accumulated or owe against a configurable standard working day. Sessions can be created automatically via iOS location automations or manually via a home-screen shortcut or the web UI.

Key features:

- Clock in / clock out via HTTP (iOS Shortcuts, curl, or any HTTP client)
- Break tracking within a session
- Configurable standard day length and rounding rules
- Weekly / custom-range TOIL summary
- Email report generation
- Audit log for all mutations
- Simple API-key authentication

---

## Architecture

| Layer | Technology | Why |
|-------|-----------|-----|
| **API** | [Express](https://expressjs.com/) | Minimal, well-understood Node.js framework; easy to self-host and extend |
| **Database** | SQLite via [Prisma](https://www.prisma.io/) | Zero-ops for a single-user tool; Prisma provides type-safe queries and migrations |
| **Date math** | [date-fns](https://date-fns.org/) + [date-fns-tz](https://github.com/marnusw/date-fns-tz) | Reliable, tree-shakeable date utilities with explicit timezone handling |
| **Validation** | [Zod](https://zod.dev/) | Runtime schema validation that doubles as TypeScript types |
| **Frontend** | React + Vite + TypeScript | Fast dev server, first-class TypeScript support |
| **Rate limiting** | [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | Lightweight protection without an external dependency |

Sessions are stored with UTC timestamps; all TOIL calculations convert to the configured local timezone (defaulting to `Australia/Perth`) before comparing against your standard day.

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (workspaces support)
- Git

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/TOIL-Tracker.git
cd TOIL-Tracker
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both the `server` and `client` workspaces via npm workspaces.

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and adjust the values (see [Environment Variables](#environment-variables)).

At a minimum, change `API_KEY` to a random secret string.

### 4. Initialise the database

```bash
npm run setup
```

This runs `npm install` (no-op if already done), generates the Prisma client, and applies all migrations to create `server/prisma/dev.db`.

### 5. (Optional) Seed sample data

```bash
npm run db:seed
```

Populates the database with a few weeks of example sessions so the dashboard has something to show.

### 6. Start the development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| API server | <http://localhost:3001> |
| Web dashboard | <http://localhost:5173> |

Both servers reload automatically on file changes.

---

## Docker Deployment

For production deployment, use Docker for easy single-container deployment:

### Quick Start with Docker Compose (Recommended)

```bash
docker-compose up -d --build
```

The application will be available at `http://localhost:3001`

### Manual Docker Build

```bash
# Build the image
docker build -t toil-tracker .

# Run the container
docker run -d \
  --name toil-tracker \
  -p 3001:3001 \
  -v toil-data:/data \
  -e DATABASE_URL=file:/data/toil.db \
  -e API_KEY=your-secure-api-key-here \
  toil-tracker
```

### Configuration

Create a `.env.production` file (see `.env.production.example`) with your production settings:

- `API_KEY` - Set a secure random key
- `CORS_ORIGIN` - Set to your domain (e.g., `https://yourdomain.com`)
- `DATABASE_URL` - Keep as `file:/data/toil.db` for Docker volume persistence

### Data Backup

```bash
# Backup database
docker run --rm -v toil-data:/data -v $(pwd):/backup alpine tar czf /backup/toil-backup.tar.gz /data

# Restore database
docker run --rm -v toil-data:/data -v $(pwd):/backup alpine tar xzf /backup/toil-backup.tar.gz -C /
```

For detailed deployment instructions, reverse proxy setup, and troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Environment Variables

Located in `server/.env` (copy from `server/.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Prisma SQLite connection string. Path is relative to `server/prisma/`. |
| `API_KEY` | `change-me-to-a-random-secret` | Bearer token required for all mutating API requests. |
| `PORT` | `3001` | Port the Express server listens on. |
| `NODE_ENV` | `development` | Set to `production` in deployed environments. |

---

## Production Build

```bash
npm run build
```

This compiles the TypeScript server to `server/dist/` and bundles the React client to `client/dist/`.

To serve the compiled server:

```bash
cd server
node dist/index.js
```

Serve `client/dist/` with any static file host (nginx, Caddy, Cloudflare Pages, etc.) or point Express at it with `express.static`.

---

## API Key Setup

Every request that creates or modifies data must include the API key as a Bearer token:

```
Authorization: Bearer <your-api-key>
```

Generate a strong key before deploying:

```bash
# macOS / Linux
openssl rand -hex 32
```

Set the output as `API_KEY` in `server/.env` (or as an environment variable in your hosting platform).

Read-only endpoints (summaries, reports) do not require authentication by default; change `middleware/auth.ts` if you want to lock those down too.

---

## iOS Shortcuts Setup

TOIL Tracker is designed to be driven by iOS Shortcuts so that clocking in and out can happen automatically (via location triggers) or with one tap.

### Prerequisites

- Your server must be reachable from your iPhone (local network or public URL).
- Your `API_KEY` value.

### Arrive at Work — Location Automation

1. Open the **Shortcuts** app → **Automation** tab → **+** → **New Automation**.
2. Choose **Arrive** → tap **Choose** next to Location → search for your workplace → set a suitable radius → tap **Done**.
3. Enable **Run Immediately** (disable "Ask Before Running") → tap **Next**.
4. Add the following action:

   **Get Contents of URL**
   - URL: `https://your-server/api/sessions/clock-in`
   - Method: `POST`
   - Headers:
     - `Authorization` → `Bearer <your-api-key>`
     - `Content-Type` → `application/json`
   - Request Body: **JSON**
     - Add key `source` → value `IOS_SHORTCUT`
     - Add key `locationLabel` → value `Work`

5. Optionally add a **Show Notification** action with the message "Clocked in ✅".
6. Tap **Done**.

### Leave Work — Location Automation

1. **Automation** → **+** → **New Automation** → **Leave** → same location as above.
2. Enable **Run Immediately** → **Next**.
3. Add **Get Contents of URL**:
   - URL: `https://your-server/api/sessions/clock-out`
   - Method: `POST`
   - Headers: same as above
   - Request Body: **JSON** (can be empty `{}`)
4. Tap **Done**.

### Manual Home-Screen Shortcut

For days when the automation doesn't fire or you want manual control:

1. **Shortcuts** app → **+** → **New Shortcut** → name it **"TOIL: Toggle"**.
2. Add **Get Contents of URL**:
   - URL: `https://your-server/api/sessions/status`
   - Method: `GET`
   - Headers: `Authorization` → `Bearer <your-api-key>`
3. Add **Get Dictionary Value** → Key: `hasOpenSession` → from: *Contents of URL*.
4. Add **If** → *Dictionary Value* **is** `true`:
   - **True branch**: another **Get Contents of URL** → POST to `/api/sessions/clock-out`.
   - **False branch**: another **Get Contents of URL** → POST to `/api/sessions/clock-in` with `source` = `MANUAL`.
5. Add a **Show Notification** showing the result.
6. Add the shortcut to your home screen via the share sheet → **Add to Home Screen**.

### Useful Shortcut URLs

| Action | Method | Endpoint |
|--------|--------|----------|
| Clock in | POST | `/api/sessions/clock-in` |
| Clock out | POST | `/api/sessions/clock-out` |
| Current status | GET | `/api/sessions/status` |
| Weekly summary | GET | `/api/summary/week` |

---

## Deployment Notes

### Railway

1. Connect your GitHub repository.
2. Add a service for `server/` (set root directory to `server`).
3. Set environment variables: `DATABASE_URL`, `API_KEY`, `NODE_ENV=production`, `PORT`.
4. Add a volume mount at `/app/prisma` so the SQLite file persists across deploys.
5. Set the start command to `node dist/index.js` and build command to `npm run build`.

### Fly.io

```bash
cd server
fly launch          # follow prompts, choose a small VM
fly volumes create toil_data --size 1
```

Add a `[mounts]` section in `fly.toml`:

```toml
[mounts]
  source = "toil_data"
  destination = "/data"
```

Set `DATABASE_URL="file:/data/prod.db"` via `fly secrets set DATABASE_URL="file:/data/prod.db"`.

### VPS with nginx

```nginx
server {
    listen 443 ssl;
    server_name toil.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/toil-client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Use `pm2` or a systemd unit to keep the Node process running:

```bash
pm2 start server/dist/index.js --name toil-tracker
pm2 save && pm2 startup
```

---

## Running Tests

```bash
npm test
```

Runs the Vitest suite in `server/__tests__/`.
