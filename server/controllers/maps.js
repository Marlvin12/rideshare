import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/index.js";
import logger from "../config/logger.js";
import {
  reverseGeocode,
  getPlacesSuggestions,
  getPlaceDetails,
  computeRoute,
  snapToRoad,
  validateAddress as validateAddressWithGoogle,
} from "../utils/mapUtils.js";

const setNoStore = (res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
};

export const reverseGeocodeLocation = async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    throw new BadRequestError("Latitude and longitude are required");
  }

  try {
    setNoStore(res);
    const address = await reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    if (!address) {
      return res.status(StatusCodes.OK).json({
        message: "Address unavailable",
        address: "",
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Address retrieved successfully",
      address,
    });
  } catch (error) {
    logger.error({ err: error }, 'Reverse geocode error');
    throw new BadRequestError("Failed to retrieve address");
  }
};

export const getAutocompleteSuggestions = async (req, res) => {
  const { query, latitude, longitude } = req.query;
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (!normalizedQuery) {
    throw new BadRequestError("Query is required");
  }

  try {
    setNoStore(res);
    const location =
      latitude && longitude
        ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        : null;

    const suggestions = await getPlacesSuggestions(normalizedQuery, location);

    res.status(StatusCodes.OK).json({
      message: "Suggestions retrieved successfully",
      suggestions,
    });
  } catch (error) {
    logger.error({ err: error }, 'Autocomplete error');
    throw new BadRequestError("Failed to retrieve suggestions");
  }
};

export const getLocationDetails = async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    throw new BadRequestError("Place ID is required");
  }

  try {
    const details = await getPlaceDetails(placeId);

    if (!details) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Place details not found",
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Place details retrieved successfully",
      details,
    });
  } catch (error) {
    logger.error({ err: error }, 'Place details error');
    throw new BadRequestError("Failed to retrieve place details");
  }
};

export const getRoute = async (req, res) => {
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    mode = "DRIVE",
  } = req.query;

  try {
    setNoStore(res);
    const route = await computeRoute(
      { latitude: parseFloat(originLat), longitude: parseFloat(originLng) },
      {
        latitude: parseFloat(destinationLat),
        longitude: parseFloat(destinationLng),
      },
      mode
    );

    if (!route) {
      return res.status(StatusCodes.OK).json({
        message: "Route unavailable",
        route: null,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "Route retrieved successfully",
      route,
    });
  } catch (error) {
    logger.error({ err: error }, "Route error");
    throw new BadRequestError("Failed to retrieve route");
  }
};

export const snapRoadPoints = async (req, res) => {
  const { points, interpolate = true } = req.body;

  try {
    setNoStore(res);
    const snappedPoints = await snapToRoad(points, interpolate);
    return res.status(StatusCodes.OK).json({
      message: "Points snapped successfully",
      points: snappedPoints,
    });
  } catch (error) {
    logger.error({ err: error }, "Snap road points error");
    throw new BadRequestError("Failed to snap points");
  }
};

export const validateAddress = async (req, res) => {
  const { addressLines, regionCode, locality, administrativeArea, postalCode } =
    req.body;

  try {
    setNoStore(res);
    const validation = await validateAddressWithGoogle({
      address: {
        regionCode,
        locality,
        administrativeArea,
        postalCode,
        addressLines,
      },
    });

    if (!validation) {
      return res.status(StatusCodes.OK).json({
        message: "Address validation unavailable",
        validation: null,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "Address validation completed",
      validation,
    });
  } catch (error) {
    logger.error({ err: error }, "Address validation error");
    throw new BadRequestError("Failed to validate address");
  }
};

