# Multi-stage build for TypeScript backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript files
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
# Prisma client needs the schema and prisma files to work properly
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Create upload/public directories
RUN mkdir -p uploads public

EXPOSE 3001

# Command to sync the database schema and start the Express server
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
