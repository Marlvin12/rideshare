import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';
import { showFeatureUnavailable } from '@/utils/featureUnavailable';

type HelpItem = {
  icon: string;
  label: string;
  onPress: () => void;
};

const HelpScreen = () => {
  const { colors } = useThemeStore();

  const helpCategories: { title: string; items: HelpItem[] }[] = [
    {
      title: 'Order Issues',
      items: [
        {
          icon: 'time-outline',
          label: 'Order never arrived',
          onPress: () =>
            showFeatureUnavailable(
              'Order never arrived',
              'Order issue workflows are not available yet. Contact support from Account > Help.'
            ),
        },
        {
          icon: 'bag-outline',
          label: 'Missing item',
          onPress: () =>
            showFeatureUnavailable(
              'Missing item',
              'Report missing items through support. This flow is not built yet.'
            ),
        },
        {
          icon: 'close-circle-outline',
          label: 'Wrong order',
          onPress: () =>
            showFeatureUnavailable(
              'Wrong order',
              'Order correction is not available in-app yet. Contact support.'
            ),
        },
        {
          icon: 'card-outline',
          label: 'Payment issue',
          onPress: () =>
            showFeatureUnavailable(
              'Payment',
              'Payment disputes are not handled in-app yet. Contact support.'
            ),
        },
      ],
    },
    {
      title: 'Account & Settings',
      items: [
        {
          icon: 'person-outline',
          label: 'Update account info',
          onPress: () => router.push('/customer/account/settings'),
        },
        {
          icon: 'location-outline',
          label: 'Change delivery address',
          onPress: () =>
            showFeatureUnavailable(
              'Delivery address',
              'Change your address from the delivery home screen using the address bar at the top.'
            ),
        },
        {
          icon: 'notifications-outline',
          label: 'Notification settings',
          onPress: () => router.push('/customer/account/settings'),
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'FAQ',
          onPress: () =>
            showFeatureUnavailable('FAQ', 'Frequently asked questions are not published in-app yet.'),
        },
        {
          icon: 'chatbubble-outline',
          label: 'Contact Support',
          onPress: () => router.push('/customer/account/support'),
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          onPress: () =>
            showFeatureUnavailable('Terms of Service', 'Legal documents are not published in-app yet.'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>Help & Support</CustomText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {helpCategories.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.categorySection}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginBottom: 12, paddingHorizontal: 20 }}>
              {category.title}
            </CustomText>
            
            {category.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.helpItem, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}
                onPress={item.onPress}
              >
                <View style={styles.helpItemLeft}>
                  <Ionicons name={item.icon as any} size={RFValue(22)} color={Colors.primary} />
                  <CustomText fontFamily="Regular" fontSize={15} style={{ color: colors.text, marginLeft: 16 }}>
                    {item.label}
                  </CustomText>
                </View>
                <Ionicons name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  categorySection: {
    marginTop: 24,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

export default HelpScreen;
