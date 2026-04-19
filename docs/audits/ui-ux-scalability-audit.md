# Codebase Audit Report: UI/UX and Scalability Issues

**Audit Date:** March 10, 2025  
**Scope:** `client/src/` and `server/` directories

---

## UI/UX Issues

### 1. Hardcoded Styles (Fixed Pixel Values)

Many components use fixed pixel values that do not adapt to different screen sizes. Consider using `Dimensions`, `useWindowDimensions`, `RFValue`, or percentage-based values.

| File | Lines | Issue |
|------|-------|-------|
| `client/src/app/otp-verify.tsx` | 228-317 | width: 64, height: 64, fontSize: 26, height: 56, etc. |
| `client/src/app/auth.tsx` | 284-382 | fontSize: 26, height: 56, padding: 4, etc. |
| `client/src/app/onboarding.tsx` | 210-274 | width: 40, height: 260, fontSize: 30, etc. |
| `client/src/components/shared/PhoneInput.tsx` | 179-248 | height: 50, width: 40, fontSize: 24, etc. |
| `client/src/app/index.tsx` | 127-128 | width: 120, height: 120 |
| `client/src/app/customer/account/safety.tsx` | 186-275 | width: 80, height: 80, width: 44, height: 44 |
| `client/src/app/customer/account/saved-places.tsx` | 130-189 | width: 44, height: 44 |
| `client/src/app/customer/eats/[restaurantId].tsx` | 228, 292-411 | height: 120, width: 40, height: 40 |
| `client/src/app/customer/eats/restaurants.tsx` | 234-290 | height: 120, height: 48 |
| `client/src/app/customer/delivery/store/[storeId].tsx` | 154 | height: 120 |
| `client/src/app/customer/delivery/tracking/[orderId].tsx` | 301, 331 | height: 40, height: 300 |
| `client/src/components/delivery/StoreListCard.tsx` | 112 | height: 200 (image container) |

**Recommendation:** Create a shared `spacing` and `typography` scale (e.g., `spacing.sm`, `fontSize.body`) and use `RFValue` or `scale` utilities for responsive sizing.

---

### 2. Missing Loading, Error, and Empty States

| File | Issue |
|------|-------|
| `client/src/app/auth.tsx` | No explicit error state UI; errors only via Alert |
| `client/src/app/onboarding.tsx` | No loading/error states |
| `client/src/app/customer/home.tsx` | No loading state for fetchEatsData; no error state |
| `client/src/app/customer/account/saved-places.tsx` | No pull-to-refresh; no loading/error states |
| `client/src/app/customer/account/settings.tsx` | No loading/error states |
| `client/src/app/customer/account/support.tsx` | No loading/error states |
| `client/src/app/customer/selectlocations.tsx` | No loading state for getPlacesSuggestions; uses `alert()` for errors |
| `client/src/components/shared/RideHistoryModal.tsx` | Error only logged to console; no user-facing error state |
| `client/src/app/customer/delivery/chat/[courierId].tsx` | ListEmptyComponent exists but no error state for failed fetch |

**Recommendation:** Add `isError` and `errorMessage` state; render error UI with retry; use consistent loading skeletons/spinners.

---

### 3. Missing Input Validation / Poor Error Messages

| File | Line | Issue |
|------|------|-------|
| `client/src/app/customer/selectlocations.tsx` | 74-92 | Uses `alert()` for validation; poor UX |
| `client/src/service/rideService.tsx` | 29, 68, 78 | Generic "Oh! Dang there was an error" |
| `client/src/app/rider/liveride.tsx` | 147 | "Congratulations! you rock" (informal) |
| `client/src/app/rider/liveride.tsx` | 98, 150, 170, 173 | Inconsistent error messages |
| `client/src/app/customer/ridebooking.tsx` | 90 | "Invalid Price" - no guidance on valid range |

**Recommendation:** Replace `alert()` with in-context error messages; use consistent, actionable error copy; validate inputs before submit.

---

### 4. Inconsistent Styling

| File | Issue |
|------|-------|
| Multiple files | Mix of `Colors.primary`, `#10B981`, `#059669` for primary green |
| `client/src/app/customer/account/*.tsx` | Dark theme (DARK_BG, CARD_BG) vs light theme elsewhere |
| `client/src/components/delivery/StoreListCard.tsx` | Hardcoded `#FFC107` for star instead of Constants |
| `client/src/app/customer/delivery/browse.tsx` | Uses `colors.background`, `colors.card` from theme; others use Constants |
| Font sizes | Mix of RFValue(14), fontSize: 14, fontSize: 16 without a typography scale |

