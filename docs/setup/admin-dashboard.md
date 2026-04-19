# Admin Dashboard Guide

Web-based admin portal for managing users, KYC verification, rides, and financials.

## Overview

The admin dashboard is a React + Vite web app that connects to the rideshare backend. It provides analytics, user management, KYC approval/rejection, ride monitoring, and financial tracking.

## Tech Stack

- React 18, Vite
- Zustand (state), Axios (HTTP)
- Recharts (charts), Tailwind CSS, Lucide React
- Socket.io Client (real-time ready)

## Starting the Dashboard

### 1. Start Backend

```bash
cd server
npm start
```

Server runs at http://localhost:3000

### 2. Start Admin Dashboard

```bash
cd admin-web
npm run dev
```

Dashboard at http://localhost:5173

### 3. Login

- URL: http://localhost:5173
- Email: `admin@ride.com`
- Password: `admin123`

**Change these credentials in production.**

## Features

### Dashboard Analytics
- Total users (customers + riders)
- Active rides
- Total revenue
- Pending KYC count
- 7-day ride and revenue charts

### User Management
- View all customers and riders
- Filter by role (customer/rider/all)
- Search by phone or name
- User stats: rides, rating, earnings, KYC status

### KYC Management
- View submissions by status (pending/submitted/approved/rejected)
- Review: name, ID type, ID number, DOB, address
- Document viewer: ID front/back images
- Approve (one-click) or reject (with mandatory reason)

### Ride Monitoring
- Filter by status: AWAITING_OFFERS, SEARCHING_FOR_RIDER, START, ARRIVED, COMPLETED
- Ride details: vehicle, pickup/drop, distance, fare, customer/rider info, bidding offers

### Financial Dashboard
- Total revenue, platform fees (20%), rider earnings (80%)
- Revenue by vehicle type (pie chart)
- 6-month revenue trend
- Recent transactions table

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/login | Admin authentication |
| GET | /admin/dashboard | Dashboard stats and charts |
| GET | /admin/users | Users (role filter) |
| GET | /admin/rides | Rides (status filter) |
| GET | /admin/kyc | KYC submissions |
| GET | /admin/financials | Financial data |
| POST | /kyc/approve | Approve KYC |
| POST | /kyc/reject | Reject KYC with reason |

## File Structure

```
admin-web/
  src/
    components/
      Layout.jsx
    pages/
      Dashboard.jsx
      Users.jsx
      Rides.jsx
      KYCManagement.jsx
      Financials.jsx
      Login.jsx
    services/
      api.js
      websocket.js
    store/
      authStore.js
      dataStore.js
    config.js
    App.jsx
    main.jsx
```

## Common Workflows

### Approve KYC
1. KYC Management > filter "submitted"
2. Review info and documents (View Front ID)
3. Click Approve

### Reject KYC
1. KYC Management > select submission
2. Click Reject
3. Enter reason (e.g. "ID image is blurry")
4. Confirm Reject

### Monitor Rides
1. Rides > filter "START" or "ARRIVED"
2. View active rides and details

### Track Financials
1. Financials
2. View summary cards and charts
3. Review recent transactions

## Troubleshooting

**Dashboard shows 0 for all stats**
- No data in database yet. Create test rides and users.

**KYC images broken**
- Ensure mobile app stores images as base64.

**Login fails**
- Backend not running or wrong URL. Start server; check `admin-web/src/config.js`.

**Charts not displaying**
- Ensure completed rides exist in DB.

## Production Deployment

### Frontend (Vercel/Netlify)

```bash
cd admin-web
npm run build
```

Deploy the `dist/` folder.

### Environment Variables

```env
# Backend
ACCESS_TOKEN_SECRET=your_secret
MONGO_URI=your_mongodb_url

# Frontend (config.js)
API_URL=https://your-api.com
WS_URL=wss://your-api.com
```
