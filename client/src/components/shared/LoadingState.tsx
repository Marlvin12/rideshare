import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import CustomText from "./CustomText";
import { useThemeStore } from "@/store/themeStore";
import { ColorTokens, Spacing } from "@/utils/designSystem";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  fullScreen = true,
}) => {
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? tokens.background : "transparent" },
      ]}
    >
      <ActivityIndicator size="large" color={tokens.primary} />
      {message && (
        <CustomText
          fontFamily="Regular"
          fontSize={14}
          style={[styles.message, { color: tokens.textSecondary }]}
        >
          {message}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxxl,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: Spacing.lg,
  },
});

export default LoadingState;
