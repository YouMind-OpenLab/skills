#!/bin/bash
set -euo pipefail

# CI script: detect changed skills and publish to ClawHub.
# Called by .github/workflows/publish-skills.yml after merge to main.
#
# Version source: SKILL.md frontmatter `version:` field.
# If version is missing, the skill is skipped with a warning.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Get list of changed files between HEAD~1 and HEAD
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# Extract unique skill directories that changed
CHANGED_SKILLS=()
while IFS= read -r file; do
  if [[ "$file" =~ ^skills/([^/]+)/ ]]; then
    skill="${BASH_REMATCH[1]}"
    # Deduplicate
    if [[ ! " ${CHANGED_SKILLS[*]:-} " =~ " ${skill} " ]]; then
      CHANGED_SKILLS+=("$skill")
    fi
  fi
done <<< "$CHANGED_FILES"

if [ ${#CHANGED_SKILLS[@]} -eq 0 ]; then
  echo "No skill directories changed. Nothing to publish."
  exit 0
fi

echo "Changed skills: ${CHANGED_SKILLS[*]}"
echo ""

PUBLISHED=0
FAILED=0
SKIPPED=0

for skill in "${CHANGED_SKILLS[@]}"; do
  SKILL_DIR="$REPO_DIR/skills/$skill"
  SKILL_MD="$SKILL_DIR/SKILL.md"

  echo "━━━ Processing: $skill ━━━"

  # Check SKILL.md exists
  if [ ! -f "$SKILL_MD" ]; then
    echo "  ⚠️  SKILL.md not found, skipping"
    ((SKIPPED++))
    echo ""
    continue
  fi

  # Extract version from SKILL.md frontmatter
  VERSION=$(awk '/^---$/{n++; next} n==1 && /^version:/{gsub(/^version:[ \t]*["'"'"']?|["'"'"']?[ \t]*$/,""); print; exit}' "$SKILL_MD")

  if [ -z "$VERSION" ]; then
    echo "  ⚠️  No version: field in SKILL.md frontmatter, skipping"
    echo "  → Add 'version: x.y.z' to the SKILL.md frontmatter to enable auto-publish"
    ((SKIPPED++))
    echo ""
    continue
  fi

  # Extract display name from SKILL.md frontmatter
  DISPLAY_NAME=$(awk '/^---$/{n++; next} n==1 && /^name:/{gsub(/^name:[ \t]*/,""); print; exit}' "$SKILL_MD")
  if [ -z "$DISPLAY_NAME" ]; then
    DISPLAY_NAME="$skill"
  fi

  # Extract changelog from the merge commit message (fallback to generic)
  CHANGELOG=$(git log -1 --pretty=%B | head -1)

  # Build a clean publish directory (exclude dev/large files)
  TMP_DIR=$(mktemp -d)
  trap "rm -rf $TMP_DIR" EXIT

  # Copy files, respecting .clawhubignore
  IGNORE_FILE="$SKILL_DIR/.clawhubignore"
  
  # Build rsync exclude args from .clawhubignore
  RSYNC_EXCLUDES="--exclude=node_modules --exclude=.git --exclude=__pycache__"
  if [ -f "$IGNORE_FILE" ]; then
    while IFS= read -r pattern || [ -n "$pattern" ]; do
      # Skip empty lines and comments
      [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
      RSYNC_EXCLUDES="$RSYNC_EXCLUDES --exclude=$pattern"
    done < "$IGNORE_FILE"
  fi

  eval rsync -a $RSYNC_EXCLUDES "$SKILL_DIR/" "$TMP_DIR/"

  # Calculate publish size
  PUBLISH_SIZE=$(du -sh "$TMP_DIR" | cut -f1)
  echo "  📦 Publish package: $PUBLISH_SIZE"

  # Check size limit (ClawHub max 20 MB)
  SIZE_BYTES=$(du -sb "$TMP_DIR" | cut -f1)
  if [ "$SIZE_BYTES" -gt 20971520 ]; then
    echo "  ❌ Package exceeds 20 MB ClawHub limit ($PUBLISH_SIZE). Fix .clawhubignore."
    ((FAILED++))
    echo ""
    continue
  fi

  echo "  Publishing $skill v$VERSION..."
  if clawhub publish "$TMP_DIR" \
    --slug "$skill" \
    --name "$DISPLAY_NAME" \
    --version "$VERSION" \
    --changelog "$CHANGELOG" 2>&1; then
    echo "  ✅ Published $skill v$VERSION"
    ((PUBLISHED++))
  else
    echo "  ❌ Failed to publish $skill"
    ((FAILED++))
  fi

  rm -rf "$TMP_DIR"
  trap - EXIT
  echo ""
done

echo "━━━ Summary ━━━"
echo "Published: $PUBLISHED | Skipped: $SKIPPED | Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
