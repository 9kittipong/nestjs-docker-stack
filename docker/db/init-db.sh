#!/bin/sh
set -e

echo "Running prisma db push..."
cd /prisma
npx prisma db push
echo "Database schema is ready."
