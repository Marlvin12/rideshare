# Rider and Passenger Flow

## Overview

Enhanced Uber-style flows for passengers and drivers, including driver profiles, chat, ratings, cancellation, earnings, and navigation.

## Passenger Flow

### DriverProfileCard

`client/src/components/customer/DriverProfileCard.tsx`

- Driver name, avatar, star rating, total reviews, completed rides
- ETA, call and message buttons
- Vehicle and license plate info

### ChatModal

`client/src/components/shared/ChatModal.tsx`

- Real-time messaging between rider and passenger
- Quick replies ("I'm on my way", "Running late", etc.)
- Message history, keyboard-aware scrolling

### RatingModal

`client/src/components/shared/RatingModal.tsx`

- 5-star rating, contextual feedback prompts
- Optional text feedback (300 char limit), skip option
- Updates rider average rating

### CancellationModal

`client/src/components/shared/CancellationModal.tsx`

- Predefined reasons (driver taking too long, wrong pickup, changed mind, found another ride, driver asked to cancel, price too high, other)
- Warning about rating impact, confirmation flow

## Driver Flow

### Ride Offer Display

`client/src/components/rider/RiderRidesItem.tsx`

- Pickup distance and estimated time
- Trip distance and duration
- Earnings in green, 12-second countdown timer

### EarningsDashboard

`client/src/components/rider/EarningsDashboard.tsx`

- Total earnings, available balance
- Today/Week/Month stats
- Rides completed, hours online, average per ride
- Bonus progress, withdraw button
- Accessed via RiderHeader earnings tap

### NavigationAssist

`client/src/components/rider/NavigationAssist.tsx`

- One-tap navigation to pickup or drop-off
- Google Maps, Waze, Apple Maps (iOS)
- Shows destination address

## Backend Enhancements

### Ride Model (server/models/Ride.js)

- acceptedAt, arrivedAt, completedAt
- rating: riderRating, customerRating, riderFeedback, customerFeedback

### Rating Endpoint

```
POST /ride/rate/:rideId
Body: { rating: number (1-5), feedback?: string (max 1000 chars) }
```

### Chat System (server/controllers/sockets.js)

- sendChatMessage - send message
- chatMessage - receive message
- getChatHistory - fetch previous messages

### Driver Matching

- Sort by distance (closest first)
- Top 10 closest drivers only
- Staggered notifications (500ms between each)
- Include pickup distance (km) and estimated pickup time

## Socket Events

| Client to Server | Server to Client |
|------------------|------------------|
| sendChatMessage | chatMessage |
| getChatHistory | chatHistory |
| | rideAccepted (with driver profile) |

rideOffer includes: pickupDistance, estimatedPickupTime

## Component Integration

### Passenger Live Ride

```tsx
import DriverProfileCard from "@/components/customer/DriverProfileCard";
import ChatModal from "@/components/shared/ChatModal";
import RatingModal from "@/components/shared/RatingModal";
import CancellationModal from "@/components/shared/CancellationModal";

<DriverProfileCard
  driver={{ name, phone, rating, totalRatings, completedRides, vehicle }}
  estimatedArrival={5}
  onMessage={() => setShowChat(true)}
/>
```

### Driver Active Ride

```tsx
import NavigationAssist from "@/components/rider/NavigationAssist";

<NavigationAssist
  pickupLocation={{ latitude, longitude, address }}
  dropLocation={ride.drop}
  isPickedUp={ride.status === "ARRIVED"}
/>
```
