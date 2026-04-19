import { appAxios } from './apiInterceptors';

export {
  getRestaurantOrders,
  restaurantAcceptOrder,
  restaurantRejectOrder,
  markOrderReady,
} from './foodOrderService';

export const updateMenuItemAvailability = async (
  restaurantId: string,
  itemId: string,
  isAvailable: boolean
) => {
  try {
    const response = await appAxios.patch(
      `/restaurants/${restaurantId}/menu/item/${itemId}/availability`,
      { isAvailable }
    );
    return response.data;
  } catch (error: any) {
    const msg = error?.response?.data?.msg ?? error?.message ?? 'Failed to update availability';
    return { success: false, error: msg };
  }
};

export const setRestaurantOpen = async (restaurantId: string, isOpen: boolean) => {
  try {
    const response = await appAxios.patch(
      `/restaurants/${restaurantId}/partner-status`,
      { isOpen }
    );
    return response.data;
  } catch (error: any) {
    const msg = error?.response?.data?.msg ?? error?.message ?? 'Failed to update status';
    return { success: false, error: msg };
  }
};

export const setRestaurantPreparationTime = async (
  restaurantId: string,
  preparationTime: number
) => {
  try {
    const response = await appAxios.patch(
      `/restaurants/${restaurantId}/partner-preparation-time`,
      { preparationTime }
    );
    return response.data;
  } catch (error: any) {
    const msg = error?.response?.data?.msg ?? error?.message ?? 'Failed to update preparation time';
    return { success: false, error: msg };
  }
};
