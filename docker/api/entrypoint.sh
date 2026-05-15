#!/bin/sh
set -e

echo "Running database schema push..."
npx prisma db push

echo "Starting application..."
exec "$@"
