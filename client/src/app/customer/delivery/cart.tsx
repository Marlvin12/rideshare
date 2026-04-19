import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import CartItemRow from '@/components/delivery/CartItemRow';
import ComplementCartList from '@/components/delivery/ComplementCartList';
import { Colors } from '@/utils/Constants';
import { useCartStore } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import { formatCurrency } from '@/utils/currency';

const CartScreen = () => {
  const { colors } = useThemeStore();
  const {
    items,
    restaurant,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDeliveryFee,
    getPlatformFee,
    getTotal,
    isMinimumOrderMet,
    addItem,
  } = useCartStore();

  const [complementItems] = useState([
    {
      _id: 'cookie1',
      name: 'Chocolate Chip Cookie',
      price: 1.42,
      calories: 210,
      approvalPercentage: 88,
    },
    {
      _id: 'chips1',
      name: 'Miss Vickie\'s® Jalapeño',
      price: 2.02,
      calories: 210,
      approvalPercentage: 60,
    },
  ]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>Cart</CustomText>
          <View style={styles.backButton} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={Colors.textLight} />
          <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text, marginTop: 20 }}>
            Your cart is empty
          </CustomText>
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Add items from a restaurant to get started
          </CustomText>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/customer/delivery')}
          >
            <CustomText fontFamily="SemiBold" fontSize={14} style={styles.browseButtonText}>
              Browse Restaurants
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>Cart</CustomText>
        <TouchableOpacity onPress={clearCart} style={styles.backButton}>
          <Ionicons name="trash-outline" size={RFValue(18)} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {restaurant && (
          <View style={[styles.restaurantInfo, { backgroundColor: colors.card }]}>
            <Ionicons name="restaurant" size={RFValue(20)} color={Colors.primary} />
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginLeft: 12 }}>
              {restaurant.name}
            </CustomText>
          </View>
        )}

        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <CartItemRow
              key={item.menuItemId}
              item={item}
              onIncrease={() => updateQuantity(item.menuItemId, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.menuItemId, item.quantity - 1)}
              onRemove={() => removeItem(item.menuItemId)}
            />
          ))}
        </View>

        <ComplementCartList
          items={complementItems}
          onAddItem={(item) => {
            if (restaurant) {
              addItem(
                {
                  menuItemId: item._id,
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                },
                restaurant
              );
            }
          }}
        />

        <View style={[styles.summarySection, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Order Summary
          </CustomText>
          
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
              Subtotal
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
              {formatCurrency(getSubtotal())}
            </CustomText>
          </View>
          
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
              Delivery Fee
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
              {formatCurrency(getDeliveryFee())}
            </CustomText>
          </View>
          
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
              Platform Fee (10%)
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
              {formatCurrency(getPlatformFee())}
            </CustomText>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          
          <View style={styles.summaryRow}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text }}>
              Total
            </CustomText>
            <CustomText fontFamily="Bold" fontSize={18} style={{ color: Colors.primary }}>
              {formatCurrency(getTotal())}
            </CustomText>
          </View>

          {!isMinimumOrderMet() && restaurant && (
            <View style={styles.minimumWarning}>
              <Ionicons name="alert-circle" size={RFValue(16)} color={Colors.warning} />
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: '#92400E', flex: 1, marginLeft: 8 }}>
                Add {formatCurrency(restaurant.minimumOrder - getSubtotal())} more to meet the minimum order
              </CustomText>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.checkoutContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!isMinimumOrderMet()) && styles.checkoutButtonDisabled,
          ]}
          onPress={() => router.push('/customer/delivery/checkout')}
          disabled={!isMinimumOrderMet()}
        >
          <CustomText fontFamily="SemiBold" fontSize={16} style={styles.checkoutButtonText}>
            {isMinimumOrderMet() ? `Continue to Checkout • ${formatCurrency(getTotal())}` : 'Minimum order not met'}
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  browseButtonText: {
    color: Colors.white,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summarySection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  minimumWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: Colors.white,
  },
});

export default CartScreen;
