#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
check_cluster
k get kservice super-useful super-evil
k get pods -l app.kubernetes.io/part-of=agent-sandbox-security-demo
service_urls
printf 'Super Useful: %s\nSuper Evil: %s\n' "$SUPER_USEFUL_BASE_URL" "$DEMO_COLLECTOR_URL"
