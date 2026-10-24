#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
case "${1:-}" in
  useful) service=super-useful ;;
  evil) service=super-evil ;;
  *) echo 'Usage: ./scripts/logs.sh useful|evil'; exit 1 ;;
esac
check_cluster
exec kubectl --kubeconfig "$KUBECONFIG" -n "$NAMESPACE" logs -f \
  -l "serving.knative.dev/service=$service" -c user-container \
  --since=5m --tail=40 --prefix --max-log-requests=20
