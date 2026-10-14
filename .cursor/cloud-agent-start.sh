#!/usr/bin/env bash
set -euo pipefail

cd /workspace
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
NODE24="$(dirname "$(nvm which 24)")"
export PATH="$NODE24:$PATH"
hash -r

if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
FORTIUS_INMUEBLES_SITE_URL=http://127.0.0.1:3001
FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED=false
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3101
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-test
SUPABASE_SERVICE_ROLE_KEY=public-test
FORTIUS_APPS_ENABLED=false
EOF
fi

configured_url="${NEXT_PUBLIC_SUPABASE_URL:-}"
if [ -z "$configured_url" ]; then
  configured_url="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi

if [ "$configured_url" = "http://127.0.0.1:3101" ]; then
  if ! tmux has-session -t fortius-fixture 2>/dev/null; then
    tmux new-session -d -s fortius-fixture "cd /workspace && export PATH='$NODE24':\$PATH && node tests/admin/browser/fixtures/public-backend.mjs"
  fi
  ready=0
  for _ in $(seq 1 50); do
    if curl -fsS http://127.0.0.1:3101/health >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 0.1
  done
  if [ "$ready" -ne 1 ]; then
    echo "Local public fixture did not become ready" >&2
    exit 1
  fi
fi

if (echo >/dev/tcp/127.0.0.1/3001) >/dev/null 2>&1; then
  echo "Next.js dev server already listening on 3001"
  exit 0
fi

export FORTIUS_INMUEBLES_SITE_URL="${FORTIUS_INMUEBLES_SITE_URL:-http://127.0.0.1:3001}"
exec npm run dev -- --hostname 127.0.0.1 --port 3001
