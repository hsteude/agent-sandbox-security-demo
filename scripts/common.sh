#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/hen-common-leedsichthys.config}"
NAMESPACE=henrik
k() { kubectl --kubeconfig "$KUBECONFIG" --namespace "$NAMESPACE" --request-timeout=10s "$@"; }
check_cluster() {
  [[ -f "$KUBECONFIG" ]] || { echo "Kubeconfig not found: $KUBECONFIG" >&2; exit 1; }
  if ! k get --raw=/readyz >/dev/null 2>&1; then
    echo 'Cluster unavailable. Images and manifests are ready; deployment is pending. Retry ./scripts/deploy.sh when online.' >&2
    exit 1
  fi
}
service_urls() {
  SUPER_USEFUL_BASE_URL="${SUPER_USEFUL_BASE_URL:-$(k get kservice super-useful -o jsonpath='{.status.url}')}"
  DEMO_COLLECTOR_URL="${DEMO_COLLECTOR_URL:-$(k get kservice super-evil -o jsonpath='{.status.url}')/collect}"
  export SUPER_USEFUL_BASE_URL DEMO_COLLECTOR_URL
  [[ -n "$SUPER_USEFUL_BASE_URL" && "$DEMO_COLLECTOR_URL" != /collect ]] || { echo 'Service URLs not ready' >&2; exit 1; }
}
