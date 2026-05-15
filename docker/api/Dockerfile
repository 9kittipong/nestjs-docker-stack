# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Development Stage ----
FROM build AS development
WORKDIR /usr/src/app

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist
RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:3000/ || exit 1

CMD ["node", "dist/main"]
