import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { router } from 'expo-router';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';
import { useDeliveryStore } from '@/store/deliveryStore';

interface StoreInfoBottomSheetProps {
  store: DeliveryStore;
  onDeliveryToggle?: (mode: 'Delivery' | 'Pickup') => void;
  onGroupOrder?: () => void;
  onSaveStore?: () => void;
  onShare?: () => void;
}

const StoreInfoBottomSheet: React.FC<StoreInfoBottomSheetProps> = ({
  store,
  onDeliveryToggle,
  onGroupOrder,
  onSaveStore,
  onShare,
}) => {
  const { colors } = useThemeStore();
  const { deliveryMode } = useDeliveryStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.handle} />

      <View style={styles.content}>
        <View style={styles.storeHeader}>
          <CustomText fontFamily="Bold" fontSize={24} style={{ color: colors.text }}>
            {store.name}
          </CustomText>
          <TouchableOpacity
            onPress={() => router.push(`/customer/delivery/store/${store._id}/info`)}
            accessibilityLabel="View store details"
          >
            <Ionicons name="chevron-forward" size={RFValue(20)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.storeInfo}>
          {store.isRidePassEligible && (
            <View style={styles.dashPassBadge}>
              <Ionicons name="checkmark-circle" size={RFValue(14)} color={Colors.primary} />
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: Colors.primary, marginLeft: 4 }}>
                RidePass
              </CustomText>
            </View>
          )}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={RFValue(12)} color="#FFC107" />
            <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text, marginLeft: 4 }}>
              {store.rating.toFixed(1)}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginLeft: 4 }}>
              ({store.reviewCount}+)
            </CustomText>
            <View style={styles.dot} />
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
              {store.cuisine[0]}
            </CustomText>
            {store.distance && (
              <>
                <View style={styles.dot} />
                <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
                  {store.distance} ft
                </CustomText>
              </>
            )}
          </View>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              deliveryMode === 'Delivery' && { backgroundColor: colors.text },
            ]}
            onPress={() => onDeliveryToggle?.('Delivery')}
          >
            <CustomText
              fontFamily="SemiBold"
              fontSize={14}
              style={{ color: deliveryMode === 'Delivery' ? Colors.white : colors.text }}
            >
              Delivery
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              deliveryMode === 'Pickup' && { backgroundColor: colors.text },
            ]}
            onPress={() => onDeliveryToggle?.('Pickup')}
          >
            <CustomText
              fontFamily="SemiBold"
              fontSize={14}
              style={{ color: deliveryMode === 'Pickup' ? Colors.white : colors.text }}
            >
              Pickup
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.groupOrderButton} onPress={onGroupOrder}>
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
              Group Order
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={RFValue(16)} color={Colors.primary} />
            <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text, marginTop: 4 }}>
              {store.preparationTime || 25}-{(store.preparationTime || 25) + 15} min
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary }}>
              Delivery
            </CustomText>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="bicycle-outline" size={RFValue(16)} color={Colors.primary} />
            <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text, marginTop: 4 }}>
              ${store.deliveryFee.toFixed(2)}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary }}>
              Delivery Fee
            </CustomText>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="wallet-outline" size={RFValue(16)} color={Colors.primary} />
            <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text, marginTop: 4 }}>
              ${store.minimumOrder}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary }}>
              Minimum
            </CustomText>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onGroupOrder}>
            <Ionicons name="people-outline" size={RFValue(18)} color={colors.text} />
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, marginLeft: 8 }}>
              Start a group order
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onSaveStore}>
            <Ionicons name="heart-outline" size={RFValue(18)} color={colors.text} />
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, marginLeft: 8 }}>
              Save this store
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={RFValue(18)} color={colors.text} />
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, marginLeft: 8 }}>
              Share the store page
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeInfo: {
    marginBottom: 16,
  },
  dashPassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 6,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  groupOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export default StoreInfoBottomSheet;
