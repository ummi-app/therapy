#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
lock_path="${repo_root}/ops/.hourly.lock"
owner_prefix="${repo_root}/ops/.hourly.lock.owner"

usage() {
  echo "usage: $0 acquire|release|recover|status <run-id>" >&2
  exit 2
}

metadata_for_current_lock() {
  [[ -L "${lock_path}" ]] || return 1
  owner_target="$(readlink "${lock_path}")"
  [[ "${owner_target}" != */* && "${owner_target}" == .hourly.lock.owner.* ]] || return 1
  current_owner_dir="${repo_root}/ops/${owner_target}"
  current_metadata_file="${current_owner_dir}/metadata"
  [[ -f "${current_metadata_file}" ]] || return 1
}

clear_owned_lock() {
  rm "${lock_path}"
  rm "${current_metadata_file}"
  rmdir "${current_owner_dir}"
}

action="${1:-}"
run_id="${2:-}"

case "${action}" in
  acquire)
    [[ -n "${run_id}" ]] || usage
    candidate_dir="$(mktemp -d "${owner_prefix}.XXXXXX")"
    candidate_metadata="${candidate_dir}/metadata"
    candidate_name="$(basename "${candidate_dir}")"
    cleanup_candidate() {
      if [[ -L "${lock_path}" && "$(readlink "${lock_path}")" == "${candidate_name}" ]]; then
        return
      fi
      if [[ -d "${candidate_dir}" ]]; then
        rm -f "${candidate_metadata}"
        rmdir "${candidate_dir}" 2>/dev/null || true
      fi
    }
    trap cleanup_candidate EXIT
    {
      echo "run_id=${run_id}"
      echo "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    } >"${candidate_metadata}"
    if ! ln -s -h "${candidate_name}" "${lock_path}" 2>/dev/null; then
      echo "locked" >&2
      exit 3
    fi
    trap - EXIT
    echo "acquired"
    ;;
  release)
    [[ -n "${run_id}" ]] || usage
    metadata_for_current_lock || {
      echo "no-or-invalid-lock" >&2
      exit 4
    }
    stored_run_id="$(sed -n 's/^run_id=//p' "${current_metadata_file}")"
    [[ "${stored_run_id}" == "${run_id}" ]] || {
      echo "lock-owned-by:${stored_run_id}" >&2
      exit 5
    }
    clear_owned_lock
    echo "released"
    ;;
  recover)
    [[ -n "${run_id}" ]] || usage
    [[ "${UMMI_LOCK_OWNER_INACTIVE_CONFIRMED:-}" == "yes" ]] || {
      echo "owner-liveness-not-confirmed" >&2
      exit 6
    }
    metadata_for_current_lock || {
      echo "no-or-invalid-lock" >&2
      exit 4
    }
    stored_run_id="$(sed -n 's/^run_id=//p' "${current_metadata_file}")"
    [[ "${stored_run_id}" == "${run_id}" ]] || {
      echo "lock-owned-by:${stored_run_id}" >&2
      exit 5
    }
    clear_owned_lock
    echo "recovered"
    ;;
  status)
    if metadata_for_current_lock; then
      cat "${current_metadata_file}"
    elif [[ -e "${lock_path}" || -L "${lock_path}" ]]; then
      echo "invalid-lock" >&2
      exit 4
    else
      echo "unlocked"
    fi
    ;;
  *)
    usage
    ;;
esac
