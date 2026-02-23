# Multi-stage build for production deployment
FROM node:20-alpine AS client-builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
FROM node:20-alpine AS server-builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine

# Install OpenSSL and libc6-compat for Prisma and glibc compatibility
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy Prisma and other critical modules from builder
COPY --from=server-builder /app/server/node_modules ./node_modules

# Copy built server
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma

# Copy built client
COPY --from=client-builder /app/client/dist ./public

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server
CMD ["sh", "-c", "prisma migrate deploy && node dist/index.js"]
