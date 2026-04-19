export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  ADDRESS_OUT_OF_RANGE: "Your address is outside this restaurant's delivery area. Please choose a closer location.",
  ITEMS_UNAVAILABLE: "One or more items in your cart are no longer available.",
  MINIMUM_ORDER_NOT_MET: "Your order doesn't meet the minimum amount for this restaurant.",
  RESTAURANT_CLOSED: "This restaurant is currently closed. Please try again later.",
  RESTAURANT_NOT_FOUND: "We couldn't find this restaurant. Please go back and try again.",
  PRICE_CHANGED: "The price of your order has changed. Please review the updated total before continuing.",
  DUPLICATE_ORDER: "This order has already been placed.",
  NETWORK_ERROR: "You appear to be offline. Please check your connection and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again.",
};

export const getCheckoutErrorMessage = (code: string): string =>
  CHECKOUT_ERROR_MESSAGES[code] ?? "We couldn't place your order. Please try again.";

export const ErrorMessages = {
  network: {
    offline: "You appear to be offline. Please check your connection and try again.",
    timeout: "The request took too long. Please try again.",
    serverError: "Something went wrong on our end. Please try again shortly.",
    unknown: "An unexpected error occurred. Please try again.",
  },

  ride: {
    createFailed: "We couldn't create your ride. Please try again.",
    acceptFailed: "We couldn't accept this ride. Please try again.",
    updateFailed: "We couldn't update the ride status. Please try again.",
    ratingFailed: "We couldn't submit your rating. Please try again.",
    sameLocations: "Pickup and drop-off locations must be different.",
    tooClose: "The selected locations are too close together. Please choose locations at least 500m apart.",
    tooFar: "The selected locations are too far apart. Please choose a closer drop-off location.",
    noRidersAvailable: "No riders are available right now. Please try again in a few minutes.",
  },

  auth: {
    loginFailed: "We couldn't sign you in. Please check your credentials and try again.",
    otpFailed: "We couldn't verify your code. Please check and try again.",
    otpExpired: "Your verification code has expired. Please request a new one.",
    sessionExpired: "Your session has expired. Please sign in again.",
    refreshFailed: "Your session couldn't be renewed. Please sign in again.",
  },

  food: {
    fetchRestaurantsFailed: "We couldn't load restaurants. Pull down to refresh.",
    fetchMenuFailed: "We couldn't load the menu. Please try again.",
    orderFailed: "We couldn't place your order. Please try again.",
    cartEmpty: "Your cart is empty. Add items before checking out.",
    minimumOrderNotMet: "Your order doesn't meet the minimum amount for this restaurant.",
    restaurantClosed: "This restaurant is currently closed.",
  },

  location: {
    permissionDenied: "Location access is needed for ride services. Please enable it in Settings.",
    fetchFailed: "We couldn't determine your location. Please try again.",
    geocodeFailed: "We couldn't find that address. Please try a different search.",
  },

  account: {
    updateFailed: "We couldn't update your account. Please try again.",
    kycFailed: "We couldn't process your verification. Please try again.",
  },

  generic: {
    tryAgain: "Something went wrong. Please try again.",
    loadFailed: "We couldn't load this content. Pull down to refresh.",
    saveFailed: "We couldn't save your changes. Please try again.",
  },
} as const;

export const getNetworkErrorMessage = (error: any): string => {
  if (!error) return ErrorMessages.generic.tryAgain;

  if (error.message === "Network Error" || !error.response) {
    return ErrorMessages.network.offline;
  }

  if (error.code === "ECONNABORTED") {
    return ErrorMessages.network.timeout;
  }

  const status = error.response?.status;
  if (status && status >= 500) {
    return ErrorMessages.network.serverError;
  }

  if (status === 401) {
    return ErrorMessages.auth.sessionExpired;
  }

  if (status === 403) {
    return "You don't have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return ErrorMessages.generic.tryAgain;
};
