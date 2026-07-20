# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source files needed for the WS server
COPY src/server/ws-server.ts ./src/server/
COPY src/lib/redis.ts ./src/lib/
COPY tsconfig.json ./
COPY .env.example .env.example

# Install tsx for running TypeScript directly
RUN npm install -g tsx

EXPOSE 3001

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["tsx", "src/server/ws-server.ts"]
