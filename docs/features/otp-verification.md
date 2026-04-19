# OTP Verification Flow

## Step-by-Step Flow

### 1. Passenger Creates Ride

1. Login as customer, go to home
2. Tap "Where are you going?", select pickup and drop-off
3. Choose vehicle type, enter price offer
4. Tap "Propose Price & Find Drivers"

**Result:** Ride created with status SEARCHING_FOR_RIDER; 4-digit OTP generated (e.g. 3847); ride broadcast to nearby drivers.

### 2. Driver Accepts Ride

1. Login as rider, ensure ON-DUTY
2. See incoming ride offers
3. Tap "Accept" within 12 seconds

**Result:** Status changes to START; driver navigates to live ride screen.

### 3. Passenger Sees OTP

After driver accepts, passenger sees driver profile and OTP (e.g. "OTP: 3847").

**Check:** Status "Driver is on the way", OTP visible, driver profile shown.

### 4. Driver Navigates to Pickup

Driver uses navigation assist if needed. On arrival, taps "ARRIVED".

**Result:** OTP input modal opens with 4 digit boxes, title "Enter OTP Below".

### 5. Driver Enters OTP

1. Ask passenger for OTP
2. Enter 4 digits, tap "Confirm"

**Correct OTP:** Success; status ARRIVED; modal closes; "COMPLETED" button appears.

**Wrong OTP:** "Wrong OTP" alert; modal stays open; can retry.

### 6. Complete Trip

Driver taps "COMPLETED" at drop-off. Rating modal appears for both parties.

## Troubleshooting

### OTP Not Showing for Passenger

- Ensure ride status is START (not SEARCHING_FOR_RIDER)
- Refresh ride data
- Check server logs for OTP generation
- Verify `item?.status === "START"` and `item?.otp` in LiveTrackingSheet

### Driver Can't Open OTP Modal

- Ensure ride status is START
- Check `rideData?.status === "START"` before `setOtpModalVisible(true)` in rider/liveride screen

### OTP Verification Always Fails

- Check type mismatch (string vs number)
- Trim extra spaces
- Debug: compare `otp` and `rideData?.otp` types

### Status Not Updating After OTP

- Check `updateRideStatus` API response
- Verify socket emits update
- Check server logs for "Ride status updated to ARRIVED"

## Test Checklist

**Passenger:** OTP generated on ride creation; visible when status START; format "OTP: XXXX"; persists on refresh.

**Driver:** Can accept ride; "ARRIVED" visible when START; tap opens OTP modal; 4 numeric inputs; correct OTP sets ARRIVED; wrong OTP shows error.

**Server:** OTP 4 digits (1000-9999); stored in ride; included in response; status flow SEARCHING -> START -> ARRIVED -> COMPLETED; timestamps recorded.
