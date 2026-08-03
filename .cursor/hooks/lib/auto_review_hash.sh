#!/usr/bin/env bash
# Emit SHA-256 of review-relevant dirty content (not the whole working tree).
# Scoped to the same FUNC paths as stop-auto-review.sh so heavy refs/docs
# (e.g. REFERENCIA/) do not inflate or stall every stop hook.
# Status-only hashes miss edits that keep the same path set after a fix pass.
set -euo pipefail
ROOT="${1:?repo root required}"

# Paths that trigger Bugbot / security review (keep in sync with stop-auto-review.sh).
is_func_path() {
  local path="$1"
  case "$path" in
    *.env*|*credentials*|*secrets*|.cursor/mcp.local.json) return 0 ;;
    src/*|index.html|package.json|vite.config.ts|Makefile|scripts/*|.cursor/hooks/*|.cursor/mcp.json|.cursor/hooks.json)
      return 0
      ;;
    *) return 1 ;;
  esac
}

collect_func_paths() {
  local line path
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    path="${line:3}"
    path="${path%% -> *}"
    if [[ "$line" == *" -> "* ]]; then
      path="${line#* -> }"
    fi
    # Strip optional quotes from porcelain paths with spaces.
    path="${path#\"}"
    path="${path%\"}"
    if is_func_path "$path"; then
      printf '%s\n' "$path"
    fi
  done < <(git -C "$ROOT" status --porcelain 2>/dev/null || true)
}

{
  # Avoid format strings that start with "-": macOS printf treats them as flags.
  printf '%s\n' '---STATUS---'
  collect_func_paths | sort -u

  printf '%s\n' '---DIFF---'
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    git -C "$ROOT" diff HEAD -- "$path" 2>/dev/null || true
  done < <(collect_func_paths | sort -u)

  printf '%s\n' '---UNTRACKED---'
  # Blob hashes for untracked FUNC files (newline paths; no -z on older Git).
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    is_func_path "$path" || continue
    printf '%s ' "$path"
    git -C "$ROOT" hash-object -- "$path"
  done < <(git -C "$ROOT" ls-files --others --exclude-standard 2>/dev/null || true)
} | shasum -a 256 | awk '{print $1}'

