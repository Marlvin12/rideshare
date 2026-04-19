import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors, screenHeight } from '@/utils/Constants';
import { DeliveryStore } from '@/utils/types';

const { width: screenWidth } = Dimensions.get('window');

interface StoreHeroProps {
  store: DeliveryStore;
  onBack: () => void;
  onSearch?: () => void;
  onFavorite?: () => void;
  onMore?: () => void;
}

const StoreHero: React.FC<StoreHeroProps> = ({
  store,
  onBack,
  onSearch,
  onFavorite,
  onMore,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {store.coverImage || store.imageUrl ? (
          <Image
            source={{ uri: store.coverImage || store.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="restaurant" size={RFValue(60)} color={Colors.white} />
          </View>
        )}
        <View style={styles.overlay} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="close" size={RFValue(22)} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.rightButtons}>
            {onSearch && (
              <TouchableOpacity style={styles.headerButton} onPress={onSearch}>
                <Ionicons name="search" size={RFValue(20)} color={Colors.white} />
              </TouchableOpacity>
            )}
            {onFavorite && (
              <TouchableOpacity style={styles.headerButton} onPress={onFavorite}>
                <Ionicons name="heart-outline" size={RFValue(20)} color={Colors.white} />
              </TouchableOpacity>
            )}
            {onMore && (
              <TouchableOpacity style={styles.headerButton} onPress={onMore}>
                <Ionicons name="ellipsis-horizontal" size={RFValue(20)} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: screenHeight * 0.35,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default StoreHero;
