#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/anonymous.XXXXXX")"
# No host credentials, Git config or npm cache are mounted. Files remain inside this project.
docker run --rm --mount "type=bind,src=$checkout,dst=/verification" --workdir /verification \
  node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 \
  sh -c 'apk add --no-cache git >/dev/null &&
    git clone https://github.com/hsteude/weather-cli.git weather-cli &&
    cd weather-cli && git checkout bb034373ef0e1d495c962b4c4fd033c3bdd04c17 &&
    npm ci && npm test && npm install && git diff --exit-code package-lock.json'
