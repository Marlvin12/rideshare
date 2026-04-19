# Deployment Guide

## 1. Infrastructure

| Service | Purpose | Recommended providers |
|---------|---------|----------------------|
| **Server host** | Node.js runtime | Railway, Render, Fly.io, DigitalOcean, AWS EC2 |
| **MongoDB** | Persistent database | MongoDB Atlas (free tier available) |
| **Redis** | Job queues (BullMQ) | Redis Cloud (free 30MB), Upstash, or provider add-on |
| **Domain + SSL** | HTTPS for API + WebSockets | Hosting provider typically handles this |

## 2. Server Environment Variables

Set these in your hosting provider's env/secrets config. **Do not commit `.env` to version control.**

| Variable | Dev value | Production action |
|----------|-----------|-------------------|
| `MONGO_URI` | `mongodb://localhost:27017/ride_app` | MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | `tomandjerry` | Generate: `openssl rand -hex 32` |
| `ACCESS_TOKEN_EXPIRY` | `4d` | Keep or adjust |
| `REFRESH_TOKEN_SECRET` | `jerryandtom` | Generate: `openssl rand -hex 32` |
| `REFRESH_TOKEN_EXPIRY` | `30d` | Keep or adjust |
| `PORT` | `3000` | Most hosts set this automatically |
| `NODE_ENV` | _(not set)_ | `production` |
| `CORS_ORIGIN` | _(not set)_ | Your client's origin(s), comma-separated |
| `LOG_LEVEL` | _(not set)_ | `info` or `warn` |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Hosted Redis URL |
| `FIREBASE_PROJECT_ID` | `kwendash-dbf13` | Same |
| `FIREBASE_CLIENT_EMAIL` | _(service account email)_ | Same |
| `FIREBASE_PRIVATE_KEY` | _(service account key)_ | Same (watch for `\n` escaping on some hosts) |
| `GOOGLE_MAPS_API_KEY` | _(your key)_ | Same, but restrict to server IP in Cloud Console |

## 3. Client Environment Variables

Update `client/.env` before building the mobile app for release.

| Variable | Dev value | Production action |
|----------|-----------|-------------------|
| `EXPO_PUBLIC_API_URL` | ngrok tunnel URL | Production server URL (e.g. `https://api.kwendash.com`) |
| `EXPO_PUBLIC_WS_URL` | ngrok tunnel URL | Same host with `wss://` prefix |
| `EXPO_PUBLIC_MAP_API_KEY` | _(your key)_ | Restrict to app package name/bundle ID in Cloud Console |
| Firebase keys | _(already set)_ | Same values |

## 4. Security Checklist

- [ ] **Rotate JWT secrets.** Generate strong random strings (32+ chars) for both `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
- [ ] **Rotate Firebase private key.** Generate a new service account key in Firebase Console > Project Settings > Service accounts, then deactivate the old one.
- [ ] **Restrict Google Maps API keys.** In Google Cloud Console, restrict by HTTP referrer (client key) and IP address (server key).
- [ ] **Set `CORS_ORIGIN`** to your actual frontend domain(s).
- [ ] **Set `NODE_ENV=production`** to enable Express production optimizations and disable verbose error output.
- [ ] **Verify `.env` is in `.gitignore`** for both `server/` and `client/`.

## 5. Deploy the Server

### Option A: Docker

```bash
docker build -t kwendash-api ./server
docker run -p 3000:3000 --env-file .env.production kwendash-api
```

### Option B: Platform-as-a-Service (Railway, Render, Fly.io)

Point the service at the `server/` directory, set the env vars in the dashboard, and deploy. The Dockerfile will be detected automatically.

### Verify

```bash
curl https://your-api-domain.com/health
```

Expected response:

```json
{ "status": "ok", "checks": { "database": "connected" } }
```

## 6. Seed the Database

Run the restaurant seed script once against your production MongoDB:

```bash
MONGO_URI="your-atlas-connection-string" node server/scripts/seedRestaurants.js
```

## 7. Build the Client

Install [EAS CLI](https://docs.expo.dev/eas/) and configure your Expo account.

```bash
cd client

# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

Submit to stores:

```bash
eas submit --platform android
eas submit --platform ios
```

## 8. Post-Deploy Monitoring

- **Health check:** `GET /health` returns DB and memory status.
- **Metrics:** `GET /metrics` returns Prometheus-format metrics.
- **Logs:** Structured JSON via Pino. Pipe through `pino-pretty` locally, or ingest into your log aggregator (Datadog, Grafana, etc.) in production.
- **Redis/BullMQ:** Monitor queue depths and failed jobs via the BullMQ dashboard or your Redis provider's UI.
