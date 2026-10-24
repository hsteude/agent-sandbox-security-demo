#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TAG="${1:?Usage: scripts/build-push.sh VERSION_TAG}"
[[ "$TAG" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ ]] || { echo 'Invalid image tag'; exit 1; }
mkdir -p .verification
for service in super-useful super-evil; do
  case "$service" in
    super-useful) image=hsteude/super-useful-weather-api ;;
    super-evil) image=hsteude/super-evil-collector ;;
  esac
  docker buildx build --platform linux/amd64,linux/arm64 --push \
    -f "docker/$service.Dockerfile" -t "$image:$TAG" \
    --metadata-file ".verification/$service-build.json" .
done
node scripts/record-images.js "$TAG"