**Recommendation:** Centralize colors in `Constants` or theme; define typography scale; use theme consistently.

---

### 5. Missing Accessibility

| File | Issue |
|------|-------|
| All `TouchableOpacity` / `Pressable` | No `accessibilityLabel` |
| All `Image` components | No `accessibilityLabel` for meaningful images |
| `client/src/app/customer/account/safety.tsx` | Toggle switches lack `accessibilityRole` |
| `client/src/components/shared/PhoneInput.tsx` | Input lacks `accessibilityHint` |
| `client/src/app/customer/delivery/checkout.tsx` | Form inputs lack accessibility props |

**Recommendation:** Add `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` to interactive elements; test with screen reader.

---

### 6. Missing Pull-to-Refresh on Lists

| File | Issue |
|------|-------|
| `client/src/app/customer/account/saved-places.tsx` | ScrollView, no RefreshControl |
| `client/src/app/customer/selectlocations.tsx` | FlatList, no RefreshControl |
| `client/src/components/shared/RideHistoryModal.tsx` | FlatList, no RefreshControl |
| `client/src/components/shared/ChatModal.tsx` | FlatList, no RefreshControl |

**Screens with pull-to-refresh (good):** `restaurants.tsx`, `grocery.tsx`, `browse.tsx`, `index.tsx` (delivery)

---

### 7. Missing Pagination / Infinite Scroll

| File | Issue |
|------|-------|
| `client/src/app/customer/eats/restaurants.tsx` | FlatList loads all restaurants; no pagination |
| `client/src/app/customer/delivery/index.tsx` | FlatList loads all stores; no pagination |
| `client/src/app/customer/delivery/browse.tsx` | FlatList loads all stores; no pagination |
| `client/src/app/customer/delivery/grocery.tsx` | FlatList; no pagination |
| `client/src/app/rider/home.tsx` | FlatList for delivery offers; no pagination |
| `client/src/components/shared/RideHistoryModal.tsx` | FlatList; no pagination |

---

### 8. DoorDash / Competitor Branding (Copy-Paste)

| File | Line | Text |
|------|------|------|
| `client/src/app/customer/delivery/browse.tsx` | 82 | `placeholder="Search DoorDash"` |
| `client/src/app/customer/delivery/index.tsx` | 92 | `placeholder="Search DoorDash"` |
| `client/src/app/customer/delivery/chat/[courierId].tsx` | 114 | "Dasher" (header label) |
| `client/src/app/customer/delivery/review/[orderId].tsx` | 144 | "Rate the Dasher" |
| `client/src/components/delivery/DasherMap.native.tsx` | 100 | `title="Dasher"` |
| `client/src/components/delivery/DasherMap.web.tsx` | 9, 25 | Interface/component named DasherMap |

**Recommendation:** Replace with app branding: e.g., "Search restaurants", "Courier", "CourierMap".

---

### 9. Placeholder Images / Broken Image Handling

| File | Issue |
|------|-------|
| `client/src/app/customer/eats/[restaurantId].tsx` | `source={{ uri: selectedRestaurant.coverImage \|\| selectedRestaurant.imageUrl }}` - no fallback if both null |
| `client/src/app/customer/delivery/product/[itemId].tsx` | `source={{ uri: menuItem.imageUrl }}` - no onError, no placeholder |
| `client/src/app/customer/delivery/store/[storeId]/info.tsx` | `source={{ uri: store.coverImage }}` - no fallback |
| `client/src/components/delivery/CartItemRow.tsx` | `source={{ uri: item.imageUrl }}` - no onError |
| `client/src/components/delivery/ComplementCartList.tsx` | Same |
| `client/src/components/delivery/MenuItemCard.tsx` | Has placeholder for missing imageUrl (good) |
| `client/src/components/delivery/StoreListCard.tsx` | Has placeholder (good) |
| `client/src/components/eats/RestaurantCard.tsx` | `source={{ uri: restaurant.imageUrl }}` - no onError |
| `client/src/components/eats/MenuItemCard.tsx` | Same |
| `client/src/components/rider/RiderHeader.tsx` | Profile photo - no onError |
| `client/src/components/customer/DriverProfileCard.tsx` | Has onError fallback (good) |

**Recommendation:** Add `onError` handler and placeholder/fallback for all remote images.

