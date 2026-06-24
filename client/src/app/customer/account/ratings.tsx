import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { useThemeStore, type ThemeColors } from "@/store/themeStore";
import { getRatingHistory, type RatingHistoryItem } from "@/service/rideService";
import { useUserStore } from "@/store/userStore";
import { Spacing, BorderRadius } from "@/utils/designSystem";

const STAR_COLOR = "#F5B400";

const RATING_LABELS: Record<number, string> = {
  1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent",
};

function Stars({ value, size = 14, colors }: { value: number | null; size?: number; colors: ThemeColors }) {
  if (value == null) return null;
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= value ? "star" : "star-outline"}
          size={RFValue(size)}
          color={i <= value ? STAR_COLOR : colors.textSecondary}
        />
      ))}
    </View>
  );
}

function RatingCard({ item, colors }: { item: RatingHistoryItem; colors: ThemeColors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const date = new Date(item.date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const shortPickup = item.pickupAddress?.split(",")[0] ?? "—";
  const shortDrop = item.dropAddress?.split(",")[0] ?? "—";
  const counterpartLabel = item.myRole === "customer" ? "Driver" : "Passenger";

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
          {date}
        </CustomText>
        {item.fare != null && (
          <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: colors.text }}>
            ${item.fare.toFixed(2)}
          </CustomText>
        )}
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="radio-button-on-outline" size={RFValue(12)} color={colors.accent} />
        <CustomText fontFamily="Regular" fontSize={13} style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
          {shortPickup}
        </CustomText>
      </View>
      <View style={[styles.routeRow, { marginTop: 2 }]}>
        <Ionicons name="location-outline" size={RFValue(12)} color={colors.error} />
        <CustomText fontFamily="Regular" fontSize={13} style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
          {shortDrop}
        </CustomText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.ratingsRow}>
        <View style={styles.ratingBlock}>
          <CustomText fontFamily="Medium" fontSize={11} style={{ color: colors.textSecondary, marginBottom: 4 }}>
            You rated {counterpartLabel}
          </CustomText>
          {item.givenRating != null ? (
            <>
              <Stars value={item.givenRating} colors={colors} />
              <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary, marginTop: 2 }}>
                {RATING_LABELS[item.givenRating]}
              </CustomText>
            </>
          ) : (
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
              Not yet rated
            </CustomText>
          )}
          {!!item.givenFeedback && (
            <CustomText
              fontFamily="Regular"
              fontSize={12}
              style={{ color: colors.textSecondary, marginTop: 4, fontStyle: "italic" }}
              numberOfLines={2}
            >
              "{item.givenFeedback}"
            </CustomText>
          )}
        </View>

        <View style={[styles.ratingDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.ratingBlock}>
          <CustomText fontFamily="Medium" fontSize={11} style={{ color: colors.textSecondary, marginBottom: 4 }}>
            {counterpartLabel} rated you
          </CustomText>
          {item.receivedRating != null ? (
            <>
              <Stars value={item.receivedRating} colors={colors} />
              <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary, marginTop: 2 }}>
                {RATING_LABELS[item.receivedRating]}
              </CustomText>
            </>
          ) : (
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
              Not rated yet
            </CustomText>
          )}
        </View>
      </View>
    </View>
  );
}

const RatingsScreen = () => {
  const { colors, mode } = useThemeStore();
  const { user } = useUserStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [items, setItems] = useState<RatingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const avgRating = (user as any)?.stats?.rating as number | undefined;
  const totalRatings = (user as any)?.stats?.totalRatings as number | undefined;

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    const result = await getRatingHistory(p, 20);
    if (result.success) {
      setItems((prev) => replace ? result.ratings : [...prev, ...result.ratings]);
      setTotalPages(result.totalPages);
      setPage(p);
    }
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }, []);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} backgroundColor={colors.background} />

      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={RFValue(22)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" fontSize={18} style={{ color: colors.text }}>
          My Ratings
        </CustomText>
        <View style={{ width: RFValue(22) }} />
      </View>

      {avgRating != null && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="Bold" fontSize={36} style={{ color: colors.text }}>
            {avgRating.toFixed(1)}
          </CustomText>
          <Stars value={Math.round(avgRating)} size={18} colors={colors} />
          <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 4 }}>
            Based on {totalRatings ?? 0} {totalRatings === 1 ? "rating" : "ratings"}
          </CustomText>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl }}>
          <Ionicons name="star-outline" size={RFValue(48)} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.textSecondary, textAlign: "center" }}>
            No ratings yet. Complete a ride to start building your reputation.
          </CustomText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 }}
        >
          {items.map((item) => (
            <RatingCard key={item.rideId} item={item} colors={colors} />
          ))}

          {page < totalPages && (
            <TouchableOpacity
              style={[styles.loadMore, { borderColor: colors.border }]}
              onPress={() => fetchPage(page + 1, false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.accent }}>
                  Load more
                </CustomText>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
    },
    summaryCard: {
      alignItems: "center",
      margin: Spacing.lg,
      padding: Spacing.xl,
      borderRadius: BorderRadius.lg,
      gap: 6,
    },
    card: {
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    routeText: {
      flex: 1,
    },
    divider: {
      height: 0.5,
      marginVertical: Spacing.md,
    },
    ratingsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    ratingBlock: {
      flex: 1,
    },
    ratingDivider: {
      width: 0.5,
    },
    loadMore: {
      alignItems: "center",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
  });

export default RatingsScreen;
