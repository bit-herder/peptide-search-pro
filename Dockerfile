# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- runner stage ----
FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create data directory owned by node user (SQLite needs write access at runtime)
RUN mkdir -p /app/data && chown -R node:node /app/data

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
