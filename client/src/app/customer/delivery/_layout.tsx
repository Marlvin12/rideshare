import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/utils/Constants';

const DeliveryLayout = () => {
  const { colors } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
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
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="basket-outline"
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="search"
              size={RFValue(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Me',
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
        name="store/[storeId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="store/[storeId]/info"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="product/[itemId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracking/[orderId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat/[courierId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="gifting"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="review/[orderId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
};

export default DeliveryLayout;
