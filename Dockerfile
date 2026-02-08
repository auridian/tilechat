FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_RECIPIENT_ADDRESS=""
ARG NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS=""
ENV NEXT_PUBLIC_RECIPIENT_ADDRESS=$NEXT_PUBLIC_RECIPIENT_ADDRESS
ENV NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS=$NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS

RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
