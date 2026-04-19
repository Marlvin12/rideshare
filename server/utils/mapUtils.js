import axios from 'axios';
import logger from '../config/logger.js';

const getGoogleMapsApiKey = () => process.env.GOOGLE_MAPS_API_KEY;

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimateRideTime = (distanceKm) => {
  const averageCitySpeedKmh = 25;
  return (distanceKm / averageCitySpeedKmh) * 60;
};

export const calculateSurgeMultiplier = (activeRides = 0, availableRiders = 0, timeOfDay = null) => {
  if (availableRiders === 0) return 2.0;
  
  const demandSupplyRatio = activeRides / availableRiders;
  
  let surgeMultiplier = 1.0;
  
  if (demandSupplyRatio > 3.0) {
    surgeMultiplier = 2.5;
  } else if (demandSupplyRatio > 2.0) {
    surgeMultiplier = 2.0;
  } else if (demandSupplyRatio > 1.5) {
    surgeMultiplier = 1.5;
  } else if (demandSupplyRatio > 1.0) {
    surgeMultiplier = 1.3;
  }
  
  const hour = timeOfDay ? new Date(timeOfDay).getHours() : new Date().getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  if (isPeakHour && surgeMultiplier < 1.2) {
    surgeMultiplier = 1.2;
  }
  
  return Math.round(surgeMultiplier * 10) / 10;
};

export const calculateFare = (distance, surgeMultiplier = 1.0) => {
  const estimatedTimeMinutes = estimateRideTime(distance);
  
  const rateStructure = {
    bike: {
      baseFare: 2.0,
      costPerMinute: 0.15,
      costPerKm: 0.8,
      bookingFee: 1.5,
      minimumFare: 5.0,
    },
    human: {
      baseFare: 3.0,
      costPerMinute: 0.20,
      costPerKm: 1.0,
      bookingFee: 2.0,
      minimumFare: 7.0,
    },
    cabEconomy: {
      baseFare: 4.0,
      costPerMinute: 0.30,
      costPerKm: 1.5,
      bookingFee: 2.5,
      minimumFare: 10.0,
    },
    cabPremium: {
      baseFare: 6.0,
      costPerMinute: 0.50,
      costPerKm: 2.5,
      bookingFee: 3.5,
      minimumFare: 15.0,
    },
  };

  const fareCalculation = (baseFare, costPerMinute, costPerKm, bookingFee, minimumFare) => {
    const standardFare = 
      baseFare + 
      (costPerMinute * estimatedTimeMinutes) + 
      (costPerKm * distance) + 
      bookingFee;
    
    const fareWithSurge = standardFare * surgeMultiplier;
    return Math.max(fareWithSurge, minimumFare);
  };

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.costPerMinute,
      rateStructure.bike.costPerKm,
      rateStructure.bike.bookingFee,
      rateStructure.bike.minimumFare
    ),
    human: fareCalculation(
      rateStructure.human.baseFare,
      rateStructure.human.costPerMinute,
      rateStructure.human.costPerKm,
      rateStructure.human.bookingFee,
      rateStructure.human.minimumFare
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.costPerMinute,
      rateStructure.cabEconomy.costPerKm,
      rateStructure.cabEconomy.bookingFee,
      rateStructure.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.costPerMinute,
      rateStructure.cabPremium.costPerKm,
      rateStructure.cabPremium.bookingFee,
      rateStructure.cabPremium.minimumFare
    ),
    estimatedTime: Math.round(estimatedTimeMinutes),
    surgeMultiplier: surgeMultiplier,
  };
};

const DELIVERY_FEE_BASE = 1.0;
const DELIVERY_FEE_PER_KM = 0.4;
const DELIVERY_FEE_PER_MIN = 0.08;
const DELIVERY_FEE_MIN = 2.0;
const DELIVERY_FEE_MAX = 15.0;

export const calculateDeliveryFeeEstimate = (distanceKm) => {
  const estimatedMinutes = estimateRideTime(distanceKm);
  const raw =
    DELIVERY_FEE_BASE +
    DELIVERY_FEE_PER_KM * distanceKm +
    DELIVERY_FEE_PER_MIN * estimatedMinutes;
  const clamped = Math.max(DELIVERY_FEE_MIN, Math.min(DELIVERY_FEE_MAX, raw));
  return Math.round(clamped * 100) / 100;
};

