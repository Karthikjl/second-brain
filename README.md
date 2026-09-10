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

Run the unified full-stack application (Next.js frontend + API routes + persistent SQLite database) with a single command:

```bash
docker compose up -d --build
```

- **Application URL:** [http://localhost:3000](http://localhost:3000)
- **Data Persistence:** SQLite database file is safely stored in `./db/second_brain.sqlite`

To stop the containers:
```bash
docker compose down
```

To view real-time logs:
```bash
docker compose logs -f
```

---

## 💻 Local Development Setup (npm)

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

Open [http://localhost:3000](http://localhost:3000) in your browser. On first launch, you will be prompted to bootstrap your Super Admin account.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🗄️ Database Options

Second Brain supports two database modes configured via `DB_CLIENT` in your `.env`:

### Option A: SQLite (Default — Zero Setup)
```env
DB_CLIENT=sqlite
SQLITE_DB_PATH=./db/second_brain.sqlite
```
- Fully embedded, zero-configuration local database.
- Automatically initializes schema, tables, and default settings on startup.
- WAL (Write-Ahead Logging) mode enabled for high-concurrency performance.

### Option B: Supabase (PostgreSQL)
```env
DB_CLIENT=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
1. Paste [`db/schema.sql`](db/schema.sql) into your [Supabase SQL Editor](https://supabase.com/dashboard) and execute.
2. Update `.env` with your Supabase credentials.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Next.js application runs on |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `DB_CLIENT` | `sqlite` | Database engine (`sqlite` or `supabase`) |
| `SQLITE_DB_PATH` | `./db/second_brain.sqlite` | Path to the SQLite database file |
| `JWT_ACCESS_SECRET` | *(string)* | Secret used to sign JWT access tokens (min 64 chars recommended) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiration duration |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `30` | Refresh token lifespan in days |
| `SUPABASE_URL` | - | Supabase project URL (required only if `DB_CLIENT=supabase`) |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Supabase service key (required only if `DB_CLIENT=supabase`) |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated list of allowed origins |

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
