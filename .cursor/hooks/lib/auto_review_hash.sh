#!/usr/bin/env bash
# Emit SHA-256 of dirty-tree *content* (status + diffs + untracked blobs).
# Status-only hashes miss edits that keep the same path set after a fix pass.
set -euo pipefail
ROOT="${1:?repo root required}"
{
  git -C "$ROOT" status --porcelain
  printf '\n---DIFF---\n'
  git -C "$ROOT" diff HEAD
  printf '\n---UNTRACKED---\n'
  # Blob hashes change when file contents change; paths alone are not enough.
  # --stdin-paths is newline-separated (no -z on older Git).
  git -C "$ROOT" ls-files --others --exclude-standard \
    | git -C "$ROOT" hash-object --stdin-paths
} | shasum -a 256 | awk '{print $1}'
