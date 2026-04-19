import { create } from 'zustand';
import { DeliveryStore } from '@/utils/types';

export type DeliveryMode = 'Delivery' | 'Pickup';

interface DeliveryFilters {
  cuisine: string;
  priceRange: string;
  minRating: number | null;
  isOpen: boolean | null;
  deliveryFeeMax?: number;
  isRidePassOnly?: boolean;
}

interface DeliveryStoreProps {
  stores: DeliveryStore[];
  selectedStore: DeliveryStore | null;
  searchQuery: string;
  activeCuisine: string;
  deliveryMode: DeliveryMode;
  filters: DeliveryFilters;
  isRidePassFilterOn: boolean;
  isAddressModalOpen: boolean;
  isLoading: boolean;
  
  setStores: (stores: DeliveryStore[]) => void;
  setSelectedStore: (store: DeliveryStore | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveCuisine: (cuisine: string) => void;
  setDeliveryMode: (mode: DeliveryMode) => void;
  setFilters: (filters: Partial<DeliveryFilters>) => void;
  resetFilters: () => void;
  setIsRidePassFilterOn: (value: boolean) => void;
  setIsAddressModalOpen: (value: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearDeliveryData: () => void;
}

const defaultFilters: DeliveryFilters = {
  cuisine: 'All',
  priceRange: '',
  minRating: null,
  isOpen: null,
  deliveryFeeMax: undefined,
  isRidePassOnly: false,
};

export const useDeliveryStore = create<DeliveryStoreProps>((set) => ({
  stores: [],
  selectedStore: null,
  searchQuery: '',
  activeCuisine: 'All',
  deliveryMode: 'Delivery',
  filters: defaultFilters,
  isRidePassFilterOn: false,
  isAddressModalOpen: false,
  isLoading: false,

  setStores: (stores) => set({ stores }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCuisine: (cuisine) => set({ activeCuisine: cuisine }),
  setDeliveryMode: (mode) => set({ deliveryMode: mode }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  resetFilters: () => set({ filters: defaultFilters }),
  setIsRidePassFilterOn: (value) => set({ isRidePassFilterOn: value }),
  setIsAddressModalOpen: (value) => set({ isAddressModalOpen: value }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearDeliveryData: () => set({
    stores: [],
    selectedStore: null,
    searchQuery: '',
    activeCuisine: 'All',
    filters: defaultFilters,
  }),
}));
