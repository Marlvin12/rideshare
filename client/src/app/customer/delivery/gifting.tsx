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
import CountryCodePicker, { CountryOption } from '@/components/delivery/CountryCodePicker';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

const CARD_OPTIONS = [
  { id: 'birthday', label: 'Birthday', icon: 'gift-outline' as const },
  { id: 'thankyou', label: 'Thank You', icon: 'heart-outline' as const },
  { id: 'congrats', label: 'Congratulations', icon: 'trophy-outline' as const },
  { id: 'getwell', label: 'Get Well Soon', icon: 'medkit-outline' as const },
  { id: 'custom', label: 'Custom Message', icon: 'chatbubble-outline' as const },
];

const GiftingScreen = () => {
  const { colors } = useThemeStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [country, setCountry] = useState<CountryOption | null>({ code: 'US', dialCode: '+1', name: 'United States' });
  const [recipientPhone, setRecipientPhone] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const canContinueStep1 = !!selectedCard;
  const canSaveStep2 =
    recipientFirstName.trim() &&
    recipientLastName.trim() &&
    country &&
    recipientPhone.trim().length >= 10;

  const handleSave = () => {
    if (!canSaveStep2) return;
    setPreviewModalVisible(true);
  };

  const handlePreviewDone = () => {
    setPreviewModalVisible(false);
    router.back();
  };

  const previewSmsText = `You've received a gift from ${senderName || 'Someone'}! Open the link to claim: [Gift Link]`;
  const selectedCardLabel = CARD_OPTIONS.find((c) => c.id === selectedCard)?.label ?? 'Gift';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>
          Send as Gift
        </CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
        {step === 1 && (
          <>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
              Choose a card
            </CustomText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {CARD_OPTIONS.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardOption,
                    { backgroundColor: colors.card, borderColor: selectedCard === card.id ? Colors.primary : colors.divider },
                    selectedCard === card.id && { borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedCard(card.id)}
                >
                  <Ionicons
                    name={card.icon}
                    size={RFValue(36)}
                    color={selectedCard === card.id ? Colors.primary : colors.textSecondary}
                  />
                  <CustomText
                    fontFamily={selectedCard === card.id ? 'SemiBold' : 'Regular'}
                    fontSize={13}
                    style={{ color: selectedCard === card.id ? Colors.primary : colors.text, marginTop: 8 }}
                  >
                    {card.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.inputBlock, { backgroundColor: colors.card }]}>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Personal message (optional)
              </CustomText>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Add a message..."
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
              Sender (optional)
            </CustomText>
            <View style={[styles.inputBlock, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>

            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12, marginTop: 20 }}>
              Recipient
            </CustomText>
            <View style={styles.nameRow}>
              <View style={[styles.inputBlock, styles.halfInput, { backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="First name"
                  placeholderTextColor={colors.textSecondary}
                  value={recipientFirstName}
                  onChangeText={setRecipientFirstName}
                />
              </View>
              <View style={[styles.inputBlock, styles.halfInput, { backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Last name"
                  placeholderTextColor={colors.textSecondary}
                  value={recipientLastName}
                  onChangeText={setRecipientLastName}
                />
              </View>
            </View>

            <View style={[styles.inputBlock, { backgroundColor: colors.card, marginTop: 12 }]}>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Phone number
              </CustomText>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={[styles.countryCodeBtn, { backgroundColor: colors.divider }]}
                  onPress={() => setCountryPickerVisible(true)}
                >
                  <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>
                    {country?.dialCode ?? '+1'}
                  </CustomText>
                  <Ionicons name="chevron-down" size={RFValue(16)} color={colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.phoneInput, { color: colors.text }]}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 16 }}>
              By continuing you agree to send this gift. The recipient will receive a link to claim it.
            </CustomText>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
        {step === 1 ? (
          <>
            <TouchableOpacity
              style={[styles.continueButton, !canContinueStep1 && styles.continueButtonDisabled]}
              onPress={() => canContinueStep1 && setStep(2)}
              disabled={!canContinueStep1}
            >
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.continueButtonText}>
                Continue
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
              <Ionicons name="chevron-back" size={RFValue(18)} color={colors.textSecondary} />
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
                Back
              </CustomText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.continueButton, !canSaveStep2 && styles.continueButtonDisabled]}
              onPress={handleSave}
              disabled={!canSaveStep2}
            >
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.continueButtonText}>
                Preview
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
              <Ionicons name="chevron-back" size={RFValue(18)} color={colors.textSecondary} />
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
                Back
              </CustomText>
            </TouchableOpacity>
          </>
        )}
      </View>

      <CountryCodePicker
        visible={countryPickerVisible}
        selected={country}
        onSelect={setCountry}
        onClose={() => setCountryPickerVisible(false)}
      />

      <Modal visible={previewModalVisible} animationType="slide" transparent>
        <View style={styles.previewOverlay}>
          <View style={[styles.previewSheet, { backgroundColor: colors.background }]}>
            <View style={styles.previewHandle} />
            <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text, marginBottom: 8 }}>
              Gift link preview
            </CustomText>
            <View style={[styles.previewSmsBox, { backgroundColor: colors.card }]}>
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
                SMS preview:
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, marginTop: 8 }}>
                {previewSmsText}
              </CustomText>
            </View>
            <View style={[styles.previewCardBox, { backgroundColor: colors.card }]}>
              <Ionicons name="gift" size={RFValue(40)} color={Colors.primary} />
              <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginTop: 12 }}>
                {selectedCardLabel} from {senderName || 'A friend'}
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
                Tap the link in the message to claim your gift.
              </CustomText>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={handlePreviewDone}>
              <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: Colors.white }}>
                Done
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  contentInner: {
    padding: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cardOption: {
    width: 100,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBlock: {
    padding: 16,
    borderRadius: 12,
  },
  input: {
    fontSize: 15,
    padding: 0,
  },
  halfInput: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  phoneInput: {
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: Colors.white,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  previewSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  previewHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewSmsBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewCardBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default GiftingScreen;
