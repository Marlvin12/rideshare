import { router } from "expo-router";
import { appAxios } from "./apiInterceptors";
import { Alert } from "react-native";
import { resetAndNavigate } from "@/utils/Helpers";
import { ErrorMessages, getNetworkErrorMessage } from "@/utils/errorMessages";

interface coords {
  address: string;
  latitude: number;
  longitude: number;
}

export const createRide = async (payload: {
  vehicle: "bike" | "auto" | "cabEconomy" | "cabPremium";
  pickup: coords;
  drop: coords;
  pricingModel?: "fixed" | "bidding";
  proposedPrice?: number;
  suggestedPriceRange?: { min: number; max: number };
}) => {
  try {
    const res = await appAxios.post(`/ride/create`, payload);
    const rideId = res?.data?.ride?._id;
    if (rideId) {
      router.push(`/customer/liveride?id=${encodeURIComponent(String(rideId))}`);
    } else {
      Alert.alert("Ride Error", ErrorMessages.ride.createFailed);
    }
  } catch (error: any) {
    const backendMessage =
      typeof error?.response?.data?.msg === "string" && error.response.data.msg
        ? error.response.data.msg
        : null;
    const errorMessage = backendMessage || getNetworkErrorMessage(error) || ErrorMessages.ride.createFailed;
    Alert.alert("Ride Error", errorMessage);
    if (__DEV__) {
      console.error("createRide failed:", {
        status: error?.response?.status,
        message: error?.message,
        backendMessage,
      });
    }
  }
};

const TERMINAL_RIDE_STATUSES = ["COMPLETED", "CANCELLED", "EXPIRED", "NO_RIDERS_FOUND"];
const MAX_ACTIVE_RIDE_AGE_MS = 2 * 60 * 60 * 1000;
const isAuthOrNotFoundError = (status?: number) => status === 401 || status === 403 || status === 404;

export const getMyRides = async (isCustomer: boolean = true) => {
  try {
    const res = await appAxios.get(`/ride/rides`);
    const now = Date.now();
    const activeRides = res.data.rides?.filter((ride: any) => {
      if (TERMINAL_RIDE_STATUSES.includes(ride?.status)) return false;
      const createdAt = ride?.createdAt ? new Date(ride.createdAt).getTime() : 0;
      if (now - createdAt > MAX_ACTIVE_RIDE_AGE_MS) return false;
      return true;
    });
    if (activeRides?.length > 0) {
      const activeRideId = activeRides[0]?._id;
      if (activeRideId) {
        const target = isCustomer ? "/customer/liveride" : "/rider/liveride";
        router.push(`${target}?id=${encodeURIComponent(String(activeRideId))}`);
      }
    }
  } catch (error: any) {
    const status = error?.response?.status;
    if (__DEV__ && !isAuthOrNotFoundError(status)) {
      console.error("getMyRides failed:", error?.message);
    }
  }
};

export const getRideById = async (rideId: string) => {
  try {
    const res = await appAxios.get(`/ride/${encodeURIComponent(rideId)}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const ride = res?.data?.ride ?? null;
    return { success: !!ride, ride };
  } catch (error: any) {
    const status = error?.response?.status;
    if (__DEV__ && status !== 404) {
      console.error("getRideById failed:", error?.message);
    }
    return { success: false, ride: null };
  }
};

export const getLatestActiveRide = async () => {
  try {
    const res = await appAxios.get(`/ride/rides`, {
      params: { limit: 20, page: 1 },
      headers: { 'Cache-Control': 'no-cache' },
    });
    const rides = res?.data?.rides || [];
    const activeRide =
      rides.find(
        (ride: any) =>
          !TERMINAL_RIDE_STATUSES.includes(ride?.status) && ride?.createdAt
      ) || null;
    return { success: !!activeRide, ride: activeRide };
  } catch (error: any) {
    const status = error?.response?.status;
    if (__DEV__ && !isAuthOrNotFoundError(status)) {
      console.error("getLatestActiveRide failed:", error?.message);
    }
    return { success: false, ride: null };
  }
};

export const acceptRideOffer = async (rideId: string) => {
  try {
    const res = await appAxios.patch(`/ride/accept/${rideId}`);
    resetAndNavigate({
      pathname: "/rider/liveride",
      params: { id: rideId },
    });
  } catch (error: any) {
    Alert.alert("Ride Error", ErrorMessages.ride.acceptFailed);
  }
};

export const updateRideStatus = async (rideId: string, status: string) => {
  try {
    const res = await appAxios.patch(`/ride/update/${rideId}`, { status });
    return true;
  } catch (error: any) {
    Alert.alert("Ride Error", ErrorMessages.ride.updateFailed);
    return false;
  }
};

export const submitRating = async (
  rideId: string,
  rating: number,
  feedback: string
) => {
  try {
    const res = await appAxios.post(`/ride/rate/${rideId}`, {
      rating,
      feedback,
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    Alert.alert("Rating Error", ErrorMessages.ride.ratingFailed);
    return { success: false };
  }
};

export interface RatingHistoryItem {
  rideId: string;
  date: string;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
  counterpart: { _id: string; name: string; profilePhoto?: string } | null;
  myRole: 'customer' | 'rider';
  givenRating: number | null;
  givenFeedback: string;
  receivedRating: number | null;
}

export const getRatingHistory = async (page = 1, limit = 20) => {
  try {
    const res = await appAxios.get('/ride/ratings', { params: { page, limit } });
    return {
      success: true,
      ratings: (res.data.ratings ?? []) as RatingHistoryItem[],
      total: res.data.total ?? 0,
      totalPages: res.data.totalPages ?? 1,
    };
  } catch {
    return { success: false, ratings: [], total: 0, totalPages: 1 };
  }
};
