# Client-Side Architecture Audit Report

**Scope:** `client/src` - service layer, state management, app architecture  
**Date:** 2025-03-10

---

## 1. Token Management

### Storage and Hydration
| Finding | Location | Severity |
|---------|----------|----------|
| Tokens stored in AsyncStorage via `tokenStorage` with in-memory cache | `client/src/store/storage.tsx` L49-74 | Info |
| Hydration runs on `typeof window !== 'undefined'` only - native may not auto-hydrate before first API call | `client/src/store/storage.tsx` L43-46 | **Major** |
| `hydrateTokens()` must be awaited before reading tokens; `index.tsx` does this correctly | `client/src/app/index.tsx` L46-47 | OK |
| `onboarding_completed` in HYDRATION_KEYS but not in AUTH_KEYS - survives logout | `client/src/store/storage.tsx` L5-12 | Info |

### Refresh and Expiry
| Finding | Location | Severity |
|---------|----------|----------|
| 401 interceptor triggers refresh; no mutex - concurrent 401s can cause multiple refresh calls | `client/src/service/apiInterceptors.tsx` L37-54 | **Major** |
| Refresh failure clears auth and calls `logout()` - correct | `client/src/service/apiInterceptors.tsx` L19-22 | OK |
| Index screen checks `decodedRefresh.exp` and `decodedAccess.exp` before navigation | `client/src/app/index.tsx` L64-75 | OK |
| No proactive refresh (e.g. 5 min before expiry) - only on 401 | `client/src/service/apiInterceptors.tsx` | **Minor** |

### KYC Service Bypasses appAxios
| Finding | Location | Severity |
|---------|----------|----------|
| `kycService` uses raw axios with manual Bearer header - no 401 refresh, no retry | `client/src/service/kycService.tsx` L16-21, L33-38, L48-53 | **Major** |

---

## 2. API Error Handling

### Network and User Feedback
| Finding | Location | Severity |
|---------|----------|----------|
| `authService.signin` maps ECONNABORTED, ERR_NETWORK to user-friendly messages | `client/src/service/authService.tsx` L48-59 | OK |
| `rideService` uses generic "Oh! Dang there was an error" - no specific messages | `client/src/service/rideService.tsx` L29, L68, L77, L78 | **Minor** |
| `getMyRides` swallows errors - no user feedback | `client/src/service/rideService.tsx` L55-57 | **Major** |
| `foodOrderService`, `eatsService` return `{ success: false, error }` - callers must handle | Various | OK |
| No retry logic for transient failures | All services | **Minor** |
| `appAxios` has no timeout configured | `client/src/service/apiInterceptors.tsx` L25-27 | **Minor** |

### firebaseAuthService Fallback
| Finding | Location | Severity |
|---------|----------|----------|
| Fallback auth uses raw axios - no 401 handling, no timeout | `client/src/service/firebaseAuthService.tsx` L36-46 | **Minor** |
| `sendOTP` fallback posts `phone: phoneNumber` but server may expect full E.164 | `client/src/service/firebaseAuthService.tsx` L37-38 | **Minor** |

---

## 3. State Management

### Persistence and Cleanup
| Finding | Location | Severity |
|---------|----------|----------|
| `userStore`, `riderStore`, `themeStore`, `cartStore` use Zustand persist with `mmkvStorage` | `client/src/store/*.tsx` | OK |
| `deliveryStore`, `eatsStore` are not persisted - session-only | `client/src/store/deliveryStore.tsx`, `eatsStore.tsx` | OK |
| Logout clears `userStore`, `riderStore`, `tokenStorage` only | `client/src/service/authService.tsx` L64-75 | **Major** |
| Logout does NOT clear `deliveryStore`, `eatsStore`, `cartStore` | - | **Major** |
| Cart persists across logout - next user may see previous cart | `client/src/store/cartStore.tsx` | **Critical** |

