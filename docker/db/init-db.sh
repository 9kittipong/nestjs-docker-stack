#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

echo "Running prisma db push..."
cd /prisma
npx prisma db push
echo "Database schema is ready."
