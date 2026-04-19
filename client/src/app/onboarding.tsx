import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Text,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokenStorage } from "@/store/storage";

const BG = "#ac1d17";
const { width } = Dimensions.get("window");

const Onboarding = () => {
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    tokenStorage.set("onboarding_completed", "true");
    router.replace("/auth");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={styles.hero}>
        <Image
          source={require("../../icon2.png")}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Text style={styles.greeting}>Hi, welcome to</Text>
        <Text style={styles.brand}>Xigoa</Text>
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
      >
        <TouchableOpacity
          style={styles.cta}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    minHeight: "100%",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  mascot: {
    width: Math.min(width * 0.55, 220),
    height: Math.min(width * 0.55, 220),
    marginBottom: 32,
  },
  greeting: {
    fontSize: 18,
    fontFamily: "Regular",
    color: "rgba(255,255,255,0.95)",
    marginBottom: 8,
  },
  brand: {
    fontSize: 42,
    fontFamily: "Bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  footer: {
    paddingHorizontal: 24,
  },
  cta: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Bold",
    color: BG,
  },
});

export default Onboarding;
