import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useRestaurantStore } from '@/store/restaurantStore';
import { getRestaurantById } from '@/service/eatsService';
import { setRestaurantOpen, setRestaurantPreparationTime } from '@/service/restaurantService';
import { Colors } from '@/utils/Constants';

const PREP_TIME_MIN = 5;
const PREP_TIME_MAX = 120;

const RestaurantAccount = () => {
  const { restaurantId } = useRestaurantStore();
  const [isOpen, setIsOpen] = useState(true);
  const [preparationTime, setPreparationTime] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingOpen, setSavingOpen] = useState(false);
  const [savingPrep, setSavingPrep] = useState(false);

  const loadRestaurant = useCallback(async () => {
    if (!restaurantId) return;
    setError(null);
    const result = await getRestaurantById(restaurantId);
    if (result.success && result.restaurant) {
      const r = result.restaurant as { isOpen?: boolean; preparationTime?: number };
      setIsOpen(r.isOpen !== false);
      setPreparationTime(String(r.preparationTime ?? 30));
    } else {
      setError((result as { error?: string }).error ?? 'Failed to load restaurant');
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const handleOpenToggle = async (value: boolean) => {
    if (!restaurantId) return;
    setSavingOpen(true);
    const result = await setRestaurantOpen(restaurantId, value);
    setSavingOpen(false);
    if (result.success) {
      setIsOpen(value);
    } else {
      setError((result as { error?: string }).error ?? 'Failed to update status');
    }
  };

  const handleSavePrepTime = async () => {
    if (!restaurantId) return;
    const num = parseInt(preparationTime, 10);
    if (Number.isNaN(num) || num < PREP_TIME_MIN || num > PREP_TIME_MAX) {
      Alert.alert(
        'Invalid value',
        `Preparation time must be between ${PREP_TIME_MIN} and ${PREP_TIME_MAX} minutes.`
      );
      return;
    }
    setSavingPrep(true);
    const result = await setRestaurantPreparationTime(restaurantId, num);
    setSavingPrep(false);
    if (result.success) {
      setPreparationTime(String(num));
    } else {
      setError((result as { error?: string }).error ?? 'Failed to update preparation time');
    }
  };

  if (!restaurantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor={Colors.white} />
        <EmptyState
          icon="restaurant-outline"
          title="No restaurant selected"
          message="Set EXPO_PUBLIC_RESTAURANT_ID in .env to use this app."
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message="Loading..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.white} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CustomText fontFamily="SemiBold" fontSize={20} style={styles.title}>
          Account
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
          Operations and support
        </CustomText>

        {error ? (
          <ErrorState
            message={error}
            onRetry={() => { setError(null); loadRestaurant(); }}
          />
        ) : (
          <>
            <View style={styles.card}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={styles.cardTitle}>
                Restaurant ID
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={styles.mono} numberOfLines={1}>
                {restaurantId}
              </CustomText>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <CustomText fontFamily="Medium" fontSize={15}>
                  Open for orders
                </CustomText>
                <Switch
                  value={isOpen}
                  onValueChange={handleOpenToggle}
                  disabled={savingOpen}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={Colors.white}
                />
              </View>
              <CustomText fontFamily="Regular" fontSize={12} style={styles.hint}>
                When off, customers cannot place new orders.
              </CustomText>
            </View>

            <View style={styles.card}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={styles.cardTitle}>
                Default preparation time (minutes)
              </CustomText>
              <View style={styles.prepRow}>
                <TextInput
                  style={styles.input}
                  value={preparationTime}
                  onChangeText={setPreparationTime}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={Colors.textLight}
                  maxLength={3}
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingPrep && styles.saveButtonDisabled]}
                  onPress={handleSavePrepTime}
                  disabled={savingPrep}
                >
                  <CustomText fontFamily="SemiBold" fontSize={14} style={styles.saveButtonText}>
                    Save
                  </CustomText>
                </TouchableOpacity>
              </View>
              <CustomText fontFamily="Regular" fontSize={12} style={styles.hint}>
                {PREP_TIME_MIN}–{PREP_TIME_MAX} minutes. Used when accepting new orders.
              </CustomText>
            </View>

            <View style={styles.card}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={styles.cardTitle}>
                Support
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={styles.supportText}>
                For help with your account or orders, contact support from the main app or email
                support from your app store listing.
              </CustomText>
            </View>
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textLight,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    color: Colors.textLight,
    marginTop: 8,
  },
  mono: {
    color: Colors.textLight,
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
  },
  supportText: {
    color: Colors.textLight,
    lineHeight: 20,
  },
});

export default RestaurantAccount;
