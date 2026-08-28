#!/bin/sh
# Seeds the Slavic Launcher collections + sample data on first run.
# Uses the PocketBase admin API. Reads credentials from env vars.
# Runs in background; if collections already exist it does nothing.

set -e

PB_URL="${PB_URL:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@slavic.local}"
ADMIN_PASS="${PB_ADMIN_PASSWORD:-changeme123}"

# Wait for PocketBase to be ready
echo "[seed] waiting for PocketBase at $PB_URL…"
for i in $(seq 1 30); do
  if wget -qO- "$PB_URL/api/health" >/dev/null 2>&1; then
    echo "[seed] PocketBase is up."
    break
  fi
  sleep 1
done

# Ensure superuser exists
/pb/pocketbase superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASS" 2>/dev/null || true

# Authenticate
TOKEN=$(wget -qO- --header="Content-Type: application/json" \
  --post-data="{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  "$PB_URL/api/collections/_superusers/auth-with-password" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "[seed] auth failed, skipping seed."
  exit 0
fi

AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

# Helper: create collection if it doesn't exist
create_collection() {
  local name="$1"
  local schema="$2"
  # Check if exists
  EXISTS=$(wget -qO- --header="$AUTH" "$PB_URL/api/collections" \
    | grep -o "\"name\":\"$name\"" | head -1)
  if [ -n "$EXISTS" ]; then
    echo "[seed] collection '$name' already exists, skipping."
    return 0
  fi
  echo "[seed] creating collection: $name"
  wget -qO- --header="$AUTH" --header="$CT" \
    --post-data="{\"name\":\"$name\",\"schema\":$schema}" \
    "$PB_URL/api/collections" >/dev/null
  # Make public-readable
  local CID=$(wget -qO- --header="$AUTH" "$PB_URL/api/collections" \
    | sed -n "s/.*\"id\":\"\\([^\"]*\\)\",\"name\":\"$name\".*/\\1/p" | head -1)
  if [ -n "$CID" ]; then
    wget -qO- --method=PATCH --header="$AUTH" --header="$CT" \
      --body-data="{\"listRule\":\"\",\"viewRule\":\"\"}" \
      "$PB_URL/api/collections/$CID" >/dev/null 2>&1 || true
  fi
}

# Field schema helpers
T_text='{"type":"text"}'
T_bool='{"type":"bool"}'
T_number='{"type":"number"}'
T_date='{"type":"date"}'
T_file='{"type":"file","options":{"maxSelect":1}}'
T_relation='{"type":"relation","options":{"collection":"cosmetics","maxSelect":1}}'

# Create collections with minimal schemas
create_collection "users" "[{\"name\":\"username\",\"type\":\"text\",\"required\":true},{\"name\":\"uuid\",\"type\":\"text\",\"required\":true},{\"name\":\"discord_id\",\"type\":\"text\"},{\"name\":\"avatar_url\",\"type\":\"text\"}]"
create_collection "cosmetics" "[{\"name\":\"name\",\"type\":\"text\",\"required\":true},{\"name\":\"description\",\"type\":\"text\"},{\"name\":\"type\",\"type\":\"text\",\"required\":true},{\"name\":\"rarity\",\"type\":\"text\"},{\"name\":\"image\",\"type\":\"file\",\"options\":{\"maxSelect\":1}},{\"name\":\"model_url\",\"type\":\"text\"}]"
create_collection "user_cosmetics" "[{\"name\":\"user\",\"type\":\"text\",\"required\":true},{\"name\":\"cosmetic\",\"type\":\"relation\",\"required\":true,\"options\":{\"collection\":\"cosmetics\",\"maxSelect\":1}},{\"name\":\"equipped\",\"type\":\"bool\"}]"
create_collection "redeem_codes" "[{\"name\":\"code\",\"type\":\"text\",\"required\":true},{\"name\":\"reward\",\"type\":\"text\"},{\"name\":\"used\",\"type\":\"bool\"},{\"name\":\"used_by\",\"type\":\"text\"}]"
create_collection "news" "[{\"name\":\"title\",\"type\":\"text\",\"required\":true},{\"name\":\"body\",\"type\":\"text\",\"required\":true},{\"name\":\"image\",\"type\":\"file\",\"options\":{\"maxSelect\":1}},{\"name\":\"date\",\"type\":\"date\"}]"
create_collection "servers" "[{\"name\":\"name\",\"type\":\"text\",\"required\":true},{\"name\":\"ip\",\"type\":\"text\",\"required\":true},{\"name\":\"description\",\"type\":\"text\"},{\"name\":\"online\",\"type\":\"bool\"},{\"name\":\"players\",\"type\":\"number\"},{\"name\":\"maxPlayers\",\"type\":\"number\"},{\"name\":\"icon\",\"type\":\"file\",\"options\":{\"maxSelect\":1}}]"

# Seed sample data if collections are empty
NEWS_COUNT=$(wget -qO- "$PB_URL/api/collections/news/records" | grep -o '"totalItems":[0-9]*' | grep -o '[0-9]*')
if [ "$NEWS_COUNT" = "0" ]; then
  echo "[seed] adding sample news…"
  wget -qO- --header="$CT" \
    --post-data='{"title":"Welcome to Slavic Launcher!","body":"Join our Discord for giveaways and redeem codes. Fabric + mods supported.","date":"2026-08-28"}' \
    "$PB_URL/api/collections/news/records" >/dev/null
fi

SERVER_COUNT=$(wget -qO- "$PB_URL/api/collections/servers/records" | grep -o '"totalItems":[0-9]*' | grep -o '[0-9]*')
if [ "$SERVER_COUNT" = "0" ]; then
  echo "[seed] adding sample server…"
  wget -qO- --header="$CT" \
    --post-data='{"name":"Slavic Network","ip":"play.slavic.gg","description":"Survival + SkyBlock. Use Slavic Launcher for cosmetics.","online":true,"players":0,"maxPlayers":500}' \
    "$PB_URL/api/collections/servers/records" >/dev/null
fi

CODE_COUNT=$(wget -qO- "$PB_URL/api/collections/redeem_codes/records" | grep -o '"totalItems":[0-9]*' | grep -o '[0-9]*')
if [ "$CODE_COUNT" = "0" ]; then
  echo "[seed] adding sample redeem code…"
  wget -qO- --header="$CT" \
    --post-data='{"code":"WELCOME10","reward":"Starter Cape","used":false}' \
    "$PB_URL/api/collections/redeem_codes/records" >/dev/null
fi

echo "[seed] done."
