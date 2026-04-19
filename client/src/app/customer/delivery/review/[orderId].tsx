import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { rateFoodOrder } from '@/service/foodOrderService';
import { useThemeStore } from '@/store/themeStore';

const ReviewScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useThemeStore();

  const [restaurantRating, setRestaurantRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [restaurantTags, setRestaurantTags] = useState<string[]>([]);
  const [courierTags, setCourierTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const restaurantTagOptions = ['Fast delivery', 'Great food', 'Good value', 'Friendly staff'];
  const courierTagOptions = ['Fast delivery', 'Friendly', 'Careful handling', 'Good communication'];

  const handleSubmit = async () => {
    if (restaurantRating === 0 || courierRating === 0) {
      Alert.alert('Please rate', 'Please provide ratings for both restaurant and courier');
      return;
    }

    const result = await rateFoodOrder(orderId!, {
      restaurantRating: {
        score: restaurantRating,
        comment: comment || undefined,
      },
      courierRating: {
        score: courierRating,
        comment: comment || undefined,
      },
    });

    if (result.success) {
      Alert.alert('Thank you!', 'Your review has been submitted', [
        { text: 'OK', onPress: () => router.replace('/customer/delivery') },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to submit review');
    }
  };

  const renderStarRating = (
    rating: number,
    onRatingChange: (rating: number) => void,
    label: string
  ) => {
    return (
      <View style={styles.ratingSection}>
        <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
          {label}
        </CustomText>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={RFValue(32)}
                color={star <= rating ? '#FFC107' : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTags = (
    tags: string[],
    onTagsChange: (tags: string[]) => void,
    options: string[]
  ) => {
    return (
      <View style={styles.tagsSection}>
        <View style={styles.tagsContainer}>
          {options.map((tag) => {
            const isSelected = tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: colors.card, borderColor: isSelected ? Colors.primary : colors.divider },
                  isSelected && { borderWidth: 2 },
                ]}
                onPress={() => {
                  if (isSelected) {
                    onTagsChange(tags.filter((t) => t !== tag));
                  } else {
                    onTagsChange([...tags, tag]);
                  }
                }}
              >
                <CustomText
                  fontFamily={isSelected ? 'SemiBold' : 'Regular'}
                  fontSize={13}
                  style={{ color: isSelected ? Colors.primary : colors.text }}
                >
                  {tag}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={RFValue(22)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>Rate Your Order</CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStarRating(restaurantRating, setRestaurantRating, 'Rate the Restaurant')}
        {renderTags(restaurantTags, setRestaurantTags, restaurantTagOptions)}

        {renderStarRating(courierRating, setCourierRating, 'Rate the Courier')}
        {renderTags(courierTags, setCourierTags, courierTagOptions)}

        <View style={styles.commentSection}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12 }}>
            Additional Comments (Optional)
          </CustomText>
          <View style={[styles.commentInput, { backgroundColor: colors.card }]}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
              Share your experience...
            </CustomText>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (restaurantRating === 0 || courierRating === 0) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={restaurantRating === 0 || courierRating === 0}
        >
          <CustomText fontFamily="SemiBold" fontSize={16} style={styles.submitButtonText}>
            Submit Review
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
    padding: 20,
  },
  ratingSection: {
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    minHeight: 100,
    padding: 16,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
  },
});

export default ReviewScreen;
