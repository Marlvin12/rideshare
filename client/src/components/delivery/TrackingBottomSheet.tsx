import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import TrackingTimeline from '@/components/delivery/TrackingTimeline';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

export type TrackingBottomSheetProps = {
  status: string;
  statusMessage: string;
  statusSubtitle?: string;
  estimatedArrival?: string;
  order: any;
  courierName?: string;
  courierPhone?: string;
  onCall?: (phone: string) => void;
  onChat?: () => void;
  onOrderDetailsPress?: () => void;
  onAddItemsPress?: () => void;
  onRatePress?: () => void;
  onHelpPress?: () => void;
};

export default function TrackingBottomSheet({
  status,
  statusMessage,
  statusSubtitle,
  estimatedArrival,
  order,
  courierName,
  courierPhone,
  onCall,
  onChat,
  onOrderDetailsPress,
  onAddItemsPress,
  onRatePress,
}: TrackingBottomSheetProps) {
  const { colors } = useThemeStore();
  const [orderDetailsExpanded, setOrderDetailsExpanded] = useState(false);

  const showCourier = !!order?.courierId;
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const showRateButton = isDelivered && !order?.ratings?.restaurant;

  const renderOrderDetailsContent = () => {
    if (!order) return null;
    return (
      <View style={styles.orderDetailsInner}>
        {order.items?.map((item: any, index: number) => (
          <View key={index} style={styles.orderItem}>
            <View style={[styles.itemQuantity, { backgroundColor: colors.divider }]}>
              <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text }}>
                {item.quantity}x
              </CustomText>
            </View>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, flex: 1 }}>
              {item.name}
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
              ${item.subtotal?.toFixed(2) ?? (item.price * item.quantity).toFixed(2)}
            </CustomText>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.pricingRow}>
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
            Subtotal
          </CustomText>
          <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
            ${order.pricing?.itemsTotal?.toFixed(2) ?? '0.00'}
          </CustomText>
        </View>
        <View style={styles.pricingRow}>
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
            Delivery Fee
          </CustomText>
          <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
            ${order.acceptedBid?.amount?.toFixed(2) ?? order.pricing?.deliveryFee?.toFixed(2) ?? '0.00'}
          </CustomText>
        </View>
        <View style={styles.pricingRow}>
          <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
            Total
          </CustomText>
          <CustomText fontFamily="Bold" fontSize={16} style={{ color: Colors.primary }}>
            ${order.pricing?.total?.toFixed(2) ?? '0.00'}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      <View style={styles.handle} />
      <View style={styles.statusRow}>
        <CustomText fontFamily="Bold" fontSize={20} style={{ color: colors.text }}>
          {statusMessage}
        </CustomText>
        {statusSubtitle && (
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginTop: 2 }}>
            {statusSubtitle}
          </CustomText>
        )}
      </View>

      <View style={styles.timelineWrap}>
        <TrackingTimeline
          currentStatus={status}
          estimatedArrival={estimatedArrival}
        />
      </View>

      {showCourier && (
        <View style={[styles.courierRow, { borderTopColor: colors.divider }]}>
          <View style={styles.courierInfo}>
            <View style={[styles.courierAvatar, { backgroundColor: colors.divider }]}>
              <Ionicons name="person" size={RFValue(24)} color={colors.textSecondary} />
            </View>
            <View>
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
                Your Dasher
              </CustomText>
              <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
                {courierName ?? 'Courier'}
              </CustomText>
            </View>
          </View>
          <View style={styles.courierActions}>
            {courierPhone && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.divider }]}
                onPress={() => onCall?.(courierPhone)}
              >
                <Ionicons name="call" size={RFValue(18)} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.divider }]}
              onPress={onChat}
            >
              <Ionicons name="chatbubble" size={RFValue(18)} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.expandRow, { backgroundColor: colors.background }]}
        onPress={() => setOrderDetailsExpanded(!orderDetailsExpanded)}
        activeOpacity={0.7}
      >
        <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>
          Order details
        </CustomText>
        <Ionicons
          name={orderDetailsExpanded ? 'chevron-up' : 'chevron-down'}
          size={RFValue(20)}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {orderDetailsExpanded && renderOrderDetailsContent()}

      {!isDelivered && !isCancelled && (
        <TouchableOpacity
          style={[styles.expandRow, { backgroundColor: colors.background, marginTop: 8 }]}
          onPress={onAddItemsPress}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={RFValue(20)} color={colors.text} />
          <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text, marginLeft: 8 }}>
            Add items
          </CustomText>
          <Ionicons name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <View style={[styles.addOnShelf, { backgroundColor: colors.background }]}>
        <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
          Add items from another store
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 4 }}>
          No added delivery fee. Service fee may apply.
        </CustomText>
        <TouchableOpacity
          style={[styles.addOnCta, { backgroundColor: colors.card, borderColor: colors.divider }]}
          onPress={onAddItemsPress}
        >
          <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text }}>
            Browse stores
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={[styles.addOnShelf, { backgroundColor: colors.background }]}>
        <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
          Add Package Pickup
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 4 }}>
          Pick up packages from a carrier location for a small fee.
        </CustomText>
      </View>

      {showRateButton && (
        <TouchableOpacity
          style={[styles.rateButton, { backgroundColor: colors.divider }]}
          onPress={onRatePress}
        >
          <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
            Rate Dasher
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusRow: {
    marginBottom: 16,
  },
  timelineWrap: {
    marginBottom: 16,
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courierActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  orderDetailsInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemQuantity: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addOnShelf: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  addOnCta: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  rateButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
