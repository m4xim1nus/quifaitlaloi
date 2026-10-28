#!/usr/bin/env bash
# Build exécuté par Cloudflare Pages à chaque push sur main : construit le site statique dans
# site/build/ à partir de l'instantané versionné (data/qfl.sqlite, data/export/). Aucun dump
# n'est téléchargé ici : les données se régénèrent en local (`uv run qfl download && uv run qfl
# build`), puis se commitent (CLAUDE.md, décisions de cadrage). Reproductible : `bash build.sh`.
set -euo pipefail
cd "$(dirname "$0")"
node --version

test -f data/qfl.sqlite && test -f data/export/lois.csv && test -f data/export/meta.json

echo "== Site"
cd site
npm ci --no-audit --no-fund
npm run build
echo "Fichiers dans site/build/ : $(find build -type f | wc -l)"
test -f build/index.html && test -f build/404.html && test -f build/_headers
test -f build/donnees/qfl.sqlite
