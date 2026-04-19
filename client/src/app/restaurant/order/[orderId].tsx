import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import KitchenStatusPill from '@/components/restaurant/KitchenStatusPill';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Colors } from '@/utils/Constants';

const PREP_TIME_DEFAULT = 25;
const CAN_ACCEPT = ['pending'];
const CAN_MARK_READY = ['restaurant_accepted', 'preparing'];

const RestaurantOrderDetail = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    acceptOrder,
    rejectOrder,
    setOrderReady,
    clearError,
  } = useRestaurantStore();
  const [actionLoading, setActionLoading] = useState(false);

  const order = orders.find((o) => o._id === orderId);

  const loadOrders = useCallback(async () => {
    if (!orderId) return;
    await fetchOrders();
  }, [fetchOrders, orderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleAccept = async () => {
    if (!orderId) return;
    setActionLoading(true);
    const result = await acceptOrder(orderId, PREP_TIME_DEFAULT);
    setActionLoading(false);
    if (result.success) {
      router.back();
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Reject order',
      'Customer will be notified. Reason: "Restaurant unavailable".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (!orderId) return;
            setActionLoading(true);
            const result = await rejectOrder(orderId, 'Restaurant unavailable');
            setActionLoading(false);
            if (result.success) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleMarkReady = async () => {
    if (!orderId) return;
    setActionLoading(true);
    const result = await setOrderReady(orderId);
    setActionLoading(false);
    if (result.success) {
      router.back();
    }
  };

  if (!orderId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message="Missing order ID" onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={RFValue(20)} color={Colors.text} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18}>Order</CustomText>
          <View style={styles.backButton} />
        </View>
        <ErrorState
          message={error}
          onRetry={() => { clearError(); loadOrders(); }}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message="Loading order..." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={RFValue(20)} color={Colors.text} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18}>Order</CustomText>
          <View style={styles.backButton} />
        </View>
        <ErrorState
          message="Order not found"
          onRetry={loadOrders}
        />
      </SafeAreaView>
    );
  }

  const customerName =
    typeof order.customerId === 'object' && order.customerId?.name
      ? order.customerId.name
      : 'Customer';
  const showAcceptReject = CAN_ACCEPT.includes(order.status);
  const showMarkReady = CAN_MARK_READY.includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={Colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18}>
          {order.orderNumber}
        </CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <CustomText fontFamily="SemiBold" fontSize={15}>
              {order.orderNumber}
            </CustomText>
            <KitchenStatusPill status={order.status} />
          </View>
          <CustomText fontFamily="Regular" fontSize={13} style={styles.customer}>
            {customerName}
          </CustomText>
          {order.deliveryAddress?.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={RFValue(16)} color={Colors.textLight} />
              <CustomText fontFamily="Regular" fontSize={13} style={styles.address}>
                {order.deliveryAddress.address}
              </CustomText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <CustomText fontFamily="SemiBold" fontSize={14} style={styles.sectionTitle}>
            Items
          </CustomText>
          {order.items.map((item, idx) => (
            <View key={`${item.menuItemId}-${idx}`} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <CustomText fontFamily="Medium" fontSize={14}>
                  {item.quantity}x {item.name}
                </CustomText>
                {item.specialInstructions ? (
                  <CustomText fontFamily="Regular" fontSize={12} style={styles.special}>
                    Note: {item.specialInstructions}
                  </CustomText>
                ) : null}
              </View>
              <CustomText fontFamily="SemiBold" fontSize={14}>
                ${(item.subtotal ?? item.price * item.quantity).toFixed(2)}
              </CustomText>
            </View>
          ))}
          <View style={styles.totalRow}>
            <CustomText fontFamily="SemiBold" fontSize={15}>
              Total
            </CustomText>
            <CustomText fontFamily="SemiBold" fontSize={15}>
              ${order.pricing?.total?.toFixed(2) ?? '0.00'}
            </CustomText>
          </View>
        </View>

        {(showAcceptReject || showMarkReady) && (
          <View style={styles.actions}>
            {showAcceptReject && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.buttonReject]}
                  onPress={handleReject}
                  disabled={actionLoading}
                >
                  <CustomText fontFamily="SemiBold" fontSize={15} style={styles.buttonTextReject}>
                    Reject
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonAccept]}
                  onPress={handleAccept}
                  disabled={actionLoading}
                >
                  <CustomText fontFamily="SemiBold" fontSize={15} style={styles.buttonTextPrimary}>
                    Accept
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
            {showMarkReady && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleMarkReady}
                disabled={actionLoading}
              >
                <CustomText fontFamily="SemiBold" fontSize={15} style={styles.buttonTextPrimary}>
                  Mark ready for pickup
                </CustomText>
              </TouchableOpacity>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customer: {
    color: Colors.textLight,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    color: Colors.textLight,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemLeft: {
    flex: 1,
  },
  special: {
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonAccept: {
    backgroundColor: Colors.primary,
  },
  buttonReject: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonTextPrimary: {
    color: Colors.white,
  },
  buttonTextReject: {
    color: Colors.error,
  },
});

export default RestaurantOrderDetail;
