#!/usr/bin/env bash
#
# AMS — non-destructive PostgreSQL backup.
#
#   ./scripts/backup-db.sh "<postgres-url>" [output-file]
#
# Creates a compressed custom-format dump and verifies it is readable.
# Never connects with WRITE intent; pg_dump only reads.
#
set -euo pipefail

URL="${1:-${DATABASE_URL:-}}"
OUT="${2:-}"

if [[ -z "$URL" ]]; then
  echo "usage: $0 \"postgresql://user:pass@host:5432/dbname\" [output-file]" >&2
  echo "       (or set DATABASE_URL and call without arguments)" >&2
  exit 64
fi

for tool in pg_dump pg_restore; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: $tool not found. Install PostgreSQL client tools first" >&2
    echo "       (brew install libpq / apt install postgresql-client)." >&2
    exit 69
  fi
done

if [[ -z "$OUT" ]]; then
  mkdir -p backups
  OUT="backups/ams-$(date +%Y%m%d-%H%M%S).dump"
fi

echo "→ dumping to $OUT"
pg_dump --format=custom --no-owner --no-privileges --file "$OUT" "$URL"

if [[ ! -s "$OUT" ]]; then
  echo "error: dump file is empty — backup FAILED" >&2
  exit 1
fi

echo "→ verifying archive is readable"
TABLE_COUNT="$(pg_restore --list "$OUT" | grep -c '|  ' || true)"
if [[ "$TABLE_COUNT" -eq 0 ]]; then
  echo "error: archive contains no tables — backup FAILED" >&2
  exit 1
fi

echo "OK: $OUT ($(du -h "$OUT" | cut -f1), $TABLE_COUNT archive entries)"
echo "Remember: keep a second copy off this machine (and rely on your"
echo "provider's point-in-time recovery as well)."
