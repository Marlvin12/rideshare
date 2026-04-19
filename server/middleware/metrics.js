import client from 'prom-client';

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

const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

const normalizeRoute = (url) => {
  if (!url) return 'unknown';
  return url
    .split('?')[0]
    .replace(/\/[a-f0-9]{24}/g, '/:id')
    .replace(/\/[0-9]+/g, '/:num');
};

export const metricsMiddleware = (req, res, next) => {
  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    activeConnections.dec();
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
};

export const metricsEndpoint = async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { register };
