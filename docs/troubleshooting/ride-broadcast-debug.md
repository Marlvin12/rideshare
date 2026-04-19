# Ride Broadcast Debugging Guide

## Issue: Rides Not Showing on Rider Page

Rides created by customers may not appear on the rider app. This guide covers expected behavior, common causes, and fixes.

---

## Expected Server Log Flow (Working Broadcast)

When everything works correctly, server logs should show:

```bash
# 1. Rider goes on duty
User Joined: {riderId} (rider)
Rider {riderId} is now ON DUTY at coords: { latitude: X, longitude: Y }
Total on-duty riders: 1

# 2. Customer creates ride
User Joined: {customerId} (customer)

# 3. Customer searches for rider
Searching for riders near: X, Y
Currently 1 riders on duty
Retry 1/20 for ride {rideId}
Found 1 nearby riders within 60km
Broadcasting ride {rideId} to 1 nearby riders
Sent rideOffer to rider socket {socketId} for ride {rideId}

# 4. Rider receives offer (client-side)
# Rider app displays ride card with 12-second timer
```

---

## Common Issues and Solutions

### Issue 1: "Total on-duty riders: 0"

**Problem:** Rider is not going on duty properly.

**Check:**
- Is rider logged in?
- Did rider toggle ON-DUTY?
- Does rider have location permissions?
- Check rider app console for errors

**Fix:** Ensure location permission is granted, ON-DUTY toggle is ON (green), and no console errors.

---

### Issue 2: "Found 0 nearby riders"

**Problem:** Riders are too far from pickup location. Default radius is 60km.

**Check:**
- Are rider and passenger in same general area?
- Current radius: 60km (60,000 meters)

**Quick fix for testing:**
```javascript
// server/controllers/sockets.js line ~184
.filter((rider) => rider.distance <= 600000)  // 600km instead of 60km
```

---

### Issue 3: "Broadcasting ride to 0 riders"

**Problem:** Riders filtered out or not in range.

**Debug:** Check server logs for:
- How many riders on duty
- Distance calculation
- Filter results

---

### Issue 4: Rider Socket ID Mismatch

**Problem:** Socket ID changed or rider disconnected.

**Check:** Server logs should show:
```
User Joined: {riderId} (rider)
Rider {riderId} is now ON DUTY

# If rider disconnects and reconnects:
rider {riderId} disconnected.
User Joined: {riderId} (rider)
# Must toggle ON-DUTY again
```

---

## Testing Checklist

- [ ] Server is running on port 3000
- [ ] Rider app is connected (see "User Joined" log)
- [ ] Rider is ON-DUTY (see "ON DUTY" log)
- [ ] Rider has location permissions
- [ ] Rider location is being updated (see "updated location" logs)
- [ ] Customer app is connected
- [ ] Customer creates ride successfully
- [ ] Server searches for riders (see "Searching for riders" log)
- [ ] Server finds riders (see "Found X nearby riders")
- [ ] Server broadcasts to riders (see "Broadcasting ride")
- [ ] Server sends to socket (see "Sent rideOffer")
- [ ] Rider receives offer (check rider app screen)

---

## Quick Fixes for Testing

### Fix 1: Increase Search Radius
```javascript
// server/controllers/sockets.js:184
.filter((rider) => rider.distance <= 600000)  // 600km instead of 60km
```

### Fix 2: Disable KYC Check (Testing Only)
```typescript
// client/src/app/rider/home.tsx:27-29
setKycVerified(true);
setCheckingKYC(false);
```

### Fix 3: Force Retry Immediately
```javascript
// server/controllers/sockets.js:92
retryInterval = setInterval(retrySearch, 1000);  // 1 second instead of 10
```

### Fix 4: Broadcast to All Riders (Testing)
```javascript
// server/controllers/sockets.js:190
const topRiders = nearbyriders;  // Remove .slice(0, 10) limit
```

---

## Client-Side Checks

### Rider App
```typescript
// Check in rider/home.tsx:
1. onDuty === true
2. kycVerified === true (or KYC check disabled)
3. isFocused === true
4. WebSocket connected
5. Listening to "rideOffer" event
```

### Customer App
```typescript
// Check in customer/liveride.tsx:
1. Ride created successfully
2. emit("searchrider", rideId) called
3. WebSocket connected
4. Ride status is "SEARCHING_FOR_RIDER"
```

---

## Server-Side Checks

1. **Both apps connected?** Check server logs for "User Joined" for both rider and customer.
2. **Rider on duty?** Check server logs for "ON DUTY"; check rider app toggle is green.
3. **Location permissions?** iOS: Settings > App > Location > While Using. Android: Settings > Apps > App > Permissions > Location.
4. **WebSocket connection?** Check for WebSocket errors in app console and server logs.
5. **Ride created?** Check server logs for "Searching for riders"; customer app shows "Looking for driver".
6. **Distance issue?** Temporarily increase radius to 600km or test with both apps on same device/simulator.

---

## Emergency Debug Mode

If rides still do not show, add to rider app:

```typescript
// client/src/app/rider/home.tsx
useEffect(() => {
  on("rideOffer", (rideDetails: any) => {
    console.log("RECEIVED RIDE OFFER:", rideDetails);
    Alert.alert("Ride Offer Received!", JSON.stringify(rideDetails));
    // ... rest of code
  });
}, []);
```

This shows an alert when a ride offer is received.

---

## Success Indicators

**Server logs:**
```
Rider X is now ON DUTY
Total on-duty riders: 1
Searching for riders near: ...
Found 1 nearby riders
Broadcasting ride to 1 nearby riders
Sent rideOffer to rider socket
```

**Rider app:**
```
[Ride Card Appears]
Pickup: 2.3 km away
Trip: 5.4 km
You'll Earn: $8.50
[Accept] button with 12s countdown
```

**Customer app:**
```
"Looking for your driver..."
[Spinner animation]
```
