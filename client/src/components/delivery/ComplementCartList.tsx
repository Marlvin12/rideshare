import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.4;

interface ComplementItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  calories?: number;
  approvalPercentage?: number;
}

interface ComplementCartListProps {
  items: ComplementItem[];
  onAddItem: (item: ComplementItem) => void;
}

const ComplementCartList: React.FC<ComplementCartListProps> = ({
  items,
  onAddItem,
}) => {
  const { colors } = useThemeStore();

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <CustomText fontFamily="SemiBold" fontSize={18} style={[styles.title, { color: colors.text }]}>
        Complement your cart
      </CustomText>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={[styles.card, { width: cardWidth, backgroundColor: colors.card }]}
            onPress={() => onAddItem(item)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Ionicons name="fast-food" size={RFValue(24)} color={Colors.textLight} />
                </View>
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddItem(item)}
              >
                <Ionicons name="add" size={RFValue(18)} color={Colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardContent}>
              <CustomText fontFamily="SemiBold" fontSize={13} numberOfLines={2} style={{ color: colors.text }}>
                {item.name}
              </CustomText>
              {item.calories && (
                <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.textSecondary, marginTop: 2 }}>
                  ({item.calories} Cals)
                </CustomText>
              )}
              <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, marginTop: 4 }}>
                ${item.price.toFixed(2)}
              </CustomText>
              {item.approvalPercentage && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="thumbs-up" size={RFValue(10)} color={colors.text} />
                  <CustomText fontFamily="Regular" fontSize={10} style={{ color: colors.text, marginLeft: 4 }}>
                    {item.approvalPercentage}%
                  </CustomText>
                </View>
              )}
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
  title: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
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
    position: 'relative',
    width: '100%',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    padding: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});

export default ComplementCartList;
