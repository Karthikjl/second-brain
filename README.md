# Second Brain 🧠⚡

A modern, full-stack personal knowledge, task, habit, and schedule management platform built with Next.js (App Router), React 19, TypeScript, and a bold **Neo-Brutalism** aesthetic.

Second Brain combines note capture with 1-click task conversion, Eisenhower matrix prioritization, weekly habit tracking with streak algorithms, a unified calendar, an integrated AI assistant with custom model support, and a comprehensive **Super Admin Security & Access Control Panel** with sliding-window brute-force defense.

Supports both **zero-config local SQLite (with WAL mode)** and **Supabase (PostgreSQL)**.

---

## ✨ Features Overview

### 👑 Super Admin & Access Control
- **First-run bootstrap**: Seamless setup wizard to create the root Super Admin account.
- **User Management & Live Editing**: Update user details, switch roles (`User` / `Admin`), and toggle account status (`Active` / `Inactive`) via an interactive modal with full Root Super Admin protection.
- **Security & Lockout Controls**: Sliding-window rate limiting, real-time brute-force lockout monitoring, 1-click admin unlocking, force password resets, and self-signup toggle.

### 🤖 Second Brain AI Assistant
- **Context-aware intelligent chat**: Chat with your Second Brain to brainstorm ideas, plan schedules, or analyze tasks.
- **Custom Model Support**: Choose from preset AI models or configure your own custom model identifiers and API keys directly in User Settings.

### 🎯 Tasks & Eisenhower Matrix
- **4-Quadrant Prioritization**: *Do First* (Urgent & Important), *Schedule* (Important, Not Urgent), *Delegate* (Urgent, Not Important), and *Eliminate* (Neither).
- **Organization**: Due dates, completion toggles, customizable tags, and search/filtering.

### 🔥 Habit Tracking & Streak Engine
- **Weekly-Quota Model**: Set target completions per week (e.g., 5x/week or daily).
- **Accurate Mathematics**: Live streak calculations computed from habit completion logs with DST and timezone resilience (capped up to 52 weeks).

### 📝 Notes & Instant Task Conversion
- **Taggable Quick Notes**: Capture thoughts, code snippets, or meeting notes with full-text search.
- **1-Click Conversion**: Convert any note into a prioritized task with automatic back-linking.

### 📅 Unified Calendar & Schedule
- **Multi-View Agenda**: Day, week, and month views aggregating scheduled tasks, habit logs, and standalone events in your local timezone.

### 👥 Multi-Profile Isolation
- **Netflix-Style Switching**: Switch between up to 5 isolated profiles per user account (e.g., Work, Personal, Study). All notes, tasks, and habits remain strictly isolated.

### 🗑️ Recycle Bin & Soft-Delete Recovery
- **Safe Deletion**: Soft-deleted notes and tasks are kept for 30 days before automated purge, allowing instant restoration.

### 🎨 Neo-Brutalist Design System
- High-contrast typography, bold solid borders, tactile drop shadows, and custom UI components (including custom `NeoSelect` dropdowns and animated modals).

---

## 🚀 Quick Start with Docker (Recommended)

Second Brain runs as a unified full-stack application (Next.js frontend + API route handlers + persistent SQLite database) inside a single lightweight container.

### 1. Standard Startup

```bash
# Start container in background
docker compose up -d --build

# View real-time logs
docker compose logs -f

# Stop container
docker compose down
```

