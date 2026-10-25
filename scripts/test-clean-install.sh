#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verification
checkout="$(mktemp -d "$PWD/.verification/clean-cli.XXXXXX")"
git -c credential.helper= clone https://github.com/hsteude/weather-cli.git "$checkout/weather-cli"
git -C "$checkout/weather-cli" checkout "${CLI_REVISION:-22f48278ef0272fe2f90b1ec2cfd574f778f111f}"
(
  cd "$checkout/weather-cli"
  npm ci
  npm test
)
node scripts/verify-distribution.js "$checkout/weather-cli"
node scripts/local-scenarios.js "$checkout/weather-cli/cli.js"
echo "Clean checkout retained at $checkout/weather-cli"
