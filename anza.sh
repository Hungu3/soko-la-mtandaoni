#!/usr/bin/env bash
# anza.sh — Soko la Mtandaoni (Mac / Linux)
# Jinsi ya kuendesha:  bash anza.sh   (au: chmod +x anza.sh && ./anza.sh)

set -e
cd "$(dirname "$0")"

echo "================================================"
echo "  SOKO LA MTANDAONI — Usakinishaji wa Mfumo"
echo "================================================"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js haijasakinishwa kwenye kompyuta hii."
  echo "Sakinisha kutoka https://nodejs.org (chagua toleo la 'LTS') kisha jaribu tena."
  echo "(Kwa Mac na 'Homebrew' uliyosakinishwa, unaweza pia kutumia: brew install node)"
  exit 1
fi
echo "Node.js ipo: $(node -v)"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "Faili ya .env imetengenezwa kutoka .env.example."
  echo "MUHIMU: Baadaye, fungua .env ubadilishe ADMIN_EMAIL, ADMIN_PASSWORD, na SESSION_SECRET"
  echo "kabla ya kuweka tovuti 'live'."
fi

echo ""
echo "==> Inasakinisha maktaba za mradi (npm install)..."
npm install

echo ""
echo "==> Inaandaa database na akaunti ya Admin (ikiwa bado haipo)..."
npm run seed

echo ""
echo "Tovuti itapatikana kwenye: http://localhost:3000"
echo "Paneli ya Admin:          http://localhost:3000/admin/ingia"
echo ""
echo "Bonyeza CTRL+C kusimamisha mfumo wakati wowote."
echo ""

npm start
