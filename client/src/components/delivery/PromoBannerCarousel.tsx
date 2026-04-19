import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

const { width: screenWidth } = Dimensions.get('window');

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
}

const banners: PromoBanner[] = [
  {
    id: 'ridepass',
    title: 'Get free delivery and lower fees with RidePass',
    subtitle: 'On eligible orders. Terms apply.',
    cta: 'Try it free for 30 days',
    color: '#ac1d17',
  },
  {
    id: 'first-order',
    title: 'Free delivery on your first order',
    subtitle: 'New users only. Min. order applies.',
    cta: 'Order now',
    color: '#1a6b3a',
  },
];

const PromoBannerCarousel: React.FC = () => {
  const { colors } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <View
            key={banner.id}
            style={[styles.banner, { backgroundColor: banner.color, width: screenWidth - 32 }]}
          >
            <View style={styles.bannerContent}>
              <View style={styles.textContainer}>
                <CustomText fontFamily="SemiBold" fontSize={16} style={styles.bannerTitle}>
                  {banner.title}
                </CustomText>
                <CustomText fontFamily="Regular" fontSize={12} style={styles.bannerSubtitle}>
                  {banner.subtitle}
                </CustomText>
                <TouchableOpacity style={styles.ctaButton}>
                  <CustomText fontFamily="SemiBold" fontSize={14} style={styles.ctaText}>
                    {banner.cta}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  bannerContent: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaText: {
    color: Colors.primary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
});

export default PromoBannerCarousel;
