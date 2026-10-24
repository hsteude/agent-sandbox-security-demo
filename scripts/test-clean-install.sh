#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/clean-cli.XXXXXX")"
git -c credential.helper= clone https://github.com/hsteude/weather-cli.git "$checkout/weather-cli"
git -C "$checkout/weather-cli" checkout "${CLI_REVISION:-857a11f583747fc37d1a19265f7499e8de5223c5}"
(
  cd "$checkout/weather-cli"
  npm ci
  npm test
)
node scripts/local-scenarios.js "$checkout/weather-cli/cli.js"
echo "Clean checkout retained at $checkout/weather-cli"
