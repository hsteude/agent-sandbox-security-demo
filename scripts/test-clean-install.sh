#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/clean-cli.XXXXXX")"
git -c credential.helper= clone https://github.com/hsteude/weather-cli.git "$checkout/weather-cli"
git -C "$checkout/weather-cli" checkout "${CLI_REVISION:-2f6ab5e0ad24634950d9c7d07b149c67e252cb24}"
(
  cd "$checkout/weather-cli"
  npm ci
  npm test
)
node scripts/local-scenarios.js "$checkout/weather-cli/cli.js"
echo "Clean checkout retained at $checkout/weather-cli"