---

### 10. Missing Confirmation Dialogs for Destructive Actions

| File | Issue |
|------|-------|
| `client/src/app/customer/account.tsx` | Has Alert with destructive style for sign out (good) |
| `client/src/app/customer/eats/bidding.tsx` | Cancel order has confirmation (good) |
| `client/src/app/customer/eats/tracking/[orderId].tsx` | Cancel order has confirmation (good) |
| `client/src/app/rider/food-delivery.tsx` | Complete delivery has confirmation (good) |
| `client/src/app/customer/ridebooking.tsx` | Cancel ride has confirmation (good) |
| `client/src/app/customer/account/saved-places.tsx` | Place items are TouchableOpacity but no delete flow visible - verify if delete exists |
| `client/src/app/customer/account/settings.tsx` | No destructive actions - N/A |

---

### 11. Hardcoded Strings (I18n)

All user-facing strings are hardcoded in English. No i18n setup found.

| Examples |
|---------|
| "Loading...", "Your cart is empty", "Search DoorDash", "Rate the Dasher" |
| Error messages, button labels, placeholders |

**Recommendation:** Introduce i18n (e.g., react-i18next) and move strings to locale files.

---

## Scalability Issues

### 1. No Pagination on API Endpoints

| File | Endpoint/Function | Issue |
|------|------------------|-------|
| `server/controllers/restaurant.js` | getRestaurants | `Restaurant.find(query)` - fetches all |
| `server/controllers/restaurant.js` | getRestaurantMenu | `MenuItem.find(query)` - fetches all menu items |
| `server/controllers/restaurant.js` | searchRestaurants | Fetches all matching results |
| `server/controllers/foodOrder.js` | getOrders | `FoodOrder.find(query)` - fetches all orders |
| `server/controllers/foodOrder.js` | getAvailableDeliveries | Fetches all bidding_open orders |
| `server/controllers/foodOrder.js` | getRestaurantOrders | Fetches all orders for restaurant |
| `server/controllers/ride.js` | getMyRides | `Ride.find(query)` - fetches all rides |
| `server/controllers/admin.js` | getAllUsers | Fetches all users |
| `server/controllers/admin.js` | getAllRides | Has .limit(100) - partial pagination |
| `server/controllers/admin.js` | getKYCSubmissions | Fetches all |

**Recommendation:** Add `page`, `limit` query params; use `.skip()` and `.limit()`; return `total`, `page`, `hasMore`.

---

### 2. Missing Database Indexes

| Model | File | Missing Indexes |
|-------|------|-----------------|
| Ride | `server/models/Ride.js` | No indexes on `customer`, `rider`, `status`, `createdAt` |
| User | `server/models/User.js` | No indexes on `role`, `kyc.status`, `createdAt` |
| Admin | `server/models/Admin.js` | Not audited |

**Models with indexes (good):** Restaurant, MenuItem, FoodOrder, DeliveryBid

---

### 3. Rate Limiting

| Location | Status |
|----------|--------|
| `server/app.js` | Global rate limit: 100 req/15 min (good) |
| Auth routes | No stricter limit for signin/refresh |
| Food order create | No per-user limit |

**Recommendation:** Add stricter limits for auth endpoints (e.g., 5 req/min for signin) and sensitive endpoints.

---

### 4. No Caching Strategy

No Redis or in-memory cache for:
- Restaurant list
- Restaurant menu
- Cuisines
- User session data

**Recommendation:** Cache frequently read, rarely-changing data (e.g., cuisines, restaurant list).

---

### 5. WebSocket Reconnection Logic

| File | Issue |
|------|-------|
| `client/src/service/WSProvider.tsx` | Socket.io client has no explicit `reconnect: true` or `reconnectionAttempts`; relies on defaults. No `disconnect`/`reconnect` on network change. |
| `client/src/service/WSProvider.tsx` | `connect_error` only refreshes tokens; no user-facing reconnection UI |

**Recommendation:** Configure `reconnection: true`, `reconnectionAttempts: 5`, `reconnectionDelay`; handle `reconnect` event; optionally show "Reconnecting..." UI.

---

### 6. Missing app.set('io') for Socket Access

| File | Issue |
|------|-------|
| `server/app.js` | Sets `req.io = io` in middleware but never `app.set('io', io)` |
| `server/routes/ride.js` | `req.io = req.app.get('io')` - overwrites req.io with undefined |
| `server/routes/foodOrder.js` | Same |
| `server/controllers/foodOrder.js` | Uses `req.app.get('io')` - returns undefined |

