import { readFileSync, writeFileSync } from 'node:fs';
const images = {};
for (const [service, image] of [['super-useful', 'hsteude/super-useful-weather-api'], ['super-evil', 'hsteude/super-evil-collector']]) {
  const digest = JSON.parse(readFileSync(`.verification/${service}-build.json`))['containerimage.digest'];
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Missing valid image digest');
  images[service] = `docker.io/${image}@${digest}`;
}
writeFileSync('images.json', JSON.stringify({ tag: process.argv[2], platforms: ['linux/amd64', 'linux/arm64'], images }, null, 2) + '\n');
console.log(JSON.stringify(images, null, 2));
