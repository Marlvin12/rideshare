import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { DeliveryStore } from '@/utils/types';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.75;

interface HorizontalStoreListProps {
  title: string;
  stores: DeliveryStore[];
  onStorePress: (storeId: string) => void;
}

const HorizontalStoreList: React.FC<HorizontalStoreListProps> = ({
  title,
  stores,
  onStorePress,
}) => {
  if (stores.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText fontFamily="SemiBold" fontSize={18} style={styles.title}>
          {title}
        </CustomText>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={RFValue(20)} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stores.map((store) => (
          <TouchableOpacity
            key={store._id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onStorePress(store._id)}
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
                  <Ionicons name="restaurant" size={RFValue(32)} color={Colors.textLight} />
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <CustomText fontFamily="SemiBold" fontSize={14} numberOfLines={1} style={styles.name}>
                {store.name}
              </CustomText>
              <View style={styles.infoRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={RFValue(10)} color="#FFC107" />
                  <CustomText fontFamily="Medium" fontSize={10} style={styles.rating}>
                    {store.rating.toFixed(1)}
                  </CustomText>
                </View>
                <View style={styles.dot} />
                <CustomText fontFamily="Regular" fontSize={10} style={styles.time}>
                  {store.preparationTime || 25} min
                </CustomText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
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
  cardContent: {
    padding: 12,
  },
  name: {
    color: Colors.text,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    color: Colors.text,
    marginLeft: 2,
    fontSize: 10,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textLight,
    marginHorizontal: 6,
  },
  time: {
    color: Colors.textLight,
  },
});

export default HorizontalStoreList;
