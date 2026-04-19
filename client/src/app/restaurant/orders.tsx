import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import CustomText from '@/components/shared/CustomText';
import OrderQueueCard from '@/components/restaurant/OrderQueueCard';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Colors } from '@/utils/Constants';
import type { RestaurantOrder } from '@/store/restaurantStore';

type FilterMode = 'all' | 'new' | 'active';

const ACTIVE_STATUSES = [
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'bidding_open',
  'courier_assigned',
  'picked_up',
  'in_transit',
];

const filterOrders = (orders: RestaurantOrder[], mode: FilterMode): RestaurantOrder[] => {
  if (mode === 'all') return orders;
  if (mode === 'new') return orders.filter((o) => o.status === 'pending');
  return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
};

const RestaurantOrders = () => {
  const {
    restaurantId,
    orders,
    isLoading,
    error,
    fetchOrders,
    clearError,
  } = useRestaurantStore();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchOrders();
    return result.success;
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

  const filteredOrders = filterOrders(orders, filter);

  if (!restaurantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor={Colors.white} />
        <EmptyState
          icon="restaurant-outline"
          title="No restaurant selected"
          message="Set EXPO_PUBLIC_RESTAURANT_ID in .env or select a restaurant in Account."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <CustomText fontFamily="SemiBold" fontSize={20} style={styles.title}>
          Orders
        </CustomText>
        <View style={styles.segmented}>
          {(['all', 'new', 'active'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.segment, filter === mode && styles.segmentActive]}
              onPress={() => setFilter(mode)}
            >
              <CustomText
                fontFamily={filter === mode ? 'SemiBold' : 'Regular'}
                fontSize={13}
                style={[styles.segmentText, filter === mode && styles.segmentTextActive]}
              >
                {mode === 'all' ? 'All' : mode === 'new' ? 'New' : 'Active'}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => { clearError(); load(); }}
          retryLabel="Retry"
        />
      ) : isLoading && orders.length === 0 ? (
        <LoadingState message="Loading orders..." fullScreen={false} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={filter === 'new' ? 'No new orders' : filter === 'active' ? 'No active orders' : 'No orders yet'}
              message="Orders will appear here when customers place them."
            />
          }
          renderItem={({ item }) => (
            <OrderQueueCard
              order={item}
              onPress={() => router.push(`/restaurant/order/${item._id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text,
    marginBottom: 12,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    color: Colors.textLight,
  },
  segmentTextActive: {
    color: Colors.text,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
});

export default RestaurantOrders;
