import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from '@/components/shared/CustomText';
import KitchenStatusPill from './KitchenStatusPill';
import { Colors } from '@/utils/Constants';
import type { RestaurantOrder } from '@/store/restaurantStore';

interface OrderQueueCardProps {
  order: RestaurantOrder;
  onPress: () => void;
}

const OrderQueueCard: React.FC<OrderQueueCardProps> = ({ order, onPress }) => {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const customerName =
    typeof order.customerId === 'object' && order.customerId?.name
      ? order.customerId.name
      : 'Customer';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <CustomText fontFamily="SemiBold" fontSize={15} style={styles.orderNumber}>
          {order.orderNumber}
        </CustomText>
        <KitchenStatusPill status={order.status} />
      </View>
      <CustomText fontFamily="Regular" fontSize={13} style={styles.customer}>
        {customerName}
      </CustomText>
      <View style={styles.meta}>
        <CustomText fontFamily="Regular" fontSize={12} style={styles.metaText}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </CustomText>
        <CustomText fontFamily="SemiBold" fontSize={13} style={styles.total}>
          ${order.pricing?.total?.toFixed(2) ?? '0.00'}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    color: Colors.text,
  },
  customer: {
    color: Colors.textLight,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: Colors.textLight,
  },
  total: {
    color: Colors.text,
  },
});

export default OrderQueueCard;
