import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CustomText from '@/components/shared/CustomText';
import RestaurantMetricTile from '@/components/restaurant/RestaurantMetricTile';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Colors } from '@/utils/Constants';

const ACTIVE_STATUSES = [
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'courier_searching',
  'courier_assigned',
  'picked_up',
  'in_transit',
];

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getUTCDate() === today.getUTCDate() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCFullYear() === today.getUTCFullYear()
  );
};

const RestaurantDashboard = () => {
  const {
    restaurantId,
    orders,
    isLoading,
    fetchOrders,
  } = useRestaurantStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const load = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (restaurantId) {
      load();
    }
  }, [restaurantId, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  if (!restaurantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor={Colors.white} />
        <EmptyState
          icon="restaurant-outline"
          title="No restaurant selected"
          message="Set EXPO_PUBLIC_RESTAURANT_ID in .env or select in Account."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.white} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <CustomText fontFamily="SemiBold" fontSize={20} style={styles.title}>
          Dashboard
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
          Today&apos;s overview
        </CustomText>

        {isLoading && orders.length === 0 ? (
          <LoadingState message="Loading..." fullScreen={false} />
        ) : (
          <View style={styles.tiles}>
            <RestaurantMetricTile
              icon="receipt-outline"
              label="Orders today"
              value={todayOrders.length}
            />
            <View style={styles.tileSpacer} />
            <RestaurantMetricTile
              icon="time-outline"
              label="Active (prep / ready)"
              value={activeCount}
            />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textLight,
    marginBottom: 20,
  },
  tiles: {
    flexDirection: 'row',
  },
  tileSpacer: {
    width: 12,
  },
});

export default RestaurantDashboard;
