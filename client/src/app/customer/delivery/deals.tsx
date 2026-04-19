import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

const EXAMPLE_DEALS = [
  { id: '1', title: '20% off your order', description: 'Min. order applies. One per user.', cta: 'Apply' },
  { id: '2', title: 'Free delivery', description: 'On qualifying orders above minimum.', cta: 'Apply' },
];

const DealsScreen = () => {
  const { colors } = useThemeStore();
  const [promoCode, setPromoCode] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleApplyPromo = () => {
    const code = promoCode.trim();
    if (!code) return;
    if (code.length < 4) {
      setErrorMessage('Please enter a valid promo code.');
      setErrorModalVisible(true);
      return;
    }
    setErrorMessage('This promo code is not valid or has already been used.');
    setErrorModalVisible(true);
  };

  const handleRedeemGiftCard = () => {
    const pin = giftCardPin.trim();
    if (!pin) return;
    setErrorMessage('This gift card PIN is invalid or has already been redeemed.');
    setErrorModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>
          Deals & Gift Cards
        </CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
        <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginBottom: 16 }}>
          Enter a promo code or redeem a gift card below to save on your next order.
        </CustomText>
        <View style={[styles.block, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 8 }}>
            Promo code
          </CustomText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Enter code"
              placeholderTextColor={colors.textSecondary}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: Colors.primary }]}
              onPress={handleApplyPromo}
            >
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: Colors.white }}>
                Apply
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.block, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 8 }}>
            Gift card
          </CustomText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Enter PIN"
              placeholderTextColor={colors.textSecondary}
              value={giftCardPin}
              onChangeText={setGiftCardPin}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.divider }]}
              onPress={handleRedeemGiftCard}
            >
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
                Redeem
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginTop: 24, marginBottom: 12 }}>
          Example deals (not active)
        </CustomText>
        {EXAMPLE_DEALS.map((deal) => (
          <TouchableOpacity
            key={deal.id}
            style={[styles.dealCard, { backgroundColor: colors.card }]}
            onPress={() => {
              setPromoCode(deal.id);
            }}
          >
            <View style={styles.dealContent}>
              <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
                {deal.title}
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
                {deal.description}
              </CustomText>
            </View>
            <TouchableOpacity style={[styles.dealCta, { borderColor: Colors.primary }]}>
              <CustomText fontFamily="Medium" fontSize={14} style={{ color: Colors.primary }}>
                {deal.cta}
              </CustomText>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.errorOverlay}>
          <View style={[styles.errorSheet, { backgroundColor: colors.background }]}>
            <CustomText fontFamily="Bold" fontSize={18} style={{ color: colors.text, marginBottom: 8 }}>
              Whoops
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={15} style={{ color: colors.textSecondary, marginBottom: 24 }}>
              {errorMessage}
            </CustomText>
            <TouchableOpacity
              style={[styles.dismissBtn, { backgroundColor: Colors.primary }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: Colors.white }}>
                OK
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  contentInner: { padding: 20 },
  block: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  dealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  dealContent: { flex: 1 },
  dealCta: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorSheet: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 16,
  },
  dismissBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default DealsScreen;
