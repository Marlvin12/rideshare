import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useUserStore } from '@/store/userStore';
import { useDeliveryStore } from '@/store/deliveryStore';
import { useCartStore } from '@/store/cartStore';
import { router } from 'expo-router';

const AddressHeader: React.FC = () => {
  const { location } = useUserStore();
  const { setIsAddressModalOpen } = useDeliveryStore();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  const addressText = location?.address || 'Set delivery address';
  const displayAddress = addressText.length > 30 
    ? `${addressText.substring(0, 30)}...` 
    : addressText;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addressButton}
        onPress={() => setIsAddressModalOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={RFValue(18)} color={Colors.text} />
        <CustomText fontFamily="Medium" fontSize={14} style={styles.addressText} numberOfLines={1}>
          {displayAddress}
        </CustomText>
        <Ionicons name="chevron-down" size={RFValue(16)} color={Colors.textLight} />
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={RFValue(22)} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/customer/delivery/cart')}
        >
          <Ionicons name="cart-outline" size={RFValue(22)} color={Colors.text} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <CustomText fontFamily="SemiBold" fontSize={10} style={styles.badgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </CustomText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  addressText: {
    flex: 1,
    color: Colors.text,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
  },
});

export default AddressHeader;