export const getDeliveryFeeRange = (distanceKm) => {
  const estimate = calculateDeliveryFeeEstimate(distanceKm);
  const min = Math.max(DELIVERY_FEE_MIN, Math.round((estimate * 0.7) * 100) / 100);
  const max = Math.min(DELIVERY_FEE_MAX, Math.round((estimate * 1.4) * 100) / 100);
  return { min, max, estimate };
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const getSuggestedPriceRange = (distance, vehicleType, surgeMultiplier = 1.0) => {
  const fareBreakdown = calculateFare(distance, surgeMultiplier);
  const calculatedFare = fareBreakdown[vehicleType];
  
  const minPrice = Math.max(calculatedFare * 0.7, fareBreakdown[vehicleType] - 5);
  const maxPrice = calculatedFare * 1.3;
  const suggestedPrice = calculatedFare;
  
  return {
    min: Math.round(minPrice * 100) / 100,
    max: Math.round(maxPrice * 100) / 100,
    suggested: Math.round(suggestedPrice * 100) / 100,
    calculatedFare: Math.round(calculatedFare * 100) / 100,
  };
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      logger.error({ latitude, longitude }, 'Reverse geocoding: invalid coordinates');
      return null;
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: getGoogleMapsApiKey(),
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results[0]) {
      return response.data.results[0].formatted_address;
    }

    if (response.data.status === 'REQUEST_DENIED') {
      logger.error({ error_message: response.data.error_message }, 'Reverse geocoding: API key denied');
    } else if (response.data.status === 'INVALID_REQUEST') {
      logger.error({ latitude, longitude, status: response.data.status }, 'Reverse geocoding: invalid request');
    } else if (response.data.status === 'ZERO_RESULTS') {
      logger.warn({ latitude, longitude }, 'Reverse geocoding: no results');
    } else {
      logger.error({ status: response.data.status, error_message: response.data.error_message }, 'Reverse geocoding: unexpected status');
    }
    
    return null;
  } catch (error) {
    logger.error({ err: error, latitude, longitude }, 'Reverse geocoding failed');
    return null;
  }
};

export const getPlacesSuggestions = async (query, location) => {
  try {
    const normalizedQuery = typeof query === 'string' ? query.trim() : '';
    if (!normalizedQuery) return [];

    const params = {
      input: normalizedQuery,
      key: getGoogleMapsApiKey(),
    };
    
    if (location?.latitude && location?.longitude) {
      params.location = `${location.latitude},${location.longitude}`;
      params.radius = 50000;
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      { params }
    );
    
    if (response.data.status === 'OK' && response.data.predictions) {
      return response.data.predictions.map((item) => ({
        place_id: item.place_id,
        title: item.structured_formatting.main_text,
        description: item.description,
      }));
    }
    logger.warn(
      {
        query: normalizedQuery,
        status: response.data.status,
        error_message: response.data.error_message,
      },
      'Places autocomplete returned non-OK status'
    );
    return [];
  } catch (error) {
    logger.error({ err: error }, 'Places suggestions failed');
    return [];
  }
};

export const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          placeid: placeId,
          key: getGoogleMapsApiKey(),
        },
      }
    );
    
    if (response.data.status === 'OK' && response.data.result) {
      const location = response.data.result.geometry.location;
      const address = response.data.result.formatted_address;
      return {
        latitude: location.lat,
        longitude: location.lng,
        address: address,
      };
    }
    return null;
  } catch (error) {
    logger.error({ err: error }, 'Place details failed');
    return null;
  }
};

const parseDurationSeconds = (duration) => {
  if (typeof duration !== 'string') return null;
  const clean = duration.endsWith('s') ? duration.slice(0, -1) : duration;
  const val = Number(clean);
  return Number.isFinite(val) ? val : null;
};

export const computeRoute = async (origin, destination, travelMode = 'DRIVE') => {
  try {
    const response = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode,
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en-US',
        units: 'METRIC',
      },
      {
        headers: {
          'X-Goog-Api-Key': getGoogleMapsApiKey(),
          'X-Goog-FieldMask': [
            'routes.distanceMeters',
            'routes.duration',
            'routes.polyline.encodedPolyline',
            'routes.legs.distanceMeters',
            'routes.legs.duration',
            'routes.legs.polyline.encodedPolyline',
          ].join(','),
        },
      }
    );

    const route = response.data?.routes?.[0];
    if (!route) return null;

    return {
      distanceMeters: route.distanceMeters ?? null,
      durationSeconds: parseDurationSeconds(route.duration),
      encodedPolyline: route.polyline?.encodedPolyline ?? null,
      legs: (route.legs || []).map((leg) => ({
        distanceMeters: leg.distanceMeters ?? null,
        durationSeconds: parseDurationSeconds(leg.duration),
        encodedPolyline: leg.polyline?.encodedPolyline ?? null,
      })),
    };
  } catch (error) {
    logger.error({ err: error }, 'Compute route failed');
    return null;
  }
};

export const snapToRoad = async (points, interpolate = true) => {
  try {
    if (!Array.isArray(points) || points.length === 0) return [];
    const normalized = points
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .slice(0, 100);
    if (normalized.length === 0) return [];

    const path = normalized
      .map((p) => `${p.latitude},${p.longitude}`)
      .join('|');

    const response = await axios.get('https://roads.googleapis.com/v1/snapToRoads', {
      params: {
        path,
        interpolate,
        key: getGoogleMapsApiKey(),
      },
    });

    const snapped = response.data?.snappedPoints || [];
    return snapped.map((item) => ({
      latitude: item.location?.latitude ?? null,
      longitude: item.location?.longitude ?? null,
      placeId: item.placeId ?? null,
      originalIndex: item.originalIndex ?? null,
    }));
  } catch (error) {
    logger.error({ err: error }, 'Snap to road failed');
    return [];
  }
};

export const validateAddress = async (payload) => {
  try {
    const response = await axios.post(
      'https://addressvalidation.googleapis.com/v1:validateAddress',
      payload,
      {
        params: { key: getGoogleMapsApiKey() },
      }
    );
    return response.data ?? null;
  } catch (error) {
    logger.error({ err: error }, 'Address validation failed');
    return null;
  }
};