- **Default URL:** [http://localhost:3000](http://localhost:3000)
- **Default Database Location:** `./db/second_brain.sqlite` (on your host machine)

---

### 2. Custom Port & Server Storage Path Configuration

To run on a **custom port** or store the SQLite database in a **specific folder on your server** (e.g. `/var/lib/second-brain/data` on a VPS or `D:/server-data/db` on Windows), configure them directly in your `.env` file:

```env
# Port exposed on your host server (e.g., 8080, 80, 5000)
HOST_PORT=8080

# Exact directory on your host server where the SQLite database will be saved
# Linux VPS Example:
SQLITE_HOST_DIR=/var/lib/second-brain/data

# Windows Server Example:
# SQLITE_HOST_DIR=D:/server-data/db
```

Then start or restart the container:
```bash
docker compose up -d --build
```

#### How It Works Under the Hood:
- **Port Mapping (`HOST_PORT:3000`)**: Next.js listens internally on `3000`. Docker forwards all traffic from your configured server port (e.g., `8080`) to the container.
- **Volume Persistence (`SQLITE_HOST_DIR:/app/db`)**: The container writes to `/app/db/second_brain.sqlite`. Docker syncs this directly to your host directory, ensuring all tasks, notes, habits, and user accounts survive container recreations and updates.
- **Permission & WAL Safe (`gosu`)**: The container's entrypoint ensures directory ownership before running as an unprivileged user, preventing SQLite `SQLITE_CANTOPEN` permission errors on Linux hosts and ensuring clean Write-Ahead Log (WAL) checkpoints on container stop.

---

### 3. Alternative: Run Directly with `docker run`

If you deploy without Docker Compose:

```bash
# Create directory on server if it doesn't exist
mkdir -p /var/lib/second-brain/data

# Run container with custom port (8080) and custom server storage path
docker run -d \
  --name second-brain \
  --restart unless-stopped \
  -p 8080:3000 \
  -v /var/lib/second-brain/data:/app/db \
  -e NODE_ENV=production \
  -e JWT_ACCESS_SECRET="your_secure_64_character_random_hex_key" \
  second-brain
```

---

### 4. Inspecting & Backing Up the SQLite Database

The container includes the official `sqlite3` CLI utility. You can inspect or back up your live database at any time without installing tools on your host:

```bash
# Check database tables
docker compose exec app sqlite3 /app/db/second_brain.sqlite ".tables"

# Create a live, consistent snapshot backup
docker compose exec app sqlite3 /app/db/second_brain.sqlite ".backup '/app/db/backup_$(date +%F).sqlite'"
```

---

## 💻 Local Development & Bare-Metal Setup (npm)

### Prerequisites
- **Node.js 20+** or **Node.js 22 LTS** ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Karthikjl/second-brain.git
cd second-brain
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. On first launch, the **First-Run Super Admin Setup Wizard** will appear to create your root administrator account.

### 4. Build & Run for Production (Bare-Metal / PM2)
```bash
# Generate optimized production build
npm run build

# Start production server
npm start
```

For non-Docker servers (systemd, PM2), customize the listening port and database path in `.env`:
```env
PORT=8080
SQLITE_DB_PATH=/var/lib/second-brain/data/second_brain.sqlite
```

---

## 🗄️ Database Options

Second Brain supports two database engines configured via `DB_CLIENT` in your `.env`:

### Option A: SQLite (Default — Recommended for Self-Hosting)
```env
DB_CLIENT=sqlite
SQLITE_DB_PATH=./db/second_brain.sqlite
```
- **Zero Configuration**: No external database server required.
- **Automatic Initialization**: Creates all tables and initial administrative settings automatically on boot.
- **High Concurrency**: Configured with WAL (Write-Ahead Logging) mode and foreign key constraints.
- **Docker Mount**: Point `SQLITE_HOST_DIR` to any folder on your server to persist data.

### Option B: Supabase (Cloud PostgreSQL — Recommended for Serverless like Vercel)
```env
DB_CLIENT=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
1. Paste [`db/schema.sql`](db/schema.sql) into your [Supabase SQL Editor](https://supabase.com/dashboard) and execute.
2. Update `.env` with your Supabase credentials.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Scope | Description |
|---|---|---|---|
| `PORT` | `3000` | Node.js | Internal port the Next.js server listens on |
| `HOST_PORT` | `3000` | Docker | Public port exposed on your host machine / VPS |
| `SQLITE_HOST_DIR` | `./db` | Docker | Server directory mounted for SQLite database persistence |
| `SQLITE_DB_PATH` | `./db/second_brain.sqlite` | Node.js / Local | Path to the SQLite database file on disk |
| `DB_CLIENT` | `sqlite` | All | Database engine: `sqlite` (default) or `supabase` |
| `NODE_ENV` | `development` | All | Environment mode (`development` or `production`) |
| `JWT_ACCESS_SECRET` | *(required in prod)* | Auth | Secret used to sign JWT access tokens (min 64 chars) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Auth | Access token expiration duration |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `30` | Auth | Refresh token lifespan in days |
| `CORS_ORIGIN` | `http://localhost:3000` | Security | Comma-separated list of allowed origins |
| `SUPABASE_URL` | - | Cloud DB | Supabase project URL (only required if `DB_CLIENT=supabase`) |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Cloud DB | Supabase service key (only required if `DB_CLIENT=supabase`) |

> [!IMPORTANT]
> **Production JWT Secret**: In production (`NODE_ENV=production`), `JWT_ACCESS_SECRET` is strictly required. Generate a strong key with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 📁 Project Architecture

```
├── db/
│   ├── schema.sql              # Supabase PostgreSQL DDL & migrations
│   ├── schema-erd.mmd          # Mermaid Entity-Relationship diagram
│   └── second_brain.sqlite     # SQLite database (when DB_CLIENT=sqlite)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Authenticated application shell & pages
│   │   │   ├── admin/          # Super Admin & User Management panel
│   │   │   ├── ai/             # Second Brain AI chat assistant
│   │   │   ├── calendar/       # Unified calendar schedule
│   │   │   ├── dashboard/      # Command center & daily overview
│   │   │   ├── habits/         # Habit tracker & weekly streak cards
│   │   │   ├── notes/          # Note taking & task conversion
│   │   │   ├── recycle-bin/    # Soft-deleted items recovery
│   │   │   ├── settings/       # Profile, security, and AI model settings
│   │   │   └── tasks/          # Eisenhower matrix task management
│   │   ├── api/                # Next.js backend API routes (/api/*)
│   │   ├── change-password/    # Password change & re-authentication
│   │   ├── layout.tsx          # Root layout & font configuration
│   │   └── page.tsx            # Login & Super Admin bootstrap landing
│   ├── components/             # Reusable UI components (Sidebar, Modals, NeoSelect)
│   ├── config/                 # Database initialization and environment schema
│   ├── controllers/            # Core business handlers (auth, admin, tasks, notes, habits)
│   ├── middleware/             # Authentication & sliding-window rate limiters
│   ├── services/               # Database operations and query layers
│   └── utils/                  # JWT token management, encryption, and date math
├── tests/                      # Stress, timezone, and controller tests
├── Dockerfile                  # Multi-stage container build with native SQLite compilation
├── docker-compose.yml          # Container orchestration with persistent volume mapping
├── package.json
└── README.md
```

---

## 🧪 Running Tests

Second Brain includes in-memory stress test suites and timezone regression tests:

```bash
node tests/stress-time.js
node tests/stress-habits.js
node tests/stress-controllers.js
node tests/frontend-dst.js
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
