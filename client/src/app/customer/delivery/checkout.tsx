import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import CheckoutDeliveryTime, { DeliveryTimeMode } from '@/components/delivery/CheckoutDeliveryTime';
import SoldOutPreferenceModal, { SoldOutPreference } from '@/components/delivery/SoldOutPreferenceModal';
import MapPickerModal from '../../../components/customer/MapPickerModal';
import { Colors } from '@/utils/Constants';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useDeliveryStore } from '@/store/deliveryStore';
import { createFoodOrder, validateFoodOrder } from '@/service/foodOrderService';
import { useThemeStore } from '@/store/themeStore';
import { validateDeliveryAddress } from '@/utils/mapUtils';
import { getCheckoutErrorMessage } from '@/utils/errorMessages';
import { formatCurrency } from '@/utils/currency';

// How long before the button label escalates to the "still confirming" copy.
const ESCALATION_DELAY_MS = 2500;

type CheckoutPhase = 'idle' | 'validating' | 'placing';

interface CheckoutError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

interface PriceChangedState {
  clientTotal: number;
  serverTotal: number;
}

interface SelectedMapLocation {
  latitude?: number;
  longitude?: number;
  address: string;
  type?: string;
}

const SOLD_OUT_LABELS: Record<SoldOutPreference, string> = {
  merchant_recommend: 'Choose a replacement',
  refund: 'Refund the item',
  contact_me: 'Contact me',
  cancel_order: 'Cancel the entire order',
};

