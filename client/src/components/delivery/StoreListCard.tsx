import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { DeliveryStore } from '@/utils/types';

interface StoreListCardProps {
  store: DeliveryStore;
  onPress: () => void;
}

const StoreListCard: React.FC<StoreListCardProps> = ({ store, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {store.coverImage || store.imageUrl ? (
          <Image
            source={{ uri: store.coverImage || store.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="restaurant" size={RFValue(40)} color={Colors.textLight} />
          </View>
        )}
        {store.featured && (
          <View style={styles.featuredBadge}>
            <CustomText fontFamily="SemiBold" fontSize={10} style={styles.featuredText}>
              Featured
            </CustomText>
          </View>
        )}
        {!store.isOpen && (
          <View style={styles.closedOverlay}>
            <CustomText fontFamily="SemiBold" fontSize={12} style={styles.closedText}>
              Closed
            </CustomText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <CustomText fontFamily="SemiBold" fontSize={16} numberOfLines={1} style={styles.name}>
            {store.name}
          </CustomText>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={RFValue(20)} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={RFValue(12)} color="#FFC107" />
            <CustomText fontFamily="Medium" fontSize={12} style={styles.rating}>
              {store.rating.toFixed(1)}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={11} style={styles.reviewCount}>
              ({store.reviewCount}+)
            </CustomText>
          </View>
          <View style={styles.dot} />
          <CustomText fontFamily="Regular" fontSize={11} style={styles.cuisine} numberOfLines={1}>
            {store.cuisine.slice(0, 2).join(', ')}
          </CustomText>
        </View>

        <View style={styles.deliveryRow}>
          <Ionicons name="time-outline" size={RFValue(12)} color={Colors.textLight} />
          <CustomText fontFamily="Regular" fontSize={11} style={styles.deliveryText}>
            {store.preparationTime || 25}-{(store.preparationTime || 25) + 15} min
          </CustomText>
          <View style={styles.dot} />
          <CustomText fontFamily="Regular" fontSize={11} style={styles.deliveryText}>
            ${store.deliveryFee.toFixed(2)} delivery
          </CustomText>
        </View>

        {store.promoCode && (
          <View style={styles.promoBadge}>
            <CustomText fontFamily="SemiBold" fontSize={11} style={styles.promoText}>
              {store.promoCode}
            </CustomText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: Colors.white,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    color: Colors.text,
  },
  favoriteButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    color: Colors.text,
    marginLeft: 2,
  },
  reviewCount: {
    color: Colors.textLight,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textLight,
    marginHorizontal: 6,
  },
  cuisine: {
    color: Colors.textLight,
    flex: 1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    color: Colors.textLight,
    marginLeft: 4,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  promoText: {
    color: Colors.white,
  },
});

export default StoreListCard;
