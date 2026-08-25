#!/bin/sh
set -eu

mkdir -p /app/data

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding admin account..."
npx tsx prisma/seed.ts

echo "Starting app..."
exec "$@"
