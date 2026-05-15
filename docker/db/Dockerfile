FROM postgres:18-alpine

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=my_nest_api

# Add libc6-compat and openssl for Prisma compatibility
RUN apk add --no-cache nodejs npm libc6-compat openssl

WORKDIR /prisma
COPY prisma/schema.prisma ./
COPY prisma.config.ts ./

RUN npm install prisma @prisma/client

COPY docker/db/init-db.sh /docker-entrypoint-initdb.d/init-db.sh
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh

EXPOSE 5432

HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
