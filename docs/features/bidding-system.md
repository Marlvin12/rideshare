# inDrive-Style Bidding System

## Overview

The app supports an inDrive-style bidding model where passengers propose prices and drivers accept or counter-offer. Optimized for African markets where price flexibility is important.

## Bidding Model

1. Passengers propose a price they are willing to pay
2. Drivers see proposals and can accept, reject, or counter-offer
3. Passengers choose from multiple driver offers (price, rating, ETA)
4. Negotiation continues until both parties agree

### Why This Works for African Markets

- Economic flexibility across varying conditions
- Transparency: both parties agree on price upfront
- Fair market pricing via supply and demand
- Lower commissions; more earnings stay with drivers
- Aligns with bargaining culture in many markets

## Data Model

### Ride Schema (server/models/Ride.js)

| Field | Type | Description |
|-------|------|-------------|
| vehicle | String | bike, human, cabEconomy, cabPremium |
| distance | Number | Kilometers |
| pickup, drop | Object | address, latitude, longitude |
| fare | Number | Final agreed price |
| proposedPrice | Number | Customer's initial offer |
| suggestedPriceRange | Object | min, max |
| pricingModel | String | "fixed" or "bidding" (default: "bidding") |
| offers | Array | riderId, offeredPrice, message, status, createdAt |
| acceptedOffer | Object | riderId, finalPrice |
| status | String | AWAITING_OFFERS, SEARCHING_FOR_RIDER, START, ARRIVED, COMPLETED |

## Price Suggestion Algorithm

`getSuggestedPriceRange(distance, vehicleType, surgeMultiplier)` in `server/utils/mapUtils.js` and `client/src/utils/mapUtils.tsx`:

- Uses Uber-style fare calculation as base
- Min: max(calculatedFare x 0.7, calculatedFare - 5)
- Max: calculatedFare x 1.3
- Suggested: calculated fare
- 30% flexibility range around the fair price

## User Flow

### Customer

1. Enter pickup and destination; system calculates distance
2. Select vehicle type; system shows suggested range (min, suggested, max)
3. Propose price (can accept suggested, go lower with warning, or higher with warning)
4. Submit ride request; status: AWAITING_OFFERS
5. Receive driver offers; compare price, rating, ETA
6. Accept an offer; status: START; price locked

### Driver

1. Receive ride notification (pickup, drop, distance, customer offer, suggested range)
2. Accept customer offer, counter-offer, or reject
3. If counter-offer: customer sees it and can accept or choose another driver
4. If accepted: status START; navigate to pickup

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /ride/create | Create ride with proposedPrice, suggestedPriceRange, pricingModel |
| POST | /ride/offer/:rideId | Submit offer/counter-offer (body: offeredPrice, message) |
| PATCH | /ride/offer/:rideId/:offerId/accept | Accept a driver offer |
| GET | /ride/offers/:rideId | Get all offers for a ride |

### Create Ride Example

```json
POST /ride/create
{
  "vehicle": "bike",
  "pickup": { "address": "...", "latitude": -1.2921, "longitude": 36.8219 },
  "drop": { "address": "...", "latitude": -1.25, "longitude": 36.85 },
  "proposedPrice": 10.50,
  "suggestedPriceRange": { "min": 7.35, "max": 13.65 },
  "pricingModel": "bidding"
}
```

### Submit Offer Example

```json
POST /ride/offer/:rideId
{
  "offeredPrice": 12.00,
  "message": "I can do it for $12 due to traffic"
}
```

## WebSocket Events

| Event | Direction | Description |
|-------|------------|--------------|
| newOffer | Server to Client | Customer receives new driver offer |
| offerAccepted | Server to Client | Driver notified when offer is accepted |

## Validation and Warnings

- Price below min: warn that drivers may not accept; allow "Continue Anyway"
- Price above max: warn about overpaying; allow "Continue Anyway"

## Currency Localization (African Markets)

Supported currencies: KES, NGN, ZAR, GHS, UGX, TZS. Use multipliers to convert from base USD to local currency for display.
