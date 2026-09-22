#!/usr/bin/env sh
set -eu

# Build extension release archive. Runnable from any directory.
# Usage:
#   sh build-release.sh [output_zip]

cd "$(dirname "$0")"

OUTPUT_FILE="${1:-release.zip}"

# Ensure full replacement instead of in-place archive update.
if [ -f "$OUTPUT_FILE" ]; then
  rm -f "$OUTPUT_FILE"
fi

# Explicit allowlist of files and directories to avoid packaging unrelated files.
RELEASE_ITEMS="
manifest.json
newtab.html
popup.html
css
js
icons
"

set --
for item in $RELEASE_ITEMS; do
  if [ ! -e "$item" ]; then
    echo "Error: required release item not found: $item" >&2
    exit 1
  fi
  set -- "$@" "$item"
done

if command -v 7z >/dev/null 2>&1 && 7z -version >/dev/null 2>&1; then
  7z a "$OUTPUT_FILE" "$@"
elif command -v zip >/dev/null 2>&1; then
  zip -rq "$OUTPUT_FILE" "$@"
elif command -v python3 >/dev/null 2>&1; then
  python3 -c '
import sys, os, zipfile

output_file = sys.argv[1]
items = sys.argv[2:]

with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as zf:
    for item in items:
        if os.path.isdir(item):
            for root, _, files in os.walk(item):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, ".")
                    zf.write(full_path, arcname)
        else:
            zf.write(item, item)
' "$OUTPUT_FILE" "$@"
else
  echo "Error: neither '7z', 'zip', nor 'python3' is available in PATH." >&2
  exit 1
fi

echo "Release archive created: $OUTPUT_FILE"
