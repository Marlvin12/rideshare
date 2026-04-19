import { StyleProp, TextStyle } from "react-native";

interface CustomButtonProps {
    title: string;
    loading?: boolean;
    onPress?: () => void
    disabled?: boolean
}

interface PhoneInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    countryCode?: string;
    maxLength?: number;
}

export interface CustomTextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';
    style?: StyleProp<TextStyle>;
    fontSize?: number;
    children: React.ReactNode;
    fontFamily?: 'SemiBold' | 'Regular' | 'Bold' | 'Medium' | 'Light';
    numberOfLines?: number;
}

export interface DeliveryStore {
  _id: string;
  name: string;
  description: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  deliveryFee: number;
  minimumOrder: number;
  imageUrl: string;
  coverImage: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  isOpen: boolean;
  featured: boolean;
  preparationTime: number;
  promoCode?: string;
  tags?: string[];
  isRidePassEligible?: boolean;
  distance?: number;
  approvalPercentage?: number;
}

export interface CustomizationGroup {
  _id: string;
  name: string;
  required: boolean;
  minSelection?: number;
  maxSelection?: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  _id: string;
  name: string;
  price: number;
  calories?: number;
  imageUrl?: string;
  selected?: boolean;
}

export interface MenuItemCustomization {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  customizationGroups: CustomizationGroup[];
}
