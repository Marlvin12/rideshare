import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { useThemeStore } from "@/store/themeStore";
import { ColorTokens, Spacing, BorderRadius } from "@/utils/designSystem";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "folder-open-outline",
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconContainer, { backgroundColor: tokens.backgroundTertiary }]}
      >
        <Ionicons name={icon} size={48} color={tokens.textTertiary} />
      </View>
      <CustomText
        fontFamily="SemiBold"
        fontSize={16}
        style={[styles.title, { color: tokens.text }]}
      >
        {title}
      </CustomText>
      {message && (
        <CustomText
          fontFamily="Regular"
          fontSize={14}
          style={[styles.message, { color: tokens.textSecondary }]}
        >
          {message}
        </CustomText>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: tokens.primary }]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <CustomText
            fontFamily="SemiBold"
            fontSize={14}
            style={{ color: tokens.textInverse }}
          >
            {actionLabel}
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
    minHeight: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  action: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

export default EmptyState;
