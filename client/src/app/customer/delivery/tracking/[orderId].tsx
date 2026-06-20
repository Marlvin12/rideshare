import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import CourierMap from '@/components/delivery/CourierMap';
import TrackingBottomSheet from '@/components/delivery/TrackingBottomSheet';
import { Colors } from '@/utils/Constants';
import { getFoodOrderById, cancelFoodOrder } from '@/service/foodOrderService';
import { useWS } from '@/service/WSProvider';
import { useThemeStore } from '@/store/themeStore';

const CANCELLABLE_STATUSES = ['pending', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'courier_searching'];

const OrderTrackingScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useThemeStore();
  const { on, off, emit } = useWS();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    const result = await getFoodOrderById(orderId);
    if (result.success) {
      setOrder(result.order);
    }
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    if (orderId) {
      emit('subscribeOrder', orderId);
    }
    return () => {
      if (orderId) {
        emit('unsubscribeOrder', orderId);
      }
    };
  }, [orderId, emit]);

  useEffect(() => {
    on('order:status', (data: any) => {
      if (data.orderId !== orderId) return;
      setOrder((prev: any) => {
        if (!prev) return prev;
        const next: any = { ...prev, status: data.status };
        if (data.estimatedDelivery != null) next.estimatedDeliveryTime = data.estimatedDelivery;
        if (data.preparationTime != null) next.estimatedPreparationTime = data.preparationTime;
        if (data.courierId != null) next.courierId = prev.courierId ? { ...prev.courierId, _id: data.courierId } : { _id: data.courierId };
        return next;
      });
      if (data.status === 'courier_assigned' || data.status === 'delivered' || data.status === 'cancelled') {
        getFoodOrderById(orderId!).then((result) => {
          if (result.success && result.order) setOrder(result.order);
        });
      }
    });

    on('courier:location', (data: any) => {
      if (data.orderId === orderId) {
        setOrder((prev: any) => prev ? {
          ...prev,
          courierLocation: data.location,
        } : prev);
      }
    });

    return () => {
      off('order:status');
      off('courier:location');
    };
  }, [orderId, on, off]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleChat = () => {
    if (order?.courierId?._id) {
      router.push({
        pathname: '/customer/delivery/chat/[courierId]',
        params: {
          courierId: order.courierId._id,
          courierName: order.courierId.name ?? '',
          courierPhone: order.courierId.phone ?? '',
          courierLanguage: order.courierId.preferredLanguage ?? '',
        },
      });
    }
  };

  const getStatusMessage = () => {
    if (!order) return '';
    
    switch (order.status) {
      case 'pending':
        return 'Waiting for restaurant to confirm';
      case 'restaurant_accepted':
        return 'Restaurant is preparing your order';
      case 'preparing':
        return 'Your food is being prepared';
      case 'ready_for_pickup':
        return 'Order is ready for pickup';
      case 'courier_searching':
        return 'Finding a courier for your order';
      case 'courier_assigned':
        return 'Courier is on the way to pickup';
      case 'picked_up':
        return 'Courier has picked up your order';
      case 'in_transit':
        return 'Your order is on its way!';
      case 'delivered':
        return 'Order delivered successfully!';
      case 'cancelled':
        return 'Order was cancelled';
      default:
        return 'Processing your order';
    }
  };

  const getEstimatedArrival = () => {
    if (!order?.estimatedDeliveryTime) return undefined;
    const date = new Date(order.estimatedDeliveryTime);
    return `Arrives by ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusSubtitle = (): string | undefined => {
    if (!order) return undefined;
    const prepMins = order.estimatedPreparationTime;
    switch (order.status) {
      case 'pending':
        return 'We will notify you when the restaurant confirms';
      case 'restaurant_accepted':
      case 'preparing':
        return prepMins != null ? `Est. ready in ${prepMins} min` : 'Your order is being prepared';
      case 'ready_for_pickup':
      case 'courier_searching':
        return 'Looking for a courier to pick up your order';
      case 'courier_assigned':
        return 'Courier is heading to the restaurant';
      case 'picked_up':
      case 'in_transit':
        return getEstimatedArrival();
      case 'delivered':
        return undefined;
      case 'cancelled':
        return order.cancellationReason || undefined;
      default:
        return undefined;
    }
  };

  const canCancel = order && CANCELLABLE_STATUSES.includes(order.status);
  const mapRef = useRef<{ recenter: () => void } | null>(null);
  const showRoute =
    order?.status === 'in_transit' ||
    order?.status === 'picked_up' ||
    order?.status === 'courier_assigned';

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelFoodOrder(orderId!, 'Customer cancelled');
            if (result.success) {
              router.replace('/customer/delivery');
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <CustomText fontFamily="Medium" fontSize={16}>Loading order...</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  const handleHelp = () => {
    router.push('/customer/delivery/help');
  };

  const handleAddItems = () => {
    router.push('/customer/delivery');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.mapWrapper}>
        <View style={styles.mapContainer}>
          <CourierMap
            ref={mapRef}
            restaurantLocation={
              order.restaurantAddress
                ? {
                    latitude: order.restaurantAddress.latitude,
                    longitude: order.restaurantAddress.longitude,
                  }
                : undefined
            }
            deliveryLocation={
              order.deliveryAddress
                ? {
                    latitude: order.deliveryAddress.latitude,
                    longitude: order.deliveryAddress.longitude,
                  }
                : undefined
            }
            courierLocation={
              order.courierLocation
                ? {
                    latitude: order.courierLocation.latitude,
                    longitude: order.courierLocation.longitude,
                    heading: order.courierLocation.heading,
                  }
                : undefined
            }
            showRoute={showRoute}
          />
        </View>
        <View style={styles.mapOverlay}>
          <TouchableOpacity
            style={[styles.overlayButton, { backgroundColor: colors.background }]}
            onPress={() => router.replace('/customer/delivery')}
          >
            <Ionicons name="close" size={RFValue(22)} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.mapOverlayRight}>
            <TouchableOpacity
              style={[styles.overlayButton, styles.helpButton, { backgroundColor: colors.background }]}
              onPress={handleHelp}
            >
              <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
                Help
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: colors.background, marginLeft: 8 }]}
              onPress={() => mapRef.current?.recenter()}
            >
              <Ionicons name="locate" size={RFValue(20)} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TrackingBottomSheet
          status={order.status}
          statusMessage={getStatusMessage()}
          statusSubtitle={getStatusSubtitle()}
          estimatedArrival={getEstimatedArrival()}
          order={order}
          courierName={order.courierId?.name}
          courierPhone={order.courierId?.phone}
          onCall={handleCall}
          onChat={handleChat}
          onAddItemsPress={handleAddItems}
          onRatePress={() => router.push(`/customer/delivery/review/${orderId}`)}
        />

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: Colors.error }]}
            onPress={handleCancelOrder}
          >
            <CustomText fontFamily="Medium" fontSize={14} style={styles.cancelButtonText}>
              Cancel order
            </CustomText>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWrapper: {
    position: 'relative',
    height: 320,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapOverlayRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 'auto',
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cancelButton: {
    marginHorizontal: 4,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: Colors.error,
  },
});

export default OrderTrackingScreen;
