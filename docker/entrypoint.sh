#!/bin/sh
set -eu

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding admin account..."
npx tsx prisma/seed.ts

echo "Starting app..."
exec "$@"
