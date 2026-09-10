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

# 4. Runner Stage (Minimal Production Runtime)
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DB_CLIENT=sqlite
ENV SQLITE_DB_PATH=/app/db/second_brain.sqlite

# Create non-root user and database directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/db && \
    chown -R nextjs:nodejs /app/db

# Copy public static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db/ ./db/

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
