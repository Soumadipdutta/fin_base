#!/bin/sh
set -e

echo "Waiting for database migrations..."
alembic -c alembic.ini upgrade head

echo "Starting FlowPilot API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
