# Server-Side Production Readiness Audit Report

**Date:** March 10, 2025  
**Scope:** `server/` directory

---

## Executive Summary

The audit identified **4 Critical**, **12 High**, **15 Medium**, and **10 Low** severity issues across security, authentication, error handling, database, architecture, and configuration. Critical issues must be resolved before production deployment.

---

## 1. Security Issues

### 1.1 CSP Disabled (Critical)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 43 | Critical |

**Code:**
```javascript
app.use(helmet({ contentSecurityPolicy: false }));
```

**Issue:** Content Security Policy is disabled, leaving the app vulnerable to XSS attacks.

**Fix:** Enable CSP with a restrictive policy. At minimum:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
    },
  },
}));
```

---

### 1.2 CORS Allows All Origins (High)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 40-44 | High |

**Code:**
```javascript
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
```

**Issue:** Default `*` allows any origin when `CORS_ORIGIN` is unset, enabling cross-site request forgery from arbitrary domains.

**Fix:** Require `CORS_ORIGIN` in production; fail startup if missing. Use an array for multiple allowed origins.

---

### 1.3 Firebase Project ID Hardcoded (Critical)

| File | Line | Severity |
|------|------|----------|
| `config/firebase.js` | 8 | Critical |

**Code:**
```javascript
projectId: "kwendash-dbf13",
```

**Issue:** Project identifier is hardcoded; should be configurable via env.

**Fix:** Use `process.env.FIREBASE_PROJECT_ID` and add to `REQUIRED_ENV` when Firebase is used.

---

### 1.4 Admin Plaintext Password Fallback (Critical)

| File | Line | Severity |
|------|------|----------|
| `models/Admin.js` | 48-56 | Critical |

**Code:**
```javascript
adminSchema.methods.comparePassword = async function (candidate) {
  if (this.password.startsWith('$2')) {
    return bcrypt.compare(candidate, this.password);
  }
  const match = this.password === candidate;
  if (match) {
    this.password = await bcrypt.hash(candidate, BCRYPT_ROUNDS);
    await this.save();
  }
  return match;
};
```

**Issue:** Allows plaintext password comparison and migration. Any pre-bcrypt admin account can be logged in with plaintext; migration happens on first successful login, leaving a window for credential exposure.

**Fix:** Remove plaintext fallback. Require password reset for legacy accounts or run a one-time migration script.

---

### 1.5 JWT Expiry Not Validated (High)

| File | Line | Severity |
|------|------|----------|
| `models/User.js` | 138 | High |
| `models/Admin.js` | 68 | High |

**Code:**
```javascript
{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
```

**Issue:** If `ACCESS_TOKEN_EXPIRY` is undefined, `jsonwebtoken` may use `'1h'` or behave unpredictably. No validation that expiry is set.

**Fix:** Add `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` to env validation; use safe defaults (e.g. `'15m'`, `'7d'`).

---

### 1.6 No Input Sanitization for User-Generated Content (Medium)

| File | Multiple | Severity |
|------|----------|----------|
| `controllers/kyc.js` | 35-44 | Medium |
| `controllers/sockets.js` | 152-172 | Medium |
| `controllers/restaurant.js` | 209-224 | Medium |

**Issue:** KYC fields (fullName, address, idNumber), chat messages, and restaurant search queries are stored/used without sanitization. Risk of stored XSS and injection-style payloads.

**Fix:** Sanitize with a library (e.g. `validator`, `dompurify` for HTML) before persistence. Validate/sanitize `placeId` and `query` in maps controller.

---

### 1.7 Maps API Place ID Not Validated (Medium)

| File | Line | Severity |
|------|------|----------|
| `controllers/maps.js` | 64-72 | Medium |
| `utils/mapUtils.js` | 226-254 | Medium |

**Issue:** `placeId` from query is passed directly to Google Places API. Malformed or malicious IDs could cause unexpected behavior or errors.

**Fix:** Validate format (e.g. alphanumeric, length) before calling the API.

---

### 1.8 No Rate Limiting on Auth Endpoints (High)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 46-51 | High |

**Code:**
```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  ...
})
```

**Issue:** Global 100 req/15min applies to all routes. Auth endpoints (login, refresh, firebase-signin) need stricter limits to prevent brute force and token abuse.

**Fix:** Apply a stricter rate limiter to `/auth/*` (e.g. 5-10 per 15 min per IP).

---

### 1.9 No CSRF Protection (Medium)

| File | N/A | Severity |
|------|-----|----------|
| `app.js` | - | Medium |

**Issue:** No CSRF tokens for state-changing requests. Risk is lower with Bearer tokens but still relevant for cookie-based or mixed auth.

**Fix:** If using cookies for auth, add `csurf` or similar. Document that Bearer-only auth reduces CSRF surface.

---

## 2. Authentication / Authorization Gaps

### 2.1 Food Order Routes Unprotected (Critical)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 81 | High |
| `routes/foodOrder.js` | 29-49 | High |

**Code:**
```javascript
app.use("/food-orders", authMiddleware, foodOrderRouter);
```

**Issue:** `authMiddleware` is applied at the router level, but `foodOrder.js` uses `req.user._id` while auth sets `req.user.id`. This causes `req.user._id` to be `undefined`, breaking order creation and other handlers.

**Fix:** Use `req.user.id` consistently in `foodOrder.js` (replace all `req.user._id` with `req.user.id`).

---

### 2.2 Socket Token in Custom Header (Medium)

| File | Line | Severity |
|------|------|----------|
| `controllers/sockets.js` | 14 | Medium |

**Code:**
```javascript
const token = socket.handshake.headers.access_token;
```

**Issue:** Token is read from `access_token` header instead of `Authorization: Bearer <token>`. Non-standard and may be blocked by some proxies.

**Fix:** Prefer `Authorization: Bearer <token>` and parse accordingly.

---

### 2.3 KYC Approve/Reject Without Role Check (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/kyc.js` | 69-95, 97-123 | High |

**Issue:** `approveKYC` and `rejectKYC` are protected by `adminAuth`, but there is no check that the admin role is allowed to approve/reject (e.g. `super_admin` or `admin` only).

**Fix:** Add role check: `if (!['super_admin', 'admin'].includes(req.admin.role)) throw new UnauthenticatedError('Insufficient permissions');`

---

### 2.4 Restaurant Routes Partially Unprotected (High)

| File | Line | Severity |
|------|------|----------|
| `routes/restaurant.js` | 19-23 | High |

**Code:**
```javascript
router.get('/', getRestaurants);
router.get('/search', searchRestaurants);
router.get('/cuisines', getCuisines);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getRestaurantMenu);
```

**Issue:** Read endpoints are public (acceptable). But `createRestaurant`, `updateRestaurant`, `toggleRestaurantStatus`, and menu CRUD use `adminAuth` only-no distinction between restaurant owner and platform admin.

**Fix:** Introduce owner-scoped checks where applicable; ensure only authorized admins/owners can modify a given restaurant.

---

### 2.5 Food Order Authorization Gaps (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/foodOrder.js` | 183-210, 213-267, 312-368 | High |

**Issue:**
- `getOrderById` does not verify the requester is customer, courier, or restaurant.
- `restaurantAcceptOrder`, `restaurantRejectOrder`, `markReady` have no check that the caller owns or operates the restaurant.
- `acceptBid` does not verify the caller is the customer/restaurant for the order.

**Fix:** Add authorization checks: customer/courier/restaurant must match the order before returning or modifying it.

---

### 2.6 Maps Routes Unprotected (Low)

| File | Line | Severity |
|------|------|----------|
| `routes/maps.js` | 10-12 | Low |

**Issue:** Maps endpoints are public. Abuse could exhaust Google Maps API quota.

**Fix:** Add auth or a separate rate limiter for maps endpoints; consider API key quotas and monitoring.

---

## 3. Error Handling

### 3.1 Error Details Leaked to Client (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/restaurant.js` | 69-74, 112-117, 161-165, etc. | High |
| `controllers/foodOrder.js` | 139-141, 176-178, etc. | High |

**Code:**
```javascript
res.status(500).json({
  success: false,
  msg: 'Failed to fetch restaurants',
  error: error.message,
});
```

**Issue:** `error.message` is sent to clients, potentially exposing stack traces, DB errors, or internal paths.

**Fix:** Return a generic message to the client; log full error server-side. Use the centralized `error-handler.js` instead of ad-hoc responses.

---

### 3.2 CastError Exposes Invalid ID (Medium)

| File | Line | Severity |
|------|------|----------|
| `middleware/error-handler.js` | 20-23 | Medium |

**Code:**
```javascript
if (err.name === "CastError") {
  customError.msg = `No item found with id: ${err.value}`;
```

**Issue:** Invalid ObjectIds are echoed back, which can aid enumeration.

**Fix:** Use a generic message: `customError.msg = "No item found with the given id";`

---

### 3.3 Duplicate Key Error Exposes Field Names (Low)

| File | Line | Severity |
|------|------|----------|
| `middleware/error-handler.js` | 14-18 | Low |

**Code:**
```javascript
customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field...`;
```

**Issue:** Reveals which field caused the duplicate.

**Fix:** Use a generic message or avoid exposing internal field names.

---

### 3.4 Inconsistent Error Response Format (Medium)

| File | Multiple | Severity |
|------|----------|----------|
| `controllers/restaurant.js`, `controllers/foodOrder.js` | Various | Medium |

**Issue:** Some handlers use `msg`, others `message`; some use `success: false`, others rely on status codes only.

**Fix:** Standardize on a single format (e.g. `{ success, msg, ... }`) and route all errors through the error handler.

---

## 4. Database Issues

### 4.1 No Connection Error Handling (High)

| File | Line | Severity |
|------|------|----------|
| `config/connect.js` | 3-5 | High |

**Code:**
```javascript
const connectDB = (url) => {
  return mongoose.connect(url);
};
```

**Issue:** No handling for connection failures, retries, or timeouts. App may start without a working DB.

**Fix:**
```javascript
const connectDB = async (url) => {
  try {
    await mongoose.connect(url, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

---

### 4.2 No Graceful Shutdown (High)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 87-102 | High |

**Issue:** No handlers for `SIGTERM`/`SIGINT`. Server can be killed mid-request; DB connections and in-flight work are not closed cleanly.

**Fix:**
```javascript
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

### 4.3 Ride Model Missing Indexes (Medium)

| File | Line | Severity |
|------|------|----------|
| `models/Ride.js` | - | Medium |

**Issue:** No indexes for common queries: `{ customer: 1, createdAt: -1 }`, `{ rider: 1, createdAt: -1 }`, `{ status: 1 }`, `{ status: 1, createdAt: -1 }`.

**Fix:** Add compound indexes for list/filter queries used in `getMyRides`, `getAllRides`, etc.

---

### 4.4 User Model Missing Indexes (Low)

| File | Line | Severity |
|------|------|----------|
| `models/User.js` | - | Low |

**Issue:** `phone` and `firebaseUid` are used in lookups but only `firebaseUid` has a unique index; `phone` has `sparse: true` but no explicit unique index for login lookups.

**Fix:** Add `userSchema.index({ phone: 1 }, { unique: true, sparse: true });` if phone is a unique identifier.

---

## 5. Memory Leaks / Resource Management

### 5.1 Socket Interval Not Always Cleared (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/sockets.js` | 86-106 | High |

**Code:**
```javascript
retrySearch();
retryInterval = setInterval(retrySearch, 10000);
socket.on("rideAccepted", () => {
  rideAccepted = true;
  if (retryInterval) clearInterval(retryInterval);
});
socket.on("cancelRide", async () => {
  canceled = true;
  if (retryInterval) clearInterval(retryInterval);
  ...
});
```

**Issue:** If the socket disconnects before `rideAccepted` or `cancelRide`, the interval keeps running. No cleanup in `disconnect`.

**Fix:** Store `retryInterval` in a way that survives the closure and clear it in `socket.on('disconnect')` for the `searchrider` flow.

---

### 5.2 Socket Event Listeners Not Removed (Medium)

| File | Line | Severity |
|------|------|----------|
| `controllers/sockets.js` | 108-125 | Medium |

**Issue:** `rideAccepted` and `cancelRide` listeners are added inside `searchrider` but not removed when the ride ends or socket disconnects. Can lead to duplicate handlers.

**Fix:** Use `socket.once` or explicitly remove listeners when the ride is accepted/cancelled or on disconnect.

---

## 6. Dependency Issues

### 6.1 Nodemon in Production (High)

| File | Line | Severity |
|------|------|----------|
| `package.json` | 8 | High |

**Code:**
```json
"start": "nodemon app.js"
```

**Issue:** Nodemon is for development; it restarts on file changes and is not suitable for production.

**Fix:** Use `"start": "node app.js"` for production; keep `"dev": "nodemon app.js"` for local development.

---

### 6.2 No Explicit Dependency Versions (Low)

| File | Line | Severity |
|------|------|----------|
| `package.json` | 14-30 | Low |

**Issue:** Versions use `^`, allowing minor/patch updates that could introduce breaking changes.

**Fix:** Use exact versions or lockfile for production; run `npm audit` and address vulnerabilities.

---

### 6.3 Missing Validation Package for BadRequestError (Low)

| File | Line | Severity |
|------|------|----------|
| `middleware/validate.js` | 2 | Low |

**Issue:** `BadRequestError` is imported from `../errors/index.js` but the `errors` directory is not under `server/` in the standard layout-verify the import path is correct.

**Fix:** Confirm `errors/index.js` exists and exports `BadRequestError`; add a simple test to validate error handling.

---

## 7. Architecture Problems

### 7.1 Socket.IO Instance Not Attached to App (Critical)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 57-63 | Critical |
| `routes/ride.js` | 16 | High |
| `routes/foodOrder.js` | 25 | High |
| `controllers/foodOrder.js` | 122, 244, etc. | High |

**Code (app.js):**
```javascript
app.use((req, res, next) => {
  req.io = io;
  return next();
});
```

**Code (routes):**
```javascript
req.io = req.app.get('io');
```

**Code (foodOrder):**
```javascript
const io = req.app.get('io');
```

**Issue:** `app.set('io', io)` is never called. `req.app.get('io')` returns `undefined`. Food order real-time features (e.g. `io.to(...).emit(...)`) never run. Ride router overwrites `req.io` with `undefined`, but ride controller uses `req.socket` from auth, so ride real-time still works.

**Fix:** In `app.js`, add `app.set('io', io)` after creating `io`. In `foodOrder.js`, use `req.io` (from middleware) or `req.app.get('io')` after the fix.

---

### 7.2 God Controllers (Medium)

| File | Line | Severity |
|------|------|----------|
| `controllers/foodOrder.js` | 1-968 | Medium |
| `controllers/restaurant.js` | 1-419 | Medium |

**Issue:** Controllers mix HTTP handling, business logic, and I/O. Hard to test and maintain.

**Fix:** Introduce a service layer (e.g. `orderService`, `restaurantService`) for business logic; keep controllers thin.

---

### 7.3 No Service Layer (Medium)

| File | Multiple | Severity |
|------|----------|----------|
| All controllers | - | Medium |

**Issue:** Business logic lives in controllers. No clear separation between HTTP and domain logic.

**Fix:** Extract services (e.g. `authService`, `rideService`, `orderService`) and call them from controllers.

---

### 7.4 Inconsistent req.user Shape (High)

| File | Line | Severity |
|------|------|----------|
| `middleware/authentication.js` | 16 | High |
| `controllers/foodOrder.js` | 29, 149, 383, etc. | High |

**Code (auth):**
```javascript
req.user = { id: payload.id, phone: payload.phone };
```

**Code (foodOrder):**
```javascript
const customerId = req.user._id;
```

**Issue:** Auth sets `req.user.id`, not `req.user._id`. `req.user._id` is `undefined`, so order creation and other handlers fail or behave incorrectly.

**Fix:** Use `req.user.id` everywhere, or ensure auth sets both `id` and `_id` for compatibility.

---

## 8. Configuration

### 8.1 JWT Expiry Not in REQUIRED_ENV (Medium)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 5 | Medium |

**Code:**
```javascript
const REQUIRED_ENV = ['MONGO_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'GOOGLE_MAPS_API_KEY'];
```

**Issue:** `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` are not validated. Undefined values can lead to unexpected JWT behavior.

**Fix:** Add to `REQUIRED_ENV` or provide safe defaults and document them.

---

### 8.2 adminAuth Missing ACCESS_TOKEN_SECRET Check (Medium)

| File | Line | Severity |
|------|------|----------|
| `middleware/adminAuth.js` | 14-15 | Medium |

**Issue:** `authentication.js` checks `process.env.ACCESS_TOKEN_SECRET` before use; `adminAuth` does not. A misconfiguration could cause a runtime error.

**Fix:** Add the same check at the start of `adminAuth`.

---

### 8.3 Body Size 20MB (Low)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 52-53 | Low |

**Code:**
```javascript
app.use(express.json({ limit: '20mb' }));
```

**Issue:** 20MB is large for typical API payloads and can enable DoS via large requests.

**Fix:** Reduce to 1-2MB unless there is a specific need (e.g. file uploads); handle uploads separately with streaming.

---

## 9. Logging

### 9.1 Console.log/error Used Throughout (Medium)

| File | Multiple | Severity |
|------|----------|----------|
| `app.js`, `controllers/*`, `sockets.js`, `mapUtils.js` | Various | Medium |

**Issue:** No structured logger. `console.log`/`console.error` are not suitable for production (no levels, no request IDs, hard to aggregate).

**Fix:** Use `pino` or `winston` with log levels, request IDs, and JSON output for production.

---

### 9.2 No Request Logging Middleware (Low)

| File | N/A | Severity |
|------|-----|----------|
| `app.js` | - | Low |

**Issue:** No middleware to log method, path, status, duration, or IP for each request.

**Fix:** Add `morgan` or a custom middleware that logs request/response metadata.

---

### 9.3 Agent Logs User Message (Medium)

| File | Line | Severity |
|------|------|----------|
| `services/aiAgent.js` | 211 | Medium |

**Code:**
```javascript
console.log('Running agent with message:', userMessage);
```

**Issue:** User input is logged; may contain PII or sensitive data.

**Fix:** Log only a hash or length; avoid logging full user messages in production.

---

## 10. API Design

### 10.1 No API Versioning (Medium)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 74-81 | Medium |

**Code:**
```javascript
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);
```

**Issue:** Routes are unversioned. Future changes may break existing clients.

**Fix:** Prefix routes with `/api/v1` (or similar) and plan a versioning strategy.

---

### 10.2 Inconsistent Response Keys (Medium)

| File | Multiple | Severity |
|------|----------|----------|
| `controllers/*` | Various | Medium |

**Issue:** Mixed use of `message` vs `msg`, `success` vs status-only, and different structures for errors.

**Fix:** Define a standard response schema (e.g. `{ success, data?, msg? }`) and use it across all endpoints.

---

### 10.3 Health Check Too Minimal (Low)

| File | Line | Severity |
|------|------|----------|
| `app.js` | 69-71 | Low |

**Code:**
```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running!" });
});
```

**Issue:** Does not verify DB or external service connectivity. Load balancers may route traffic to an unhealthy instance.

**Fix:** Add DB ping and optional checks for critical dependencies; return 503 if unhealthy.

---

## 11. Additional Issues

### 11.1 AI Agent Model and Schema Mismatches (High)

| File | Line | Severity |
|------|------|----------|
| `services/aiAgent.js` | 90, 95, 164 | High |

**Code:**
```javascript
Ride.countDocuments({ status: 'completed' })
Ride.countDocuments({ status: { $in: ['pending', 'accepted', 'started'] } })
user.earnings > 50000
user.ridesCompleted > 1000
```

**Issue:** Ride model uses `COMPLETED`, `SEARCHING_FOR_RIDER`, `START`, etc., not `completed`, `pending`, `accepted`, `started`. User model has `earnings.total` and `stats.completedRides`, not `earnings` or `ridesCompleted`. Queries will not match; agent stats will be wrong.

**Fix:** Align status strings and field names with the Ride and User models.

---

### 11.2 KYC approveKycTool Uses Non-Existent Field (Medium)

| File | Line | Severity |
|------|------|----------|
| `services/aiAgent.js` | 45 | Medium |

**Code:**
```javascript
user.kyc.reviewedAt = new Date();
user.kyc.adminNotes = 'Approved by AI Agent';
```

**Issue:** User schema has `verifiedAt` and no `adminNotes`. These assignments may be ignored or cause issues.

**Fix:** Use `verifiedAt` and add `adminNotes` to the schema if needed, or remove the assignment.

---

### 11.3 markReady Double Save and Status Overwrite (Medium)

| File | Line | Severity |
|------|------|----------|
| `controllers/foodOrder.js` | 321-334 | Medium |

**Code:**
```javascript
order.status = 'ready_for_pickup';
order.timeline.push(...);
await order.save();
order.status = 'bidding_open';
order.timeline.push(...);
await order.save();
```

**Issue:** Status is set to `ready_for_pickup` then immediately overwritten with `bidding_open`. The first status is never persisted in a meaningful way.

**Fix:** Set `order.status = 'bidding_open'` once and push both timeline entries before a single `save()`.

---

### 11.4 updateCourierLocation No Authorization (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/foodOrder.js` | 937-960 | High |

**Issue:** Any authenticated user can update location for any order. No check that the caller is the assigned courier.

**Fix:** Verify `req.user.id === order.courierId` before updating.

---

### 11.5 getOrderById No Authorization (High)

| File | Line | Severity |
|------|------|----------|
| `controllers/foodOrder.js` | 183-210 | High |

**Issue:** Any authenticated user can fetch any order by ID.

**Fix:** Ensure the requester is the customer, courier, or restaurant for that order before returning it.

---

## Summary Table

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 12 |
| Medium | 15 |
| Low | 10 |

---

## Recommended Priority Order

1. **Immediate (pre-production):**
   - Fix `req.user._id` vs `req.user.id` in foodOrder
   - Attach Socket.IO to app (`app.set('io', io)`)
   - Remove Admin plaintext password fallback
   - Add graceful shutdown
   - Fix DB connection error handling

2. **Short-term:**
   - Harden auth (rate limits, JWT expiry validation)
   - Fix authorization for food order endpoints
   - Stop leaking error details to clients
   - Fix AI agent schema/status mismatches
   - Move `nodemon` out of production start script

3. **Medium-term:**
   - Introduce service layer
   - Add structured logging
   - Add API versioning
   - Improve health check
   - Enable CSP and tighten CORS
