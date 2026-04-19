import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useWS } from '@/service/WSProvider';
import { useThemeStore } from '@/store/themeStore';

interface Message {
  _id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  imageUri?: string;
}

const ChatScreen = () => {
  const { courierId, courierName, courierPhone, courierLanguage, orderId } = useLocalSearchParams<{
    courierId: string;
    courierName?: string;
    courierPhone?: string;
    courierLanguage?: string;
    orderId?: string;
  }>();
  const { colors } = useThemeStore();
  const { on, off, emit } = useWS();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    emit('message:history', { recipientId: courierId, orderId: orderId || undefined });

    on('message:historyLoaded', (data: any) => {
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: any) => ({
            _id: m._id ?? String(m.createdAt),
            senderId: m.senderId === courierId ? courierId : 'user',
            text: m.text,
            timestamp: new Date(m.createdAt ?? m.timestamp),
          }))
        );
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
      }
    });

    on('message:received', (data: any) => {
      if (data.senderId === courierId || data.recipientId === courierId) {
        setMessages((prev) => {
          const alreadyAdded = prev.some((m) => m._id === String(data._id));
          if (alreadyAdded) return prev;
          return [
            ...prev,
            {
              _id: String(data._id ?? Date.now()),
              senderId: data.senderId === courierId ? courierId : 'user',
              text: data.text,
              timestamp: new Date(data.timestamp ?? Date.now()),
            },
          ];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      off('message:historyLoaded');
      off('message:received');
    };
  }, [courierId]);

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const optimisticId = `optimistic_${Date.now()}`;
    const newMessage: Message = {
      _id: optimisticId,
      senderId: 'user',
      text: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    emit('message:send', {
      recipientId: courierId,
      text: messageText.trim(),
      orderId: orderId || undefined,
    });
    setMessageText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCall = () => {
    if (!courierPhone) {
      Alert.alert('Call unavailable', 'Courier phone number is not available yet.');
      return;
    }
    const phoneNumber = String(courierPhone).trim();
    const telUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Call unavailable', 'This device cannot place phone calls.');
          return;
        }
        return Linking.openURL(telUrl);
      })
      .catch(() => {
        Alert.alert('Call failed', 'Unable to open the dialer on this device.');
      });
  };

  const handleHelp = () => {
    router.push('/customer/delivery/help');
  };

  const pickImage = async (useCamera: boolean) => {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to add photos.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    const newMessage: Message = {
      _id: Date.now().toString(),
      senderId: 'user',
      text: '[Photo]',
      timestamp: new Date(),
      imageUri: uri,
    };
    setMessages((prev) => [...prev, newMessage]);
    emit('message:send', { recipientId: courierId, text: '[Photo]', imageUri: uri });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.senderId === 'user';
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View style={[
          styles.messageBubble,
          isUser ? { backgroundColor: Colors.primary } : { backgroundColor: colors.card },
        ]}>
          {item.imageUri ? (
            <View style={styles.imageBubble}>
              <CustomText fontFamily="Regular" fontSize={14} style={{ color: isUser ? Colors.white : colors.text }}>
                {item.text}
              </CustomText>
            </View>
          ) : (
            <CustomText
              fontFamily="Regular"
              fontSize={14}
              style={{ color: isUser ? Colors.white : colors.text }}
            >
              {item.text}
            </CustomText>
          )}
          <CustomText
            fontFamily="Regular"
            fontSize={10}
            style={{ color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary, marginTop: 4 }}
          >
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </CustomText>
        </View>
      </View>
    );
  };

  const languageLabel = courierLanguage || 'another language';
  const emptyStateContent = (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIllustration, { backgroundColor: colors.divider }]}>
        <Ionicons name="chatbubbles-outline" size={RFValue(48)} color={colors.textSecondary} />
      </View>
      {courierLanguage ? (
        <CustomText
          fontFamily="Regular"
          fontSize={14}
          style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 16, paddingHorizontal: 24 }}
        >
          Your Dasher speaks {languageLabel}. All incoming and outgoing messages will be auto translated.
        </CustomText>
      ) : (
        <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginTop: 16 }}>
          No messages yet. Start the conversation!
        </CustomText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(20)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary }}>
            Your Dasher
          </CustomText>
          <CustomText fontFamily="Bold" fontSize={16} style={{ color: colors.text }}>
            {courierName ?? 'Courier'}
          </CustomText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleCall} style={styles.headerIconButton}>
            <Ionicons name="call-outline" size={RFValue(22)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHelp} style={styles.headerIconButton}>
            <Ionicons name="help-circle-outline" size={RFValue(22)} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.messagesListEmpty]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={emptyStateContent}
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
          <TouchableOpacity onPress={() => pickImage(true)} style={styles.attachButton}>
            <Ionicons name="camera-outline" size={RFValue(22)} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickImage(false)} style={styles.attachButton}>
            <Ionicons name="image-outline" size={RFValue(22)} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, messageText.trim() ? styles.sendButtonActive : styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons
              name="send"
              size={RFValue(18)}
              color={messageText.trim() ? Colors.white : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  imageBubble: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default ChatScreen;
