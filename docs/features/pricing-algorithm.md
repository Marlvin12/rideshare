# Uber-Style Pricing Algorithm

## Overview

The rideshare app implements a dynamic pricing model similar to Uber. Pricing considers distance, estimated time, vehicle type, and demand-supply conditions.

## Pricing Components

1. **Base Fare** - Flat fee charged at ride start, varies by vehicle type
2. **Cost per Minute** - Based on estimated duration (distance / average speed)
3. **Cost per Kilometer** - Based on route distance
4. **Booking Fee** - Flat operational fee
5. **Surge Multiplier** - Dynamic multiplier during high demand

## Formula

```
Standard Fare = Base Fare + (Cost/Min x Time) + (Cost/Km x Distance) + Booking Fee
Final Fare = Standard Fare x Surge Multiplier
Total Fare = max(Final Fare, Minimum Fare)
```

## Rate Structure

| Vehicle Type | Base Fare | Cost/Min | Cost/Km | Booking Fee | Minimum Fare |
|-------------|-----------|----------|---------|-------------|--------------|
| Bike | $2.00 | $0.15 | $0.80 | $1.50 | $5.00 |
| Human Delivery | $3.00 | $0.20 | $1.00 | $2.00 | $7.00 |
| Cab Economy | $4.00 | $0.30 | $1.50 | $2.50 | $10.00 |
| Cab Premium | $6.00 | $0.50 | $2.50 | $3.50 | $15.00 |

## Time Estimation

- Average city speed: 25 km/h
- Formula: `Time (minutes) = (Distance in km / 25) x 60`

## Surge Pricing

### Demand-Supply Ratio Thresholds

| Ratio (Active Rides / Available Drivers) | Surge Multiplier |
|------------------------------------------|------------------|
| > 3.0 | 2.5x |
| > 2.0 | 2.0x |
| > 1.5 | 1.5x |
| > 1.0 | 1.3x |
| <= 1.0 | 1.0x |
| No available drivers | 2.0x |

### Peak Hours

- Morning: 7:00 AM - 9:00 AM
- Evening: 5:00 PM - 7:00 PM
- Minimum 1.2x multiplier during peak hours (if demand ratio would otherwise yield lower)

## Example Calculations

### 5 km Cab Economy, Normal Demand (1.0x surge)

1. Estimated time: (5 / 25) x 60 = 12 minutes
2. Standard fare: $4.00 + (12 x $0.30) + (5 x $1.50) + $2.50 = $17.60
3. Final: max($17.60 x 1.0, $10.00) = **$17.60**

### Same Ride, High Demand (2.0x surge)

1. Standard fare: $17.60
2. Final: max($17.60 x 2.0, $10.00) = **$35.20**

## API Usage

### Server-side (Node.js)

```javascript
import { calculateFare, calculateSurgeMultiplier } from './utils/mapUtils.js';

const distance = 5.2;
const activeRides = 45;
const availableRiders = 20;

const surgeMultiplier = calculateSurgeMultiplier(activeRides, availableRiders);
const fareBreakdown = calculateFare(distance, surgeMultiplier);

console.log('Bike Fare:', fareBreakdown.bike);
console.log('Estimated Time:', fareBreakdown.estimatedTime, 'minutes');
console.log('Surge Multiplier:', fareBreakdown.surgeMultiplier);
```

### Client-side (React Native/TypeScript)

```typescript
import { calculateFare, calculateSurgeMultiplier } from '@/utils/mapUtils';

const distance = 5.2;
const surgeMultiplier = calculateSurgeMultiplier(45, 20);
const fareBreakdown = calculateFare(distance, surgeMultiplier);

console.log(`Cab Economy: $${fareBreakdown.cabEconomy.toFixed(2)}`);
console.log(`ETA: ${fareBreakdown.estimatedTime} min`);
```

## Implementation

- **Server:** `server/utils/mapUtils.js` - `calculateFare`, `calculateSurgeMultiplier`, `estimateRideTime`
- **Client:** `client/src/utils/mapUtils.tsx` - Same functions (bike, cabEconomy, cabPremium; no human delivery)
