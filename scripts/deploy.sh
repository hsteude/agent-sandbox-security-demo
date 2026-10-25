#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
check_cluster
k get namespace "$NAMESPACE" >/dev/null || { echo 'Namespace henrik must already exist.' >&2; exit 1; }
k get crd services.serving.knative.dev >/dev/null || { echo 'Knative Serving is required.' >&2; exit 1; }
cd "$ROOT"
node scripts/render-manifests.js
while IFS= read -r image; do docker buildx imagetools inspect "$image" >/dev/null; done < <(
  node -e "for(const image of Object.values(require('./images.json').images)) console.log(image)"
)
# Avoid overwriting any similarly named resource belonging to someone else.
for resource in kservice/super-useful kservice/super-evil; do
  existing="$(k get "$resource" --ignore-not-found -o json)"
  if [[ -n "$existing" ]]; then
    printf '%s' "$existing" | node -e '
      let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
        if(JSON.parse(s).metadata.labels?.["app.kubernetes.io/part-of"]!=="agent-sandbox-security-demo") {
          console.error("Resource exists without demo ownership label; refusing overwrite"); process.exit(1);
        }
      });'
  fi
done
k apply -f manifests/super-useful.json -f manifests/super-evil.json
k wait --for=condition=Ready kservice/super-useful kservice/super-evil --timeout=180s
service_urls
printf 'Super Useful: %s\nSuper Evil: %s\n' "$SUPER_USEFUL_BASE_URL" "$DEMO_COLLECTOR_URL"
echo 'Logs: ./scripts/logs.sh useful  |  ./scripts/logs.sh evil'
if ! ./scripts/test-services-in-cluster.sh; then
  echo 'Resources applied, but internal endpoint verification failed. Check routing and pods/exec permission.' >&2
  exit 1
fi
echo 'External route authentication: set PLATFORM_ROUTE_API_KEY, then run node scripts/verify-platform-route.js'
