#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
check_cluster
# Run the existing HTTP checks inside a running demo container; create no test workload.
# Requires pods/exec permission. This checks service routing, not sandbox isolation.
pod="$(k get pods -l serving.knative.dev/service=super-useful --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')"
[[ -n "$pod" ]] || { echo 'No running Super Useful pod found' >&2; exit 1; }
k exec -i "$pod" -c user-container -- env \
  SUPER_USEFUL_BASE_URL=http://super-useful.henrik.svc.cluster.local \
  DEMO_COLLECTOR_URL=http://super-evil.henrik.svc.cluster.local/collect \
  node --input-type=module < "$ROOT/scripts/verify-services.js"
