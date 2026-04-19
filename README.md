# Xigoa - Full-Stack Mobility Platform

A modern, real-time rideshare and delivery application built with React Native (Expo) and Node.js, featuring live tracking, KYC verification, food delivery, and dynamic earnings for drivers.

## Overview

Xigoa is a comprehensive rideshare and delivery platform that connects passengers with drivers in real-time. The app features separate interfaces for customers, drivers, restaurant owners, and platform admins, with real-time location tracking, an inDrive-style bidding system, KYC verification for drivers, and dynamic earnings calculation.

## Key Features

### For Customers
- **Real-time Location Tracking** - Track your driver's location in real-time on the map
- **Smart Route Planning** - Select pickup and drop locations with autocomplete
- **Transparent Pricing** - See estimated fares before booking
- **inDrive-Style Bidding** - Propose your price; drivers can accept or counter-offer
- **Multiple Vehicle Options** - Choose from bikes, economy cabs, and premium cabs
- **Food Delivery** - Order from restaurants with real-time order tracking
- **OTP Verification** - Secure ride confirmation with OTP

### For Drivers/Riders
- **KYC Verification** - Mandatory identity verification (National ID, Passport, Driver's License)
- **Dynamic Earnings Tracking** - Real-time earnings calculation (80% to driver, 20% platform fee)
- **Smart Ride Matching** - Receive ride offers within 60km radius
- **Statistics Dashboard** - Track total rides, completed rides, and ratings
- **On/Off Duty Toggle** - Control availability status
- **Navigation Assist** - One-tap navigation to pickup via Google Maps, Waze, or Apple Maps

### Real-time Features
- **WebSocket Integration** - Instant bidirectional communication
- **Live Map Updates** - Real-time driver location on customer's map
- **In-App Chat** - Message between rider and passenger during a ride
- **Rating System** - Post-ride ratings with feedback

## Tech Stack

### Frontend (Client)
- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Maps**: React Native Maps with Google Maps
- **Real-time**: Socket.io Client
- **Authentication**: Firebase Phone Authentication
- **HTTP Client**: Axios
- **Styling**: React Native StyleSheet with responsive design

### Backend (Server)
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io Server
- **Authentication**: JWT + Firebase Admin SDK
- **Security**: Helmet, CORS, rate limiting, bcryptjs

### Admin Dashboard (admin-web)
- **Framework**: React 18 with Vite
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS

### Merchant web (separate repositories)
Merchant storefront, menu, and order APIs live on this server under `/api/merchant`. A merchant site in **another git repo and deployment** talks to this API only over HTTPS: set that app’s public API base URL to this server (e.g. `https://api.example.com/api`), use the **same Firebase project** as the server’s Firebase Admin config, send `Authorization: Bearer <Firebase ID token>`, and add that site’s origin to `CORS_ORIGIN` here. There is no monorepo or shared package between repos—contract is HTTP + env only.

## Project Structure

```
rideshare/
├── client/                    # React Native mobile app
│   ├── src/
│   │   ├── app/              # Expo Router pages
│   │   │   ├── customer/     # Customer screens (home, rides, eats, delivery)
│   │   │   ├── rider/        # Driver screens (home, live ride, KYC)
│   │   │   ├── restaurant/   # Restaurant management screens
│   │   │   └── _layout.tsx   # Root layout
│   │   ├── components/       # Reusable components
│   │   │   ├── customer/     # Customer components
│   │   │   ├── rider/        # Rider components
│   │   │   ├── delivery/     # Delivery components
│   │   │   ├── restaurant/   # Restaurant components
│   │   │   └── shared/       # Shared components
│   │   ├── service/          # API services and WebSocket
│   │   ├── store/            # Zustand stores
│   │   ├── styles/           # Style definitions
│   │   └── utils/            # Utility functions
│   ├── app.json              # Expo configuration
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── controllers/          # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── services/             # Business logic (AI agent)
│   ├── utils/                # Helper functions
│   ├── config/               # DB, Firebase, Redis config
│   ├── jobs/                 # Background jobs
│   └── app.js                # Express app setup
│
├── admin-web/                 # React admin dashboard
│   ├── src/
│   │   ├── components/       # Layout components
│   │   ├── pages/            # Dashboard, Users, Rides, KYC, Financials
│   │   ├── services/         # API and WebSocket clients
│   │   └── store/            # Auth and data stores
│   └── package.json
│
└── docs/                      # Project documentation
    ├── setup/                # Setup and configuration guides
    ├── features/             # Feature documentation
    ├── design/               # Design system reference
    ├── audits/               # Architecture and security audits
    └── troubleshooting/      # Debugging guides
```

## Quick Start

### Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- Google Maps API key (with Maps SDK, Directions API, Geocoding API enabled)
- Firebase project with Phone Authentication enabled

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install --legacy-peer-deps
```

### 2. Configure Environment

Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/ride_app
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=4d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=30d
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
PORT=3000
```

### 3. Start the Server

```bash
cd server && npm start
```

### 4. Start the Client

```bash
cd client && npx expo start
```

For detailed setup instructions, see [docs/setup/quick-start.md](docs/setup/quick-start.md).

## Documentation

All project documentation is organized in the `docs/` folder:

### Setup
- [Quick Start Guide](docs/setup/quick-start.md) - Full setup and configuration
- [MongoDB Setup](docs/setup/mongodb-setup.md) - Local and Atlas database configuration
- [Admin Dashboard](docs/setup/admin-dashboard.md) - Admin portal setup and usage
- [iOS Build Fix](docs/setup/ios-build-fix.md) - Xcode compatibility workarounds

### Features
- [Pricing Algorithm](docs/features/pricing-algorithm.md) - Uber-style dynamic pricing
- [Bidding System](docs/features/bidding-system.md) - inDrive-style price negotiation
- [Rider and Passenger Flow](docs/features/rider-passenger-flow.md) - Enhanced UX features
- [OTP Verification](docs/features/otp-verification.md) - Ride verification flow
- [Vehicle Images](docs/features/vehicle-images.md) - Dynamic vehicle image API
- [AI Agent](docs/features/ai-agent.md) - AI-powered admin automation

### Design
- [Design System](docs/design/design-system.md) - Colors, typography, components, patterns

### Audits
- [UI/UX and Scalability Audit](docs/audits/ui-ux-scalability-audit.md)
- [Client Architecture Audit](docs/audits/client-architecture-audit.md)
- [Server Audit](docs/audits/server-audit.md)

### Troubleshooting
- [Ride Broadcast Debugging](docs/troubleshooting/ride-broadcast-debug.md)

## API Endpoints

### Authentication
- `POST /auth/signin` - Login/Register with phone
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/firebase-signin` - Firebase phone auth

### Rides
- `POST /ride/create` - Create ride with price proposal
- `POST /ride/offer/:rideId` - Submit driver offer
- `PATCH /ride/offer/:rideId/:offerId/accept` - Accept offer
- `POST /ride/update-status` - Update ride status
- `POST /ride/rate/:rideId` - Rate ride
- `GET /ride/my-rides` - Get ride history

### Food Orders
- `POST /food-orders` - Create food order
- `POST /food-orders/:id/bid` - Place delivery bid
- `POST /food-orders/:id/accept-bid` - Accept delivery bid
- `GET /food-orders/my-orders` - Get order history

### Admin
- `POST /admin/login` - Admin authentication
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/rides` - Ride monitoring
- `GET /admin/kyc` - KYC submissions
- `GET /admin/financials` - Financial data

## WebSocket Events

### Customer Events
- `subscribeToZone` - Subscribe to nearby riders
- `searchrider` - Start searching for a rider
- `cancelRide` - Cancel active ride
- `sendChatMessage` - Send message to driver

### Rider Events
- `subscribeRider` - Register rider online
- `onOffDuty` - Toggle availability
- `updateLocation` - Update rider location
- `rideOffer` - Receive ride offers
- `rideAccepted` - Ride accepted confirmation

## Earnings Calculation

```
Platform Fee: 20%
Driver Share: 80%

Example:
  Ride Fare: $10.00
  Driver Earnings: $8.00
  Platform Fee: $2.00
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**Malvin** - [Marlvin12](https://github.com/Marlvin12)
