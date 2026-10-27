#!/usr/bin/env bash
# ==============================================================================
# Drishti Logo Generation Pipeline
# Prepares transparent PNG assets, trims padding, and exports all required sizes.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_ROOT/frontend/public"

cd "$PROJECT_ROOT"

echo "==> Running Drishti Logo Generation Pipeline..."

# Step 1: Execute Python asset generator for feathered alpha cutout & multi-size exports
python3 "$SCRIPT_DIR/generate_logo_assets.py"

# ImageMagick fallback commands for manual reproduction:
# 1. Background cutout (feathered alpha):
#    convert frontend/public/logo-source.png -fuzz 10% -fill none -draw "matte 0,0 floodfill" frontend/public/logo-cutout.png
#
# 2. Trim and 4% border:
#    convert frontend/public/logo-cutout.png -trim +repage -bordercolor none -border 4% frontend/public/logo.png
#
# 3. Square exports:
#    convert frontend/public/logo.png -resize 512x512 -gravity center -background none -extent 512x512 frontend/public/logo-512.png
#    convert frontend/public/logo.png -resize 256x256 -gravity center -background none -extent 256x256 frontend/public/logo-256.png
#    convert frontend/public/logo.png -resize 128x128 -gravity center -background none -extent 128x128 frontend/public/logo-128.png
#    convert frontend/public/logo.png -resize 192x192 -gravity center -background none -extent 192x192 frontend/public/logo-192.png

echo "==> Logo assets successfully generated in $PUBLIC_DIR"
