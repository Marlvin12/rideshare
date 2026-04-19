import { create } from 'zustand';
import {
  getRestaurantOrders,
  restaurantAcceptOrder,
  restaurantRejectOrder,
  markOrderReady,
} from '@/service/foodOrderService';

export interface RestaurantOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface RestaurantOrder {
  _id: string;
  orderNumber: string;
  restaurantId: string;
  customerId: { _id: string; name?: string; phone?: string };
  items: RestaurantOrderItem[];
  pricing: {
    itemsTotal: number;
    deliveryFee: number;
    platformFee: number;
    tax: number;
    total: number;
  };
  deliveryAddress: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  status: string;
  estimatedPreparationTime?: number;
  timeline?: Array<{ status: string; timestamp: string; message?: string }>;
  createdAt: string;
  updatedAt: string;
}

interface RestaurantStoreProps {
  restaurantId: string | null;
  orders: RestaurantOrder[];
  isLoading: boolean;
  error: string | null;

  setRestaurantId: (id: string | null) => void;
  setOrders: (orders: RestaurantOrder[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateOrderInList: (orderId: string, updates: Partial<RestaurantOrder>) => void;
  removeOrderFromList: (orderId: string) => void;
  fetchOrders: (status?: string, date?: string) => Promise<{ success: boolean; error?: string }>;
  acceptOrder: (orderId: string, preparationTime?: number) => Promise<{ success: boolean; error?: string }>;
  rejectOrder: (orderId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  setOrderReady: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  clearRestaurantData: () => void;
}

export const useRestaurantStore = create<RestaurantStoreProps>((set, get) => ({
  restaurantId: null,
  orders: [],
  isLoading: false,
  error: null,

  setRestaurantId: (id) => set({ restaurantId: id }),
  setOrders: (orders) => set({ orders }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateOrderInList: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o._id === orderId ? { ...o, ...updates } : o
      ),
    })),

  removeOrderFromList: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((o) => o._id !== orderId),
    })),

  fetchOrders: async (status?, date?) => {
    const { restaurantId } = get();
    if (!restaurantId) {
      set({ error: 'No restaurant selected' });
      return { success: false, error: 'No restaurant selected' };
    }
    set({ isLoading: true, error: null });
    const result = await getRestaurantOrders(restaurantId, status, date);
    set({ isLoading: false });
    if (result.success && result.orders) {
      set({ orders: result.orders as RestaurantOrder[] });
      return { success: true };
    }
    set({
      error: (result as { error?: string }).error ?? 'Failed to load orders',
    });
    return { success: false, error: (result as { error?: string }).error };
  },

  acceptOrder: async (orderId, preparationTime) => {
    set({ error: null });
    const result = await restaurantAcceptOrder(orderId, preparationTime);
    if (result.success && result.order) {
      get().updateOrderInList(orderId, result.order as Partial<RestaurantOrder>);
      return { success: true };
    }
    const err = (result as { error?: string }).error ?? 'Failed to accept order';
    set({ error: err });
    return { success: false, error: err };
  },

  rejectOrder: async (orderId, reason) => {
    set({ error: null });
    const result = await restaurantRejectOrder(orderId, reason);
    if (result.success) {
      get().removeOrderFromList(orderId);
      return { success: true };
    }
    const err = (result as { error?: string }).error ?? 'Failed to reject order';
    set({ error: err });
    return { success: false, error: err };
  },

  setOrderReady: async (orderId) => {
    set({ error: null });
    const result = await markOrderReady(orderId);
    if (result.success && result.order) {
      get().updateOrderInList(orderId, result.order as Partial<RestaurantOrder>);
      return { success: true };
    }
    const err = (result as { error?: string }).error ?? 'Failed to mark ready';
    set({ error: err });
    return { success: false, error: err };
  },

  clearRestaurantData: () =>
    set({
      restaurantId: null,
      orders: [],
      error: null,
    }),
}));
