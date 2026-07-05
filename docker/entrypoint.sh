#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running Prisma migrations..."
  npm run prisma:deploy
fi

exec node dist/main.js
