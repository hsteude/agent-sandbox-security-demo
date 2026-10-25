import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const { images } = JSON.parse(readFileSync(new URL('../images.json', import.meta.url)));
mkdirSync(new URL('../manifests/', import.meta.url), { recursive: true });
for (const name of ['super-useful', 'super-evil']) {
  if (!/^docker\.io\/hsteude\/[a-z-]+@sha256:[a-f0-9]{64}$/.test(images[name])) throw new Error('Immutable image required');
  const service = {
    apiVersion: 'serving.knative.dev/v1', kind: 'Service',
    metadata: { name, namespace: 'henrik', labels: { 'app.kubernetes.io/part-of': 'agent-sandbox-security-demo' } },
    spec: { template: {
      metadata: { labels: { 'app.kubernetes.io/part-of': 'agent-sandbox-security-demo' }, annotations: {
        'autoscaling.knative.dev/min-scale': '1', 'autoscaling.knative.dev/max-scale': '2'
      } },
      spec: { containerConcurrency: 20, timeoutSeconds: 10, automountServiceAccountToken: false,
        containers: [{ name: 'user-container', image: images[name], ports: [{ containerPort: 8080 }],
          resources: { requests: { cpu: '50m', memory: '64Mi' }, limits: { cpu: '500m', memory: '128Mi' } },
          securityContext: { runAsNonRoot: true, runAsUser: 1000, allowPrivilegeEscalation: false,
            readOnlyRootFilesystem: true, capabilities: { drop: ['ALL'] }, seccompProfile: { type: 'RuntimeDefault' } },
          readinessProbe: { httpGet: { path: '/healthz' }, periodSeconds: 5 },
          livenessProbe: { httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 10 }
        }]
      }
    } }
  };
  // JSON is valid YAML and accepted directly by kubectl; no templating dependency.
  writeFileSync(new URL(`../manifests/${name}.json`, import.meta.url), JSON.stringify(service, null, 2) + '\n');
}
