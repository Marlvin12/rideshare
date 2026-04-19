/* eslint-disable */
// k6 load test -- run with: k6 run server/tests/load/k6-load-test.js
//
// Install k6: https://k6.io/docs/getting-started/installation/
//
// Environment variables:
//   K6_BASE_URL  -- server URL (default http://localhost:3000)
//   K6_AUTH_TOKEN -- valid JWT for authenticated endpoints

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || '';

const errorRate = new Rate('errors');
const healthLatency = new Trend('health_latency');
const restaurantsLatency = new Trend('restaurants_latency');
const authLatency = new Trend('auth_latency');

// --- Scenario configuration ---
// Ramps to ~80k concurrent virtual users to validate capacity target.
// Adjust for your hardware; start smaller and scale up.
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 10000 },
        { duration: '5m', target: 10000 },
        { duration: '2m', target: 0 },
      ],
      startTime: '35s',
      tags: { scenario: 'load' },
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20000 },
        { duration: '5m', target: 80000 },
        { duration: '5m', target: 80000 },
        { duration: '3m', target: 0 },
      ],
      startTime: '17m',
      tags: { scenario: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    errors: ['rate<0.05'],
    health_latency: ['p(99)<200'],
    restaurants_latency: ['p(95)<1000'],
  },
};

const authHeaders = AUTH_TOKEN
  ? { Authorization: `Bearer ${AUTH_TOKEN}` }
  : {};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    healthLatency.add(res.timings.duration);
    const ok = check(res, {
      'health status 200': (r) => r.status === 200,
      'health body ok': (r) => r.json('status') === 'ok',
    });
    errorRate.add(!ok);
  });

  group('Public: List Restaurants', () => {
    const res = http.get(`${BASE_URL}/restaurants`);
    restaurantsLatency.add(res.timings.duration);
    const ok = check(res, {
      'restaurants status 200': (r) => r.status === 200,
      'restaurants has data': (r) => r.json('success') === true,
    });
    errorRate.add(!ok);
  });

  group('Public: Search Restaurants', () => {
    const res = http.get(`${BASE_URL}/restaurants/search?q=pizza`);
    const ok = check(res, {
      'search status 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    errorRate.add(!ok);
  });

  group('Public: Get Cuisines', () => {
    const res = http.get(`${BASE_URL}/restaurants/cuisines`);
    check(res, {
      'cuisines status 200': (r) => r.status === 200,
    });
  });

  if (AUTH_TOKEN) {
    group('Auth: Get Rides', () => {
      const res = http.get(`${BASE_URL}/ride/rides`, { headers: authHeaders });
      const ok = check(res, {
        'rides status 200': (r) => r.status === 200,
      });
      errorRate.add(!ok);
    });

    group('Auth: Get Orders', () => {
      const res = http.get(`${BASE_URL}/food-orders`, { headers: authHeaders });
      const ok = check(res, {
        'orders status 200': (r) => r.status === 200,
      });
      errorRate.add(!ok);
    });
  }

  group('API v1: Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'v1 health 200': (r) => r.status === 200 });
  });

  group('Metrics Endpoint', () => {
    const res = http.get(`${BASE_URL}/metrics`);
    check(res, {
      'metrics status 200': (r) => r.status === 200,
      'metrics has content': (r) => r.body.length > 100,
    });
  });

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.http_reqs?.values?.count || 0,
    avgDuration: data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 'N/A',
    p95Duration: data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A',
    p99Duration: data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 'N/A',
    errorRate: data.metrics.errors?.values?.rate?.toFixed(4) || '0',
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'server/tests/load/results.json': JSON.stringify(data, null, 2),
  };
}
