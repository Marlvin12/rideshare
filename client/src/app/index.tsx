import { View, Image, StyleSheet, Animated, Text } from "react-native";
import React, { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { useUserStore } from "@/store/userStore";
import { useRiderStore } from "@/store/riderStore";
import { tokenStorage, hydrateTokens } from "@/store/storage";
import { jwtDecode } from "jwt-decode";
import { resetAndNavigate } from "@/utils/Helpers";
import { refresh_tokens } from "@/service/apiInterceptors";
import { logout } from "@/service/authService";

const SPLASH_BG = "#ac1d17";
const MIN_SPLASH_MS = 3000;

interface DecodedToken {
  exp: number;
}

function waitPersistHydration(): Promise<void> {
  const stores = [useUserStore, useRiderStore];
  return Promise.all(
    stores.map(
      (store) =>
        new Promise<void>((resolve) => {
          if (store.persist.hasHydrated()) {
            resolve();
            return;
          }
          const unsub = store.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        })
    )
  ).then(() => undefined);
}

const Main = () => {
  const [fontsLoaded] = useFonts({
    Bold: require("../assets/fonts/NotoSans-Bold.ttf"),
    Regular: require("../assets/fonts/NotoSans-Regular.ttf"),
    Medium: require("../assets/fonts/NotoSans-Medium.ttf"),
    Light: require("../assets/fonts/NotoSans-Light.ttf"),
    SemiBold: require("../assets/fonts/NotoSans-SemiBold.ttf"),
  });

  const { user: customerUser } = useUserStore();
  const { user: riderUser } = useRiderStore();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tokenCheck = async () => {
    const splashStartedAt = Date.now();
    const waitMinSplash = async () => {
      const remaining = MIN_SPLASH_MS - (Date.now() - splashStartedAt);
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }
    };

    await hydrateTokens();
    await waitPersistHydration();

    const onboardingCompleted = tokenStorage.getString("onboarding_completed");
    if (!onboardingCompleted) {
      await waitMinSplash();
      resetAndNavigate("/onboarding");
      return;
    }

    const accessToken = tokenStorage.getString("access_token");
    const refreshToken = tokenStorage.getString("refresh_token");

    if (!accessToken || !refreshToken) {
      await waitMinSplash();
      resetAndNavigate("/auth");
      return;
    }

    try {
      const decodedAccess = jwtDecode<DecodedToken>(accessToken);
      const decodedRefresh = jwtDecode<DecodedToken>(refreshToken);
      const now = Date.now() / 1000;

      if (decodedRefresh.exp < now) {
        await waitMinSplash();
        await logout();
        return;
      }

      if (decodedAccess.exp < now) {
        const newToken = await refresh_tokens();
        if (!newToken) {
          await waitMinSplash();
          resetAndNavigate("/auth");
          return;
        }
      }

      await waitMinSplash();
      if (customerUser?.role === "customer") {
        resetAndNavigate("/customer/home");
      } else if (riderUser?.role === "rider") {
        resetAndNavigate("/rider/home");
      } else {
        resetAndNavigate("/auth");
      }
    } catch (err) {
      console.error("Token check failed:", err);
      await waitMinSplash();
      resetAndNavigate("/auth");
    }
  };

  useEffect(() => {
    void tokenCheck();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require("../../icon2.png")}
          style={styles.logo}
        />
        <Text
          style={[
            styles.wordmark,
            fontsLoaded ? { fontFamily: "Bold" } : { fontWeight: "700" },
          ]}
        >
          Xigoa
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SPLASH_BG,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  wordmark: {
    marginTop: 16,
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

export default Main;
