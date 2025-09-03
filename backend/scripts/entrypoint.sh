#!/bin/sh
# entrypoint.sh

set -e

# Wait for the database to be ready
/usr/src/app/scripts/wait-for-it.sh "$DB_HOST" "$DB_PORT" -- echo "Database is up"

# Execute the main command (passed from CMD in Dockerfile)
exec "$@" 