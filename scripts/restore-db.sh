#!/usr/bin/env bash
#
# AMS — restore a dump into an EMPTY PostgreSQL database.
#
#   ./scripts/restore-db.sh <dump-file> "<postgres-url-of-empty-db>"
#
# Deliberately refuses to restore into a database that already has tables:
# restoring is a "restore into fresh, verify, then repoint" operation, never
# an overwrite of live data. This script never drops, truncates or deletes
# anything.
#
set -euo pipefail

DUMP="${1:-}"
TARGET="${2:-}"

if [[ -z "$DUMP" || -z "$TARGET" ]]; then
  echo "usage: $0 <dump-file> \"postgresql://user:pass@host:5432/empty_db\"" >&2
  exit 64
fi

if [[ ! -s "$DUMP" ]]; then
  echo "error: dump file '$DUMP' does not exist or is empty" >&2
  exit 66
fi

for tool in psql pg_restore; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: $tool not found. Install PostgreSQL client tools first" >&2
    exit 69
  fi
done

echo "→ checking target database is empty"
EXISTING_TABLES="$(psql "$TARGET" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
if [[ "${EXISTING_TABLES//[^0-9]/}" != "0" ]]; then
  cat >&2 <<EOF
error: target database already contains ${EXISTING_TABLES} table(s) — refusing.

Restoring over a live database can destroy data. Instead:

  1. create a NEW empty database (e.g. mydb_restore_$(date +%Y%m%d))
  2. restore into it:  $0 "$DUMP" "postgresql://…/mydb_restore_$(date +%Y%m%d)"
  3. verify the restored data, then repoint DATABASE_URL at it
     and restart the application.

EOF
  exit 77
fi

echo "→ restoring $DUMP"
pg_restore --no-owner --no-privileges --dbname "$TARGET" "$DUMP"

RESTORED="$(psql "$TARGET" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
echo "OK: restored ${RESTORED} table(s) into the target database."
echo "Next: verify row counts, then update DATABASE_URL and restart the app."
