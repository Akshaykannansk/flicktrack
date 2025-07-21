#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
shift
cmd="$@"

# Loop until we can successfully connect to Postgres
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
# Run migrations first, then execute the main command (e.g., `npm run dev`)
npm run db:migrate
exec $cmd
