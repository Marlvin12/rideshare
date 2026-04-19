import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { useThemeStore } from "@/store/themeStore";
import { ColorTokens, Spacing, BorderRadius } from "@/utils/designSystem";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  retryLabel = "Try again",
  icon = "alert-circle-outline",
}) => {
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconContainer, { backgroundColor: tokens.errorSurface }]}
      >
        <Ionicons name={icon} size={40} color={tokens.error} />
      </View>
      <CustomText
        fontFamily="Medium"
        fontSize={15}
        style={[styles.message, { color: tokens.text }]}
      >
        {message}
      </CustomText>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.primary }]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={tokens.textInverse}
            style={styles.retryIcon}
          />
          <CustomText
            fontFamily="SemiBold"
            fontSize={14}
            style={{ color: tokens.textInverse }}
          >
            {retryLabel}
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxxl,
    minHeight: 250,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryIcon: {
    marginRight: Spacing.sm,
  },
});

export default ErrorState;
