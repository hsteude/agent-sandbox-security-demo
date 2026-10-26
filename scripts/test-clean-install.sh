#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/clean-cli.XXXXXX")"
git -c credential.helper= clone https://github.com/hsteude/weather-cli.git "$checkout/weather-cli"
git -C "$checkout/weather-cli" checkout "${CLI_REVISION:-a9fee8888e17ec8d20ce9b745d432b5a07c57a2c}"
(
  cd "$checkout/weather-cli"
  npm ci
  npm test
)
node scripts/verify-distribution.js "$checkout/weather-cli"
if [[ -n "${PLATFORM_ROUTE_API_KEY:-}" ]]; then
  node scripts/local-scenarios.js "$checkout/weather-cli/cli.js"
else
  echo 'SKIP: three-scenario integration requires PLATFORM_ROUTE_API_KEY in the operator environment.'
fi
echo "Clean checkout retained at $checkout/weather-cli"
