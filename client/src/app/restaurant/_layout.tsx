import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useThemeStore } from '@/store/themeStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Colors } from '@/utils/Constants';

const RESTAURANT_ID_FROM_ENV = process.env.EXPO_PUBLIC_RESTAURANT_ID ?? null;

const RestaurantLayout = () => {
  const { colors } = useThemeStore();
  const { restaurantId, setRestaurantId } = useRestaurantStore();

  useEffect(() => {
    if (!restaurantId && RESTAURANT_ID_FROM_ENV) {
      setRestaurantId(RESTAURANT_ID_FROM_ENV);
    }
  }, [restaurantId, setRestaurantId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: colors.textSecondary ?? Colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background ?? Colors.white,
          borderTopColor: colors.divider ?? Colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'NotoSans-Regular',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="order/[orderId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
};

export default RestaurantLayout;
