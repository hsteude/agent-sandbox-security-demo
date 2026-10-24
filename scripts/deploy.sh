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
for resource in secret/weather-demo-api-key kservice/super-useful kservice/super-evil; do
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
k create secret generic weather-demo-api-key --from-literal=api-key=DEMO_ONLY_FAKE_KEY_12345 --dry-run=client -o json |
  node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const o=JSON.parse(s);o.metadata.labels={"app.kubernetes.io/part-of":"agent-sandbox-security-demo"};console.log(JSON.stringify(o));});' |
  k apply -f -
k apply -f manifests/super-useful.json -f manifests/super-evil.json
k wait --for=condition=Ready kservice/super-useful kservice/super-evil --timeout=180s
service_urls
printf 'Super Useful: %s\nSuper Evil: %s\n' "$SUPER_USEFUL_BASE_URL" "$DEMO_COLLECTOR_URL"
echo 'Logs: ./scripts/logs.sh useful  |  ./scripts/logs.sh evil'
if ! node scripts/verify-services.js; then
  echo 'Resources applied, but endpoint verification failed. Check DNS/routing from this machine; run tests from a reachable network.' >&2
  exit 1
fi
