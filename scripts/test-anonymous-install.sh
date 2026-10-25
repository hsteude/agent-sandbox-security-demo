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
    cd weather-cli && git checkout 22f48278ef0272fe2f90b1ec2cfd574f778f111f &&
    npm ci && npm test && npm install && git diff --exit-code package-lock.json'
