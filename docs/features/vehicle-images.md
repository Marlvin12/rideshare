# Dynamic Vehicle Images

## Overview

Vehicle images are generated dynamically using the PlateToVIN API. No API key required. Fallback images from Unsplash when data is missing or the API fails.

## PlateToVIN API

- Free, no API key
- AI-generated images from make, model, year, color
- URL-based; no authentication

## URL Format

```
https://images.platetovin.com/api/image?search={MAKE+MODEL}&year={YEAR}&angle={ANGLE}&background={BACKGROUND}&color={COLOR}
```

**Parameters:**

| Param | Example | Options |
|-------|---------|---------|
| search | Toyota+Camry | Make and model |
| year | 2022 | Manufacturing year |
| angle | front_angle | front, front_angle, side, rear, interior |
| background | studio | studio, transparent, white |
| color | black | black, white, silver, red, etc. |

## Vehicle Image Service

`client/src/utils/vehicleImageService.tsx`

- `getVehicleImageUrl(make, model, year?, color?, angle?, background?)` - Builds PlateToVIN URL
- `getFallbackVehicleImage(vehicleType)` - Unsplash fallbacks for bike, auto, cabEconomy, cabPremium, default
- `getOptimizedVehicleImage(options)` - Uses API if make+model present, else fallback

## Vehicle Info (User Model)

`server/models/User.js` - `vehicle` object:

- type: bike, auto, cabEconomy, cabPremium
- make, model, year, color
- licensePlate
- photo (optional URL)

## Driver Profile Card Integration

`client/src/components/customer/DriverProfileCard.tsx` uses `getOptimizedVehicleImage` with driver vehicle data. Falls back to generic images on error or missing data.
