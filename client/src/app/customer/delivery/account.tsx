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
import AddressHeader from '@/components/delivery/AddressHeader';
import { Colors } from '@/utils/Constants';
import { useUserStore } from '@/store/userStore';
import { useThemeStore } from '@/store/themeStore';
import { showFeatureUnavailable } from '@/utils/featureUnavailable';

const AccountScreen = () => {
  const { colors } = useThemeStore();
  const { user } = useUserStore();

  const menuItems = [
    { icon: 'person-outline', label: 'Account', route: '/customer/account' as const },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      onUnavailable: () =>
        showFeatureUnavailable('Payment methods', 'Saved payment methods are not available yet.'),
    },
    {
      icon: 'star-outline',
      label: 'Past Reviews',
      onUnavailable: () =>
        showFeatureUnavailable('Reviews', 'Past order reviews are not available here yet.'),
    },
    {
      icon: 'gift-outline',
      label: 'RidePass',
      onUnavailable: () =>
        showFeatureUnavailable('RidePass', 'Subscriptions are not available yet.'),
    },
    { icon: 'settings-outline', label: 'Settings', route: '/customer/account/settings' as const },
    { icon: 'help-circle-outline', label: 'Help', route: '/customer/delivery/help' as const },
    {
      icon: 'information-circle-outline',
      label: 'About',
      onUnavailable: () =>
        showFeatureUnavailable('About', 'App version and legal info screen is not available yet.'),
    },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <AddressHeader />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.divider }]}>
            <Ionicons name="person" size={RFValue(40)} color={colors.textSecondary} />
          </View>
          <CustomText fontFamily="SemiBold" fontSize={20} style={{ color: colors.text, marginTop: 12 }}>
            {user?.name || 'Guest User'}
          </CustomText>
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginTop: 4 }}>
            {user?.email || 'guest@example.com'}
          </CustomText>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}
              onPress={() => {
                if ('route' in item && item.route) {
                  router.push(item.route as any);
                } else if ('onUnavailable' in item) {
                  item.onUnavailable();
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={RFValue(22)} color={colors.text} />
                <CustomText fontFamily="Regular" fontSize={15} style={{ color: colors.text, marginLeft: 16 }}>
                  {item.label}
                </CustomText>
              </View>
              <Ionicons name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

export default AccountScreen;
