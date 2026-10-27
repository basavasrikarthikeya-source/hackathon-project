#!/usr/bin/env bash
set -euo pipefail

# Ensure magick command is accessible (supports both IM7 magick and IM6 convert)
export PATH="/home/cavalrier/.local/bin:/tmp/bin:$PATH"
if ! command -v magick >/dev/null 2>&1; then
  if command -v convert >/dev/null 2>&1; then
    magick() { convert "$@"; }
  else
    echo "Error: ImageMagick (magick or convert) not found." >&2
    exit 1
  fi
fi

# Locate project roots
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BG_DIR="$PROJECT_ROOT/frontend/public/backgrounds"

mkdir -p "$BG_DIR"
cd "$BG_DIR"

if [ ! -f "nebula-source.jpg" ]; then
  echo "Error: nebula-source.jpg not found in $BG_DIR" >&2
  exit 1
fi

echo "Generating optimised nebula background assets..."

magick nebula-source.jpg -resize 2880x -quality 84 nebula-2880.avif
magick nebula-source.jpg -resize 2880x -quality 86 nebula-2880.webp
magick nebula-source.jpg -resize 1920x -quality 86 nebula-1920.webp
magick nebula-source.jpg -resize 1280x -quality 84 nebula-1280.webp
magick nebula-source.jpg -resize 2880x -quality 90 nebula-2880.jpg
magick nebula-source.jpg -resize 32x -quality 60 nebula-lqip.jpg

echo "Nebula assets generated successfully in $BG_DIR:"
ls -lh nebula-*