### Race Conditions
| Finding | Location | Severity |
|---------|----------|----------|
| `index.tsx` uses `customerUser?.role` and `riderUser?.role` for navigation - Zustand persist hydrates async; user may be null when tokenCheck runs | `client/src/app/index.tsx` L76-83 | **Major** |
| `tokenCheck` is async; `setHasNavigated(true)` runs before `tokenCheck` completes - prevents double run but navigation happens inside tokenCheck | `client/src/app/index.tsx` L90-95 | OK |
| `handleFallbackLogin` in auth.tsx calls `useUserStore.getState()` inside handler - correct for non-hook usage | `client/src/app/auth.tsx` L38-39 | OK |

### storage.tsx Cache Consistency
| Finding | Location | Severity |
|---------|----------|----------|
| `tokenCache` and `storageCache` are separate; `mmkvStorage` uses `storageCache` - Zustand persist uses `mmkvStorage` which does not share `tokenCache` | `client/src/store/storage.tsx` L14-15, L90-101 | Info |
| `tokenStorage.clearAuth()` does not clear Zustand-persisted user/rider data - that is done by store `clearData` | - | OK |

---

## 4. Memory Leaks

### useEffect Cleanup
| Finding | Location | Severity |
|---------|----------|----------|
| `liveride.tsx` cleans up socket listeners in first useEffect | `client/src/app/customer/liveride.tsx` L67-72 | OK |
| Second useEffect for `riderLocationUpdate` cleans up | `client/src/app/customer/liveride.tsx` L84-86 | OK |
| `WSProvider` cleanup disconnects socket on unmount | `client/src/service/WSProvider.tsx` L59-61 | OK |
| `connect_error` listener in WSProvider is never removed - re-attached on each socket creation | `client/src/service/WSProvider.tsx` L51-56 | **Minor** |
| `useWS().on()` adds listeners; callers must call `off()` - easy to miss | `client/src/service/WSProvider.tsx` L68-74 | **Minor** |

### OTP Verify
| Finding | Location | Severity |
|---------|----------|----------|
| Resend timer interval cleared in cleanup | `client/src/app/otp-verify.tsx` L36-42 | OK |
| Focus timeout cleared | `client/src/app/otp-verify.tsx` L44-47 | OK |

---

## 5. Offline Handling

| Finding | Location | Severity |
|---------|----------|----------|
| No NetInfo or connectivity detection | - | **Major** |
| No offline queue for API requests | - | **Minor** |
| No user-facing "You're offline" UI | - | **Major** |
| AsyncStorage used for tokens - works offline for reads | `client/src/store/storage.tsx` | OK |

---

## 6. Deep Linking

| Finding | Location | Severity |
|---------|----------|----------|
| `expo-linking` in package.json | `client/package.json` L32 | OK |
| `app.json` has `scheme: "xigoa"` | `client/app.json` | OK |
| No custom `linking` config in `_layout.tsx` or expo-router - uses default | - | **Minor** |
| No handling of deep links to specific screens (e.g. order tracking, ride) | - | **Minor** |

---

## 7. Push Notifications

| Finding | Location | Severity |
|---------|----------|----------|
| `expo-notifications` not in package.json | `client/package.json` | **Major** |
| User preferences have `push: boolean` but no actual push registration | `client/src/store/userStore.tsx` L20-21 | **Major** |
| Settings screen toggles `pushNotifications` - stored in preferences only | `client/src/app/customer/account/settings.tsx` L22-23, L174 | **Major** |

---

## 8. Analytics

| Finding | Location | Severity |
|---------|----------|----------|
| Firebase includes `@firebase/analytics` (transitive) | `client/package-lock.json` | Info |
| `measurementId` in firebase config but no explicit `getAnalytics()` or event calls | `client/src/config/firebase.ts` L13 | **Minor** |
| No screen tracking, no custom events | - | **Minor** |

---

## 9. Crash Reporting

| Finding | Location | Severity |
|---------|----------|----------|
| No Sentry, Crashlytics, or similar | - | **Major** |
| `ErrorBoundary` catches React errors, logs in __DEV__ only, no reporting | `client/src/components/shared/ErrorBoundary.tsx` L22-26 | **Minor** |
| `componentDidCatch` does not forward to external service | `client/src/components/shared/ErrorBoundary.tsx` | **Major** |

