#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/clean-cli.XXXXXX")"
git -c credential.helper= clone https://github.com/hsteude/weather-cli.git "$checkout/weather-cli"
git -C "$checkout/weather-cli" checkout "${CLI_REVISION:-bb034373ef0e1d495c962b4c4fd033c3bdd04c17}"
(
  cd "$checkout/weather-cli"
  npm ci
  npm test
)
node scripts/verify-distribution.js "$checkout/weather-cli"
node scripts/local-scenarios.js "$checkout/weather-cli/cli.js"
echo "Clean checkout retained at $checkout/weather-cli"
