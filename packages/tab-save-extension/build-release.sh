#!/usr/bin/env sh
set -eu

# Build extension release archive from project root.
# Usage:
#   sh build-release.sh [output_zip]

OUTPUT_FILE="${1:-release.zip}"

# Ensure full replacement instead of in-place archive update.
if [ -f "$OUTPUT_FILE" ]; then
  rm -f "$OUTPUT_FILE"
fi

# Explicit allowlist to avoid packaging unrelated files.
RELEASE_FILES="
manifest.json
background.js
popup.html
popup.js
options.html
options.js
de.css
icon128.png
content.png
LICENSE
"

set --
for file in $RELEASE_FILES; do
  if [ ! -f "$file" ]; then
    echo "Error: required release file not found: $file" >&2
    exit 1
  fi
  set -- "$@" "$file"
done

if command -v 7z >/dev/null 2>&1; then
  7z a "$OUTPUT_FILE" "$@"
elif command -v zip >/dev/null 2>&1; then
  zip -q "$OUTPUT_FILE" "$@"
else
  echo "Error: neither '7z' nor 'zip' command is available in PATH." >&2
  exit 1
fi

echo "Release archive created: $OUTPUT_FILE"
