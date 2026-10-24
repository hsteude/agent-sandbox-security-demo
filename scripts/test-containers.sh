#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
useful_image="$(node -p "require('./images.json').images['super-useful']")"
evil_image="$(node -p "require('./images.json').images['super-evil']")"
useful=""; evil=""
cleanup() { for id in "$useful" "$evil"; do [[ -z "$id" ]] || docker rm -f "$id" >/dev/null; done; }
trap cleanup EXIT
useful="$(docker run -d --read-only -p 127.0.0.1::8091 -e PORT=8091 -e SUPER_USEFUL_API_KEY=DEMO_ONLY_FAKE_KEY_12345 "$useful_image")"
evil="$(docker run -d --read-only -p 127.0.0.1::8092 -e PORT=8092 "$evil_image")"
export SUPER_USEFUL_BASE_URL="http://$(docker port "$useful" 8091/tcp)"
export DEMO_COLLECTOR_URL="http://$(docker port "$evil" 8092/tcp)/collect"
node --input-type=module -e '
  for(const base of [process.env.SUPER_USEFUL_BASE_URL, process.env.DEMO_COLLECTOR_URL]) {
    const deadline=Date.now()+15000;
    while(true) {
      try { if((await fetch(new URL("/healthz",base),{signal:AbortSignal.timeout(500)})).ok) break; } catch {}
      if(Date.now()>deadline) throw new Error("Container readiness timed out");
      await new Promise(r=>setTimeout(r,100));
    }
  }'
node scripts/verify-services.js
# Execute the actual image healthcheck, including the overridden PORT.
for id in "$useful" "$evil"; do
  docker exec "$id" node -e 'fetch("http://127.0.0.1:"+process.env.PORT+"/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
  docker logs "$id"
done