**Impact:** `req.app.get('io')` returns undefined, so `foodOrder` controller's socket emissions are silently skipped (guarded by `if (io)`). Real-time order updates (restaurant, courier, customer) will not work. Ride routes work because `req.io` is set by app-level middleware before the ride router overwrites it, and auth sets `req.socket = req.io`.

**Recommendation:** Add `app.set('io', io)` after creating the socket server in `app.js`.

---

### 7. No Connection Pooling for Database

| File | Issue |
|------|-------|
| `server/config/connect.js` | `mongoose.connect(url)` - Mongoose uses default pool (typically 5-100). No explicit pool size config. |

**Recommendation:** Configure `mongoose.connect(url, { maxPoolSize: 10 })` for production tuning.

---

### 8. Large Payload Responses

| Endpoint | Issue |
|----------|-------|
| getRestaurantById | Returns full restaurant object |
| getOrderById | Returns full order with populated refs |
| getMyRides | Returns full ride objects with customer/rider |
| getRestaurantMenu | Returns all menu items |

**Recommendation:** Support `?fields=` or separate endpoints for list (summary) vs detail views.

---

### 9. No Background Job Processing

All operations are synchronous:
- Order creation
- Bid placement
- Status updates
- Notifications (socket emits are inline)

**Recommendation:** Use Bull/BullMQ or similar for: order notifications, analytics, email/push.

---

### 10. No CDN for Static Assets

Client assets (images, fonts) are bundled with the app. No CDN configuration found.

---

### 11. Health Check Endpoint

| Location | Status |
|----------|--------|
| `server/app.js` | `GET /health` returns `{ status: "ok" }` (good) |

---

### 12. Monitoring / Logging

| Issue |
|-------|
| No structured logging (e.g., Winston, Pino) |
| No APM (e.g., New Relic, Datadog) |
| `console.log`/`console.error` used throughout |
| No request ID or correlation ID |

---

### 13. No Database Migration Strategy

No migrations folder or tool (e.g., migrate-mongo, mongoose-migrate) found. Schema changes are applied implicitly on deploy.

---

### 14. Server Architecture (Single Process)

| Issue |
|-------|
| Single Node process; no clustering |
| No PM2 or similar process manager |
| No horizontal scaling setup |

**Recommendation:** Use `cluster` module or PM2 for multi-core utilization.

---

### 15. Request Validation Middleware

| Route | Validation |
|-------|------------|
| auth (signin, refresh, firebase-signin) | Zod validate (good) |
| kyc submit | Zod validate (good) |
| ride create | Manual validation in controller |
| food order create | No request body validation |
| restaurant routes | No validation |
| foodOrder routes | No validation for createOrder, placeBid, acceptBid, etc. |

**Recommendation:** Add Zod/Joi validation for all POST/PATCH bodies (e.g., createOrder, placeBid, cancelOrder).

---

### 16. CORS Configuration

| Location | Config |
|----------|--------|
| `server/app.js` | `cors({ origin: process.env.CORS_ORIGIN \|\| '*' })` |

**Issue:** `'*'` allows any origin when `CORS_ORIGIN` is unset. Acceptable for dev; restrict in production.

---

### 17. Memory Leaks / Cleanup

| File | Issue |
|------|-------|
| `server/controllers/sockets.js` | `retryInterval = setInterval(retrySearch, 10000)` - cleared on cancel/accept, but ensure cleanup on socket disconnect |
| `server/controllers/sockets.js` | `onDutyRiders` Map - riders removed on disconnect (good) |
| `client/src/service/WSProvider.tsx` | `socket.current?.disconnect()` in useEffect cleanup (good) |
| Client screens | Verify no `setInterval`/`setTimeout` without cleanup in useEffect |

---

## Summary

| Category | Count |
|----------|-------|
| UI/UX issues | 11 categories, 50+ specific findings |
| Scalability issues | 17 categories, 40+ specific findings |

**Priority fixes:**
1. Add `app.set('io', io)` in `server/app.js` (blocks food order socket emissions)
2. Replace DoorDash/Dasher branding
3. Add request validation for food order and ride endpoints
4. Add pagination to list endpoints (restaurants, orders, rides)
5. Add Ride and User model indexes
6. Add accessibility props to interactive elements
7. Add error/empty states and pull-to-refresh where missing