---

## 10. App Performance

### Re-renders and Memoization
| Finding | Location | Severity |
|---------|----------|----------|
| `ridebooking.tsx`, `liveride.tsx` use `useMemo`/`useCallback` appropriately | `client/src/app/customer/ridebooking.tsx`, `liveride.tsx` | OK |
| `LiveTrackingMap`, `RiderLiveTracking` wrapped in `memo` | `client/src/components/customer/LiveTrackingMap.tsx`, `RiderLiveTracking.tsx` | OK |
| `index.tsx` effect depends on `loaded`, `hasNavigated` - `tokenCheck` not in deps (intentional) | `client/src/app/index.tsx` L90-96 | OK |
| Many list screens (home, restaurants, delivery) lack `React.memo` on list items | Various | **Minor** |

### Heavy Work on Render
| Finding | Location | Severity |
|---------|----------|----------|
| `cartStore.getSubtotal`, `getTotal`, etc. are called on each access - no memoization at call site | `client/src/store/cartStore.tsx` L110-139 | **Minor** |

---

## 11. Image Optimization

| Finding | Location | Severity |
|---------|----------|----------|
| Uses React Native `Image` - no `expo-image` (caching, blurhash, priority) | Multiple components | **Minor** |
| No explicit caching strategy | - | **Minor** |
| No lazy loading for long lists (e.g. restaurant images) | `client/src/components/eats/RestaurantCard.tsx`, delivery components | **Minor** |
| KYC sends base64 images - large payloads | `client/src/app/rider/kyc-verification.tsx` L54 | **Minor** |

---

## 12. Bundle Size and Dependencies

| Finding | Location | Severity |
|---------|----------|----------|
| `react-native-mmkv` installed but storage uses AsyncStorage via `mmkvStorage` (which wraps AsyncStorage) | `client/package.json` L50, `client/src/store/storage.tsx` L90 | **Minor** |
| Firebase pulls analytics, auth - reasonable for auth use | - | OK |
| `haversine-distance`, `react-native-maps-directions` - domain-specific, acceptable | - | OK |
| No tree-shaking issues observed in imports | - | OK |

---

## 13. Security and Configuration

| Finding | Location | Severity |
|---------|----------|----------|
| Google Maps API key hardcoded in `app.json` | `client/app.json` L18, L24 | **Critical** |
| Config uses `process.env.EXPO_PUBLIC_*` - correct pattern | `client/src/service/config.tsx`, `client/src/config/firebase.ts` | OK |
| `BASE_URL` and `SOCKET_URL` default to `""` if unset - can cause silent failures | `client/src/service/config.tsx` L1-2 | **Major** |

---

## 14. OTP Verify Error Handling

| Finding | Location | Severity |
|---------|----------|----------|
| `handleVerify` catch logs to console but does not show Alert | `client/src/app/otp-verify.tsx` L105-108 | **Major** |
| `verifyOTP` in firebaseAuthService shows Alert on error | `client/src/service/firebaseAuthService.tsx` L106-109 | OK |
| Resend does not actually resend - only shows "Code Sent" Alert | `client/src/app/otp-verify.tsx` L112-116 | **Major** |

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| Critical | 2 |
| Major | 15 |
| Minor | 18 |
| Info | 4 |

---

## Recommended Priorities

1. **Critical:** Move Google Maps API key to env; clear cart (and optionally delivery/eats) on logout.
2. **Major:** Add refresh-token mutex; fix index.tsx user-hydration race; clear all session stores on logout; add NetInfo and offline UI; implement push notifications or remove preference; add crash reporting; fix OTP verify error display and resend behavior; switch kycService to appAxios.
3. **Minor:** Add retry for transient failures; add axios timeout; add deep link handling for key screens; consider expo-image; remove unused mmkv or use it for token storage.