const CheckoutScreen = () => {
  const { colors } = useThemeStore();
  const {
    items,
    restaurant,
    getSubtotal,
    getDeliveryFee,
    getPlatformFee,
    getTotal,
    isMinimumOrderMet,
    clearCart,
  } = useCartStore();

  const { location, setLocation } = useUserStore();
  const { isAddressModalOpen, setIsAddressModalOpen } = useDeliveryStore();

  const [deliveryTimeMode, setDeliveryTimeMode] = useState<DeliveryTimeMode>('standard');
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [unavailableItemPreference, setUnavailableItemPreference] = useState<SoldOutPreference | null>(null);
  const [soldOutModalVisible, setSoldOutModalVisible] = useState(false);
  const [soldOutModalSelected, setSoldOutModalSelected] = useState<SoldOutPreference | null>(null);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState('');

  const [phase, setPhase] = useState<CheckoutPhase>('idle');
  const [buttonLabel, setButtonLabel] = useState('');
  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);
  const [priceChanged, setPriceChanged] = useState<PriceChangedState | null>(null);

  // Stable across the checkout session; reused on retry to avoid duplicate orders.
  const idempotencyKeyRef = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const escalationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = phase !== 'idle';
  const clientTotal = getTotal() + tipAmount;

  useEffect(() => {
    return () => {
      if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
    };
  }, []);

  const startEscalationTimer = useCallback(() => {
    if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
    escalationTimerRef.current = setTimeout(() => {
      setButtonLabel('Still confirming with restaurant...');
    }, ESCALATION_DELAY_MS);
  }, []);

  const stopEscalationTimer = useCallback(() => {
    if (escalationTimerRef.current) {
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = null;
    }
  }, []);

  const setError = useCallback((code: string, message?: string, details?: Record<string, any>) => {
    setCheckoutError({
      code,
      message: message ?? getCheckoutErrorMessage(code),
      details,
    });
  }, []);

  const clearError = useCallback(() => setCheckoutError(null), []);

  const submitOrder = useCallback(async () => {
    if (!restaurant || !location) return;

    clearError();
    setPriceChanged(null);
    setPhase('placing');
    setButtonLabel('Placing order...');
    startEscalationTimer();

    const result = await createFoodOrder({
      restaurantId: restaurant.id,
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddress: {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        instructions: deliveryInstructions,
      },
      paymentMethod: 'cash',
      channel: 'app',
      ...(unavailableItemPreference && { unavailableItemPreference }),
      idempotencyKey: idempotencyKeyRef.current,
    });

    stopEscalationTimer();
    setPhase('idle');

    if (result.success) {
      clearCart();
      router.replace(`/customer/delivery/tracking/${result.order._id}`);
    } else {
      const code = result.code ?? 'UNKNOWN';
      setError(code, result.error ?? getCheckoutErrorMessage(code));
    }
  }, [
    restaurant, location, items, deliveryInstructions, unavailableItemPreference,
    clearError, clearCart, startEscalationTimer, stopEscalationTimer, setError,
  ]);

  const handlePlaceOrder = useCallback(async () => {
    if (!restaurant) {
      setError('UNKNOWN', 'No restaurant selected. Please go back and try again.');
      return;
    }
    if (!location) {
      setIsAddressModalOpen(true);
      return;
    }
    if (!isMinimumOrderMet()) {
      setError(
        'MINIMUM_ORDER_NOT_MET',
        `Minimum order for ${restaurant.name} is ${formatCurrency(restaurant.minimumOrder ?? 0)}. Add more items to continue.`
      );
      return;
    }

    clearError();
    setPriceChanged(null);
    setPhase('validating');
    setButtonLabel('Checking your order...');

    // Step 1 — address verification via Google
    const addressValid = await (async (): Promise<boolean> => {
      try {
        const validation = await validateDeliveryAddress({ addressLines: [location.address] });
        const verdict = validation?.result?.verdict;
        if (!verdict) return true;
        const isUnconfirmed =
          verdict.hasUnconfirmedComponents ||
          verdict.hasInferredComponents ||
          verdict.addressComplete === false;
        if (!isUnconfirmed) return true;

        setPhase('idle');
        return new Promise<boolean>((resolve) => {
          setCheckoutError({
            code: 'ADDRESS_UNVERIFIED',
            message:
              'We could not fully verify your delivery address. Deliveries may fail if the address is incorrect.',
            details: { requiresConfirmation: true, resolve },
          });
        });
      } catch {
        // Address API failed — treat as verified to avoid blocking checkout
        return true;
      }
    })();
    if (!addressValid) return;

    // Step 2 — pre-submit inventory and price revalidation
    const validation = await validateFoodOrder({
      restaurantId: restaurant.id,
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddress: {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        instructions: deliveryInstructions,
      },
      unavailableItemPreference: unavailableItemPreference ?? undefined,
    });

    setPhase('idle');

    if (!validation.valid) {
      setError(validation.code ?? 'UNKNOWN', validation.message, validation.details);
      return;
    }

    // Step 3 — check if the server-computed total diverges from the client's estimate
    if (validation.pricing) {
      const serverTotal = validation.pricing.total + tipAmount;
      const delta = Math.abs(serverTotal - clientTotal);
      if (delta > 0.01) {
        setPriceChanged({ clientTotal, serverTotal });
        return;
      }
    }

    await submitOrder();
  }, [
    restaurant, location, items, deliveryInstructions, unavailableItemPreference, tipAmount,
    clientTotal, clearError, isMinimumOrderMet, setIsAddressModalOpen, submitOrder, setError,
  ]);

  const handleAcceptPriceChange = useCallback(async () => {
    setPriceChanged(null);
    await submitOrder();
  }, [submitOrder]);

  const tipOptions = [0, 2, 5, 10, 15];

  const renderErrorBanner = () => {
    if (!checkoutError) return null;

    const { code, message, details } = checkoutError;

    // Address unverified — action buttons are embedded in the error state
    if (code === 'ADDRESS_UNVERIFIED' && details?.requiresConfirmation) {
      return (
        <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: Colors.warning }]}>
          <Ionicons name="warning-outline" size={RFValue(18)} color={Colors.warning} />
          <View style={styles.errorContent}>
            <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text }}>
              {message}
            </CustomText>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={[styles.errorBtn, { backgroundColor: colors.divider }]}
                onPress={() => {
                  setIsAddressModalOpen(true);
                  details.resolve(false);
                  clearError();
                }}
              >
                <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: colors.text }}>
                  Edit address
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.errorBtn, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  clearError();
                  details.resolve(true);
                }}
              >
                <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: Colors.white }}>
                  Continue anyway
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    const recoveryLabel = getRecoveryLabel(code);
    const recoveryAction = getRecoveryAction(code);

    return (
      <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: Colors.error }]}>
        <Ionicons name="alert-circle-outline" size={RFValue(18)} color={Colors.error} />
        <View style={styles.errorContent}>
          <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text }}>
            {message}
          </CustomText>
          {recoveryLabel && recoveryAction && (
            <TouchableOpacity
              style={[styles.errorBtnFull, { backgroundColor: Colors.primary }]}
              onPress={() => { clearError(); recoveryAction(); }}
            >
              <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: Colors.white }}>
                {recoveryLabel}
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getRecoveryLabel = (code: string): string | null => {
    switch (code) {
      case 'ADDRESS_OUT_OF_RANGE': return 'Change address';
      case 'ITEMS_UNAVAILABLE': return 'Set preference';
      case 'MINIMUM_ORDER_NOT_MET': return 'Back to menu';
      case 'RESTAURANT_CLOSED':
      case 'RESTAURANT_NOT_FOUND': return 'Browse restaurants';
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
      case 'UNKNOWN': return 'Try again';
      default: return null;
    }
  };

  const getRecoveryAction = (code: string): (() => void) | null => {
    switch (code) {
      case 'ADDRESS_OUT_OF_RANGE': return () => setIsAddressModalOpen(true);
      case 'ITEMS_UNAVAILABLE': return () => {
        setSoldOutModalSelected(unavailableItemPreference);
        setSoldOutModalVisible(true);
      };
      case 'MINIMUM_ORDER_NOT_MET': return () => router.back();
      case 'RESTAURANT_CLOSED':
      case 'RESTAURANT_NOT_FOUND': return () => router.replace('/customer/delivery/restaurants' as any);
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
      case 'UNKNOWN': return () => handlePlaceOrder();
      default: return null;
    }
  };

  const renderCTA = () => {
    if (priceChanged) {
      return (
        <View style={[styles.checkoutContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
          <View style={[styles.priceChangeBanner, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle-outline" size={RFValue(16)} color={Colors.warning} />
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.text, flex: 1, marginLeft: 8 }}>
              Price updated: ${priceChanged.clientTotal.toFixed(2)} → ${priceChanged.serverTotal.toFixed(2)}
            </CustomText>
          </View>
          <View style={styles.priceChangeActions}>
            <TouchableOpacity
              style={[styles.priceChangeBtn, { backgroundColor: colors.divider }]}
              onPress={() => setPriceChanged(null)}
            >
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
                Cancel
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.priceChangeBtn, { backgroundColor: Colors.primary }]}
              onPress={handleAcceptPriceChange}
            >
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: Colors.white }}>
                Accept & place order
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const label = isSubmitting
      ? buttonLabel
      : `Place Order • ${formatCurrency(clientTotal)}`;

    return (
      <View style={[styles.checkoutContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!isMinimumOrderMet() || isSubmitting) && styles.checkoutButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!isMinimumOrderMet() || isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
              <CustomText fontFamily="SemiBold" fontSize={15} style={styles.checkoutButtonText}>
                {label}
              </CustomText>
            </View>
          ) : (
            <CustomText fontFamily="SemiBold" fontSize={16} style={styles.checkoutButtonText}>
              {label}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>
          Checkout
        </CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {restaurant && (
          <View style={[styles.restaurantHeader, { backgroundColor: colors.card }]}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
              {restaurant.name}
            </CustomText>
          </View>
        )}

        {/* Inline error banner */}
        {checkoutError && <View style={styles.bannerWrapper}>{renderErrorBanner()}</View>}

        {/* Delivery Address */}
        <View style={styles.section}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Delivery Address
          </CustomText>
          <TouchableOpacity
            style={[styles.addressCard, { backgroundColor: colors.card }]}
            onPress={() => setIsAddressModalOpen(true)}
          >
            <Ionicons name="location" size={RFValue(20)} color={Colors.primary} />
            <View style={styles.addressInfo}>
              <CustomText fontFamily="Medium" fontSize={14} numberOfLines={2} style={{ color: colors.text }}>
                {location?.address || 'Set delivery address'}
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Delivery Time */}
        <View style={styles.section}>
          <CheckoutDeliveryTime
            mode={deliveryTimeMode}
            onModeChange={setDeliveryTimeMode}
            estimatedTime="16-21 min"
          />
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Delivery Instructions
          </CustomText>
          <TouchableOpacity
            style={[styles.instructionsCard, { backgroundColor: colors.card }]}
            onPress={() => {
              setInstructionsDraft(deliveryInstructions);
              setInstructionsModalOpen(true);
            }}
          >
            <Ionicons name="bag-outline" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.instructionsInfo}>
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text }} numberOfLines={2}>
                {deliveryInstructions.trim() ? deliveryInstructions.trim() : 'e.g. Leave at door, ring bell'}
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
                Tap to edit
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Send as gift */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/customer/delivery/gifting' as any)}
        >
          <Ionicons name="gift-outline" size={RFValue(20)} color={Colors.primary} />
          <View style={styles.optionCardContent}>
            <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>Send as gift</CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              Send this order as a gift to someone
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Deals & promo */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/customer/delivery/deals' as any)}
        >
          <Ionicons name="pricetag-outline" size={RFValue(20)} color={Colors.primary} />
          <View style={styles.optionCardContent}>
            <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>Deals & gift cards</CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              Add promo code or redeem gift card
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* If item unavailable */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
          onPress={() => {
            setSoldOutModalSelected(unavailableItemPreference);
            setSoldOutModalVisible(true);
          }}
        >
          <Ionicons name="alert-circle-outline" size={RFValue(20)} color={Colors.primary} />
          <View style={styles.optionCardContent}>
            <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>
              If an item is unavailable
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              {unavailableItemPreference ? SOLD_OUT_LABELS[unavailableItemPreference] : 'Choose what to do'}
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.section}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Tip Driver
          </CustomText>
          <View style={styles.tipOptions}>
            {tipOptions.map((tip) => (
              <TouchableOpacity
                key={tip}
                style={[
                  styles.tipButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: tipAmount === tip ? Colors.primary : colors.divider,
                    borderWidth: tipAmount === tip ? 2 : 1,
                  },
                ]}
                onPress={() => setTipAmount(tip)}
              >
                <CustomText
                  fontFamily={tipAmount === tip ? 'SemiBold' : 'Regular'}
                  fontSize={14}
                  style={{ color: tipAmount === tip ? Colors.primary : colors.text }}
                >
                  ${tip}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.summarySection, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Order Summary
          </CustomText>
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>Subtotal</CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>{formatCurrency(getSubtotal())}</CustomText>
          </View>
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>Delivery Fee</CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>{formatCurrency(getDeliveryFee())}</CustomText>
          </View>
          <View style={styles.summaryRow}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>Platform Fee</CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>{formatCurrency(getPlatformFee())}</CustomText>
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>Tip</CustomText>
              <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>{formatCurrency(tipAmount)}</CustomText>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryRow}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text }}>Total</CustomText>
            <CustomText fontFamily="Bold" fontSize={18} style={{ color: Colors.primary }}>
              {formatCurrency(clientTotal)}
            </CustomText>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Modals */}
      <MapPickerModal
        visible={isAddressModalOpen}
        title="Delivery Address"
        selectedLocation={
          location
            ? { latitude: location.latitude, longitude: location.longitude, address: location.address }
            : undefined
        }
        onClose={() => setIsAddressModalOpen(false)}
        onSelectLocation={(data: SelectedMapLocation) => {
          if (data?.latitude !== undefined && data?.longitude !== undefined) {
            setLocation({ latitude: data.latitude, longitude: data.longitude, address: data.address });
            clearError();
          }
          setIsAddressModalOpen(false);
        }}
      />

      <Modal
        visible={instructionsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setInstructionsModalOpen(false)}
      >
        <View style={styles.instructionsModalOverlay}>
          <View style={[styles.instructionsModalSheet, { backgroundColor: colors.background }]}>
            <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text, marginBottom: 12 }}>
              Delivery instructions
            </CustomText>
            <TextInput
              style={[
                styles.instructionsModalInput,
                { color: colors.text, backgroundColor: colors.card, borderColor: colors.divider },
              ]}
              placeholder="e.g. Apartment 4B, gate code 1234"
              placeholderTextColor={colors.textSecondary}
              value={instructionsDraft}
              onChangeText={setInstructionsDraft}
              multiline
              maxLength={500}
            />
            <View style={styles.instructionsModalActions}>
              <TouchableOpacity
                style={[styles.instructionsModalBtn, { backgroundColor: colors.divider }]}
                onPress={() => setInstructionsModalOpen(false)}
              >
                <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>Cancel</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.instructionsModalBtn, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setDeliveryInstructions(instructionsDraft.trim());
                  setInstructionsModalOpen(false);
                }}
              >
                <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: Colors.white }}>Save</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SoldOutPreferenceModal
        visible={soldOutModalVisible}
        selected={soldOutModalSelected}
        onSelect={setSoldOutModalSelected}
        onClose={() => setSoldOutModalVisible(false)}
        onSave={() => {
          if (soldOutModalSelected) {
            setUnavailableItemPreference(soldOutModalSelected);
            if (checkoutError?.code === 'ITEMS_UNAVAILABLE') clearError();
          }
          setSoldOutModalVisible(false);
        }}
      />

      {renderCTA()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  restaurantHeader: { padding: 16, marginBottom: 8 },
  bannerWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  errorContent: { flex: 1 },
  errorActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  errorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorBtnFull: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  section: { padding: 16, marginBottom: 8 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  addressInfo: { flex: 1 },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  instructionsInfo: { flex: 1 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    gap: 12,
  },
  optionCardContent: { flex: 1 },
  tipOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  summarySection: { margin: 16, padding: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  divider: { height: 1, marginVertical: 12 },
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
  checkoutButtonDisabled: { opacity: 0.5 },
  checkoutButtonText: { color: Colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  priceChangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  priceChangeActions: { flexDirection: 'row', gap: 10 },
  priceChangeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  instructionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  instructionsModalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 34,
  },
  instructionsModalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  instructionsModalActions: { flexDirection: 'row', gap: 12 },
  instructionsModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default CheckoutScreen;
