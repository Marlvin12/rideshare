import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import StorePhotoViewer from '@/components/delivery/StorePhotoViewer';
import { Colors } from '@/utils/Constants';
import { getRestaurantById } from '@/service/eatsService';
import { useDeliveryStore } from '@/store/deliveryStore';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';

const MOCK_HOURS = [
  { day: 'Mon', hours: '11:00 AM – 9:00 PM' },
  { day: 'Tue', hours: '11:00 AM – 9:00 PM' },
  { day: 'Wed', hours: '11:00 AM – 9:00 PM' },
  { day: 'Thu', hours: '11:00 AM – 9:00 PM' },
  { day: 'Fri', hours: '11:00 AM – 10:00 PM' },
  { day: 'Sat', hours: '10:00 AM – 10:00 PM' },
  { day: 'Sun', hours: '10:00 AM – 9:00 PM' },
];

const MOCK_REVIEWS = [
  { author: 'Alex M.', rating: 5, text: 'Fast delivery and food was still hot. Will order again!', date: '2 weeks ago' },
  { author: 'Jordan K.', rating: 4, text: 'Good portions. Only issue was a missing napkin.', date: '1 month ago' },
];

const StoreInfoScreen = () => {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { colors } = useThemeStore();
  const { selectedStore, setSelectedStore } = useDeliveryStore();

  const [store, setStore] = useState<DeliveryStore | null>(selectedStore);
  const [isLoading, setIsLoading] = useState(!selectedStore);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  const fetchStore = useCallback(async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    const result = await getRestaurantById(storeId);
    if (result.success) {
      const storeData = result.restaurant as DeliveryStore;
      setStore(storeData);
      setSelectedStore(storeData);
    }
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    if (!selectedStore || selectedStore._id !== storeId) {
      fetchStore();
    } else {
      setStore(selectedStore);
    }
  }, [storeId]);

  if (isLoading || !store) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <CustomText fontFamily="Medium" fontSize={16}>Loading...</CustomText>
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
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>Store Info</CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(store.coverImage || store.imageUrl) && (
          <TouchableOpacity onPress={() => setPhotoViewerVisible(true)} activeOpacity={1}>
            <Image
              source={{ uri: store.coverImage || store.imageUrl }}
              style={styles.coverImage}
            />
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={RFValue(14)} color={Colors.white} />
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: Colors.white, marginLeft: 4 }}>
                1 Photo
              </CustomText>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.infoSection}>
          <CustomText fontFamily="Bold" fontSize={24} style={{ color: colors.text, marginBottom: 8 }}>
            {store.name}
          </CustomText>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={RFValue(14)} color="#FFC107" />
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text, marginLeft: 4 }}>
              {store.rating.toFixed(1)}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginLeft: 4 }}>
              ({store.reviewCount}+ reviews)
            </CustomText>
          </View>

          <View style={styles.cuisineRow}>
            {store.cuisine.map((cuisine, index) => (
              <View key={index} style={[styles.cuisineTag, { backgroundColor: colors.card }]}>
                <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.text }}>
                  {cuisine}
                </CustomText>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.detailContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginBottom: 4 }}>
                Address
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                {store.location.address}
              </CustomText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.detailContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginBottom: 4 }}>
                Delivery Time
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                {store.preparationTime || 25}-{(store.preparationTime || 25) + 15} min
              </CustomText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.detailRow}>
            <Ionicons name="bicycle-outline" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.detailContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginBottom: 4 }}>
                Delivery Fee
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                ${store.deliveryFee.toFixed(2)}
              </CustomText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.detailContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginBottom: 4 }}>
                Minimum Order
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                ${store.minimumOrder.toFixed(2)}
              </CustomText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.hoursCard, { backgroundColor: colors.card }]}
          onPress={() => setHoursExpanded(!hoursExpanded)}
        >
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={RFValue(18)} color={Colors.primary} />
            <View style={styles.detailContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginBottom: 4 }}>
                Hours
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                {hoursExpanded ? 'Tap to collapse' : MOCK_HOURS[0].hours + ' (tap to see all)'}
              </CustomText>
            </View>
            <Ionicons
              name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
              size={RFValue(20)}
              color={colors.textSecondary}
            />
          </View>
          {hoursExpanded && (
            <View style={[styles.hoursList, { borderTopColor: colors.divider }]}>
              {MOCK_HOURS.map((row) => (
                <View key={row.day} style={styles.hoursRow}>
                  <CustomText fontFamily="Medium" fontSize={13} style={{ color: colors.text, width: 36 }}>
                    {row.day}
                  </CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
                    {row.hours}
                  </CustomText>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.reviewsCard, { backgroundColor: colors.card }]}>
          <View style={styles.reviewsHeader}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text }}>
              Reviews
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary }}>
              {store.reviewCount}+ reviews
            </CustomText>
          </View>
          {MOCK_REVIEWS.map((review, index) => (
            <View key={index} style={[styles.reviewItem, { borderTopColor: colors.divider }]}>
              <View style={styles.reviewHeader}>
                <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
                  {review.author}
                </CustomText>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= review.rating ? 'star' : 'star-outline'}
                      size={RFValue(12)}
                      color="#FFC107"
                    />
                  ))}
                </View>
              </View>
              <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
                {review.text}
              </CustomText>
              <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary, marginTop: 4 }}>
                {review.date}
              </CustomText>
            </View>
          ))}
        </View>

        <View style={[styles.legalCard, { backgroundColor: colors.card }]}>
          <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, lineHeight: 18 }}>
            Menu and pricing may differ from in-store. Allergen info may be incomplete. Please contact the store for
            dietary questions.
          </CustomText>
          <TouchableOpacity
            style={styles.reportLink}
            onPress={() => Linking.openURL('https://example.com/report-menu')}
          >
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: Colors.primary }}>
              Report a menu or pricing issue
            </CustomText>
          </TouchableOpacity>
        </View>

        {store.description && (
          <View style={[styles.descriptionCard, { backgroundColor: colors.card }]}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 8 }}>
              About
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, lineHeight: 20 }}>
              {store.description}
            </CustomText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <StorePhotoViewer
        visible={photoViewerVisible}
        imageUri={store.coverImage || store.imageUrl || ''}
        onClose={() => setPhotoViewerVisible(false)}
        onReportIssue={() => {
          setPhotoViewerVisible(false);
          Linking.openURL('https://example.com/report-menu');
        }}
      />
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
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoSection: {
    padding: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  descriptionCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  hoursCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  hoursList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewItem: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  legalCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  reportLink: {
    marginTop: 12,
  },
});

export default StoreInfoScreen;
