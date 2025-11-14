# Backend AI - Dockerfile
# Multi-stage build for production-ready Node.js application

# Stage 1: Base image with dependencies
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Development dependencies (for building if needed)
FROM base AS dependencies

# Install all dependencies (including dev dependencies for potential build steps)
RUN npm ci

# Stage 3: Production dependencies only
FROM base AS production-dependencies

# Install production dependencies only
RUN npm ci --only=production

# Stage 4: Final production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from production-dependencies stage
COPY --from=production-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
