import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { ColorTokens } from "@/utils/designSystem";

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonItem: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: tokens.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: tokens.surface }]}
        >
          <SkeletonItem width={64} height={64} borderRadius={8} />
          <View style={styles.cardContent}>
            <SkeletonItem width="70%" height={16} />
            <SkeletonItem width="50%" height={12} style={styles.mt8} />
            <SkeletonItem width="40%" height={12} style={styles.mt8} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SkeletonListItem: React.FC<{ count?: number }> = ({
  count = 5,
}) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.listItem}>
        <SkeletonItem width={44} height={44} borderRadius={22} />
        <View style={styles.listContent}>
          <SkeletonItem width="60%" height={14} />
          <SkeletonItem width="80%" height={12} style={styles.mt8} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonGrid: React.FC<{ count?: number; columns?: number }> = ({
  count = 4,
  columns = 2,
}) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.gridItem, { width: `${100 / columns - 3}%` as any }]}>
        <SkeletonItem width="100%" height={120} borderRadius={12} />
        <SkeletonItem width="80%" height={14} style={styles.mt8} />
        <SkeletonItem width="60%" height={12} style={styles.mt8} />
      </View>
    ))}
  </View>
);

export default SkeletonItem;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    marginBottom: 16,
  },
  mt8: {
    marginTop: 8,
  },
});
