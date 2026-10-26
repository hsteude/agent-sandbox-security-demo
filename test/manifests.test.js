import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
test('deployment uses immutable images, bounded resources and correct namespace', () => {
  const { images } = JSON.parse(readFileSync(new URL('images.json', root)));
  for (const name of ['super-useful', 'super-evil']) {
    const manifest = JSON.parse(readFileSync(new URL(`manifests/${name}.json`, root)));
    assert.equal(manifest.metadata.namespace, 'henrik');
    assert.equal(manifest.metadata.name, name);
    assert.equal(manifest.apiVersion, 'serving.knative.dev/v1');
    const template = manifest.spec.template;
    assert.equal(template.metadata.annotations['autoscaling.knative.dev/min-scale'], '1');
    const container = template.spec.containers[0];
    assert.match(container.image, /^docker\.io\/hsteude\/.+@sha256:[a-f0-9]{64}$/);
    assert.equal(container.image, images[name]);
    assert.ok(container.resources.requests.memory);
    assert.ok(container.resources.limits.memory);
    assert.equal(container.readinessProbe.httpGet.path, '/healthz');
    if (name === 'super-useful') assert.equal(container.env, undefined);
    if (name === 'super-evil') assert.deepEqual(container.env, [{ name: 'DEMO_ALLOWED_KEY_SHA256',
      value: JSON.parse(readFileSync(new URL('demo-config.json', root))).allowedKeySha256 }]);
  }
});
