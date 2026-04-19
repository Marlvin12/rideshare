## Monitoring Stack (Prometheus, Grafana, Alertmanager, Node Exporter)

This document describes how to run a production-grade monitoring stack for the Node.js API and host using Prometheus, Grafana, Alertmanager, and Node Exporter.

---

## 1. Docker Compose Stack

Create `monitoring/docker-compose.monitoring.yml`:

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:v2.55.0
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus-data:/prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=15d
      - --web.enable-lifecycle
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:11.1.0
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    restart: unless-stopped
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    command:
      - --config.file=/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.8.1
    container_name: node-exporter
    restart: unless-stopped
    pid: "host"
    command:
      - --path.rootfs=/host
    volumes:
      - /:/host:ro,rslave
    ports:
      - "9100:9100"
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

Assumption: the Node API is running on the host at `http://localhost:3000`.

---

## 2. Prometheus Configuration (`prometheus.yml`)

Create `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets:
          - prometheus:9090

  - job_name: node-api
    metrics_path: /metrics
    static_configs:
      - targets:
          - host.docker.internal:3000

  - job_name: node-exporter
    static_configs:
      - targets:
          - node-exporter:9100
```

---

## 3. Prometheus Alert Rules (`alerts.yml`)

Create `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: ApiDown
        expr: up{job="node-api"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "Prometheus target for the Node.js API (job=\"node-api\") has been down for more than 2 minutes."

      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{job="node-api",status_code=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="node-api"}[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High 5xx error rate on API"
          description: "More than 5% of HTTP requests to the Node.js API are returning 5xx over the last 5 minutes."

      - alert: HighRequestLatency
        expr: |
          histogram_quantile(
            0.95,
            sum(rate(http_request_duration_seconds_bucket{job="node-api"}[5m])) by (le)
          ) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High API latency (p95 > 500ms)"
          description: "95th percentile request latency on the Node.js API is above 500ms for 10 minutes."
```

---

## 4. Alertmanager Configuration (`alertmanager.yml`)

Create `monitoring/alertmanager/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: dev-null
  group_by: ["alertname", "job"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h

receivers:
  - name: dev-null
```

Replace the `dev-null` receiver later with email/Slack/webhook receivers for production alerting.

---

## 5. Express + prom-client Instrumentation Example

Minimal example of instrumenting an Express app with `prom-client` to expose `/metrics`, track default system metrics (CPU, RAM, process), and custom HTTP request counts:

```javascript
import express from 'express';
import client from 'prom-client';

const app = express();
const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const normalizeRoute = url => {
  if (!url) return 'unknown';
  return url
    .split('?')[0]
    .replace(/\/[a-f0-9]{24}/g, '/:id')
    .replace(/\/[0-9]+/g, '/:num');
};

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = normalizeRoute(req.originalUrl);
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  process.stdout.write(`Server listening on ${port}\n`);
});
```

In the existing backend, equivalent logic is implemented in `server/middleware/metrics.js` and mounted in `server/app.js`.

---

## 6. How to Run and Validate

1. Start the API (from `server/`):

   ```bash
   npm install
   npm run start
   ```

2. Start the monitoring stack (from `monitoring/`):

   ```bash
   docker compose -f docker-compose.monitoring.yml up -d
   ```

3. Quick checks:

   - API metrics:

     ```bash
     curl http://localhost:3000/metrics | head
     ```

   - Prometheus targets: open `http://localhost:9090/targets` and verify `node-api`, `node-exporter`, and `prometheus` are `UP`.
   - Grafana: open `http://localhost:3001`, log in with `admin` / `admin`, add Prometheus datasource `http://prometheus:9090`, and query API metrics.
   - Alertmanager: open `http://localhost:9093` to see firing/active alerts.

