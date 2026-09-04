#!/usr/bin/env bash
# Extracts Playwright Chromium shared libs into ~/.local/playwright-libs when
# system packages cannot be installed (no sudo). Safe to re-run.
set -euo pipefail

DEST="${HOME}/.local/playwright-libs"
mkdir -p "$DEST"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$TMP"
PACKAGES=(
  libnspr4
  libnss3
  libatk-bridge2.0-0
  libcups2
  libdrm2
  libxkbcommon0
  libxcomposite1
  libxdamage1
  libxfixes3
  libxrandr2
  libgbm1
  libasound2
)

for pkg in "${PACKAGES[@]}"; do
  apt-get download "$pkg" >/dev/null 2>&1 || true
done

for deb in *.deb; do
  [ -f "$deb" ] || continue
  dpkg-deb -x "$deb" "$DEST"
done

echo "Playwright libs ready under $DEST"
