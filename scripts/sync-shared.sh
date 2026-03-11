#!/bin/bash
set -euo pipefail

# Sync shared/ → each skill's references/
# Called automatically by pre-commit hook. Also safe to run manually.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$REPO_DIR/shared"

# Files to sync (all .md files in shared/ except PUBLISHING.md which is repo-level only)
SYNC_FILES=("setup.md" "environment.md" "error-handling.md")

changed=0

for skill_dir in "$REPO_DIR"/skills/youmind-*/; do
  [ -d "$skill_dir" ] || continue
  refs_dir="$skill_dir/references"
  mkdir -p "$refs_dir"

  for file in "${SYNC_FILES[@]}"; do
    src="$SHARED_DIR/$file"
    dst="$refs_dir/$file"
    [ -f "$src" ] || continue

    if [ ! -f "$dst" ] || ! cmp -s "$src" "$dst"; then
      cp "$src" "$dst"
      git add "$dst" 2>/dev/null || true
      changed=1
    fi
  done
done

if [ $changed -eq 1 ]; then
  echo "sync-shared: synced shared references to skill directories"
fi
