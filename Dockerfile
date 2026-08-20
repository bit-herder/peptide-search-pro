# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:22-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build

# ---- runner stage ----
FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/better-sqlite3/build ./node_modules/better-sqlite3/build

EXPOSE 3000

CMD ["node", "server.js"]
