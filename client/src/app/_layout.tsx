import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WSProvider } from "@/service/WSProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import OfflineIndicator from "@/components/shared/OfflineIndicator";

const Layout = () => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <WSProvider>
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="auth-email" />
              <Stack.Screen name="otp-verify" />
              <Stack.Screen name="complete-profile" />
              <Stack.Screen name="customer/selectlocations" />
              <Stack.Screen name="customer/ridebooking" />
              <Stack.Screen name="customer/home" />
              <Stack.Screen name="customer/delivery" />
              <Stack.Screen name="rider/home" />
              <Stack.Screen name="restaurant" />
              <Stack.Screen name="customer/liveride" />
              <Stack.Screen name="rider/liveride" />
            </Stack>
            <OfflineIndicator />
          </View>
        </WSProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default Layout;
