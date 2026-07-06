# ── Build Stage ──────────────────────────────────────────────────────────────
FROM oven/bun:latest AS builder

WORKDIR /app

# Declare build args (VITE_* must be present at build time — Vite embeds them)
ARG VITE_PINATA_API_KEY
ARG VITE_PINATA_SECRET_API_KEY
ARG VITE_CONTRACT_ADDRESS

# Export as env vars so Vite can read them during `bun run build`
ENV VITE_PINATA_API_KEY=$VITE_PINATA_API_KEY
ENV VITE_PINATA_SECRET_API_KEY=$VITE_PINATA_SECRET_API_KEY
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS

# Install dependencies first (layer cache)
COPY package.json bun.lock ./
RUN bun install

# Copy source and build
COPY . .
RUN bun run build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM oven/bun:latest

WORKDIR /app

# Only copy the compiled output
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "build/index.js"]
