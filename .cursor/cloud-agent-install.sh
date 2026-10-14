#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24
NODE24="$(dirname "$(nvm which 24)")"
export PATH="$NODE24:$PATH"
hash -r
sudo ln -sfn "$NODE24/node" /usr/local/bin/node
sudo ln -sfn "$NODE24/npm" /usr/local/bin/npm
sudo ln -sfn "$NODE24/npx" /usr/local/bin/npx

cd /workspace
npm ci
npx playwright install --with-deps chromium

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
