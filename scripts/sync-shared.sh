#!/bin/bash
set -euo pipefail

# Sync shared references into each skill's references/ directory
# Run after editing files in shared/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$REPO_DIR/shared"
SHARED_FILES=("setup.md" "environment.md")

for skill_dir in "$REPO_DIR"/skills/youmind-*/; do
  [ -d "$skill_dir" ] || continue
  skill_name=$(basename "$skill_dir")
  refs_dir="$skill_dir/references"
  mkdir -p "$refs_dir"

  for file in "${SHARED_FILES[@]}"; do
    if [ -f "$SHARED_DIR/$file" ]; then
      cp "$SHARED_DIR/$file" "$refs_dir/$file"
      echo "  ✓ $skill_name/references/$file"
    fi
  done
done

echo "Done."
