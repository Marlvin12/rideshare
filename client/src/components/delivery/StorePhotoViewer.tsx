import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { useThemeStore } from '@/store/themeStore';

interface StorePhotoViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onReportIssue?: () => void;
}

export default function StorePhotoViewer({
  visible,
  imageUri,
  onClose,
  onReportIssue,
}: StorePhotoViewerProps) {
  const { colors } = useThemeStore();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={RFValue(28)} color={colors.text} />
          </TouchableOpacity>
          {onReportIssue && (
            <TouchableOpacity onPress={onReportIssue} style={styles.reportBtn}>
              <Ionicons name="flag-outline" size={RFValue(20)} color={colors.text} />
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text, marginLeft: 6 }}>
                Report
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
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
    paddingTop: 56,
    zIndex: 1,
  },
  closeBtn: {
    padding: 8,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
