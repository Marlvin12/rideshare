import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { Spacing } from "@/utils/designSystem";

const checkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
};

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const showBanner = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const poll = async () => {
    const online = await checkConnectivity();
    setIsOffline((prev) => {
      if (prev !== !online) {
        if (!online) showBanner();
        else hideBanner();
      }
      return !online;
    });
  };

  useEffect(() => {
    poll();
    checkInterval.current = setInterval(poll, 10000);

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") poll();
      }
    );

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
      subscription.remove();
    };
  }, []);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
    >
      <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
      <CustomText fontFamily="Medium" fontSize={13} style={styles.text}>
        No internet connection
      </CustomText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    zIndex: 9999,
  },
  text: {
    color: "#FFFFFF",
  },
});

export default OfflineIndicator;
