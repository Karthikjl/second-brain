# ============================================================
# Second Brain - Next.js Full-Stack Application Dockerfile
# ============================================================

# 1. Base Image with build dependencies for native compilation (better-sqlite3)
FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Dependencies Stage
FROM base AS deps
COPY package*.json ./
RUN npm ci

# 3. Builder Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 4. Runner Stage (Production Runtime optimized for SQLite)
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Install runtime utilities: gosu for secure privilege dropping & sqlite3 CLI for database operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    gosu \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DB_CLIENT=sqlite
ENV SQLITE_DB_PATH=/app/db/second_brain.sqlite

# Create non-root nextjs user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Declare SQLite volume mount point
VOLUME ["/app/db"]

EXPOSE 3000

# Container health check verifying Next.js API & SQLite responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/auth/setup-status', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Entrypoint automatically ensures mounted volume has proper permissions for nextjs user before starting
ENTRYPOINT ["/bin/sh", "-c", "mkdir -p /app/db && chown -R nextjs:nodejs /app/db && chmod 775 /app/db && exec gosu nextjs \"$@\"", "--"]

CMD ["node", "server.js"]
