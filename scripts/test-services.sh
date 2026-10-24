#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
if [[ -z "${SUPER_USEFUL_BASE_URL:-}" || -z "${DEMO_COLLECTOR_URL:-}" ]]; then
  check_cluster
  service_urls
fi
node "$ROOT/scripts/verify-services.js"
