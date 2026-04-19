import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { appAxios } from "@/service/apiInterceptors";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";

interface Thread {
  id: string;
  type: "order" | "support";
  title: string;
  lastMessage?: string;
  timestamp?: string;
  orderId?: string;
  recipientId?: string;
}

interface ChatMsg {
  _id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const MessagesScreen = () => {
  const { user } = useUserStore();
  const { on, off, emit } = useWS();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await appAxios.get("/customer/messages/threads");
      if (res.data.success) {
        setThreads(res.data.threads);
      }
    } catch {
      setThreads([
        {
          id: "support",
          type: "support",
          title: "Loko Support",
          lastMessage: "How can we help?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const openThread = useCallback(async (thread: Thread) => {
    setActiveThread(thread);
    setMsgLoading(true);
    setMessages([]);

    if (thread.orderId) {
      emit("message:history", { orderId: thread.orderId });
    } else if (thread.recipientId) {
      emit("message:history", { recipientId: thread.recipientId });
    }

    const timeout = setTimeout(() => setMsgLoading(false), 3000);

    const handler = (data: any) => {
      clearTimeout(timeout);
      setMessages(
        (data.messages || []).map((m: any) => ({
          _id: m._id,
          senderId: m.senderId,
          text: m.text,
          timestamp: m.createdAt || m.timestamp,
        }))
      );
      setMsgLoading(false);
    };

    on("message:historyLoaded", handler);
    return () => {
      off("message:historyLoaded");
      clearTimeout(timeout);
    };
  }, [emit, on, off]);

  useEffect(() => {
    const handler = (data: any) => {
      setMessages((prev) => [
        ...prev,
        { _id: data._id, senderId: data.senderId, text: data.text, timestamp: data.timestamp },
      ]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };
    on("message:received", handler);
    return () => { off("message:received"); };
  }, [on, off]);

  const handleSend = () => {
    if (!text.trim() || !activeThread) return;
    emit("message:send", {
      text: text.trim(),
      orderId: activeThread.orderId || undefined,
      recipientId: activeThread.recipientId || undefined,
    });
    setText("");
  };

  if (activeThread) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveThread(null)}>
              <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
              {activeThread.title}
            </CustomText>
            <View style={styles.headerSpacer} />
          </View>

          {msgLoading ? (
            <View style={styles.centered}><ActivityIndicator color={TEXT_SECONDARY} /></View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(m) => m._id}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <CustomText fontFamily="Regular" fontSize={14} style={{ color: TEXT_SECONDARY }}>No messages yet</CustomText>
                </View>
              }
              renderItem={({ item }) => {
                const isMe = item.senderId === user?._id;
                return (
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <CustomText fontFamily="Regular" fontSize={14} style={{ color: TEXT_PRIMARY }}>
                      {item.text}
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={10} style={styles.bubbleTime}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </CustomText>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={TEXT_SECONDARY}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={RFValue(18)} color={TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
            Messages
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={TEXT_SECONDARY} /></View>
        ) : threads.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="chatbubble-outline" size={RFValue(40)} color={TEXT_SECONDARY} />
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: TEXT_SECONDARY, marginTop: 12 }}>
              No conversations yet
            </CustomText>
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.threadList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.threadRow} onPress={() => openThread(item)} activeOpacity={0.7}>
                <View style={styles.threadIcon}>
                  <Ionicons name={item.type === "support" ? "headset" : "restaurant"} size={RFValue(20)} color={ACCENT} />
                </View>
                <View style={styles.threadContent}>
                  <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: TEXT_PRIMARY }}>{item.title}</CustomText>
                  {item.lastMessage && (
                    <CustomText fontFamily="Regular" fontSize={13} style={{ color: TEXT_SECONDARY, marginTop: 2 }} numberOfLines={1}>{item.lastMessage}</CustomText>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.threadDivider} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: DIVIDER },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center", color: TEXT_PRIMARY },
  headerSpacer: { width: 30 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  threadList: { paddingTop: 8 },
  threadRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  threadIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#3d1513", justifyContent: "center", alignItems: "center", marginRight: 14 },
  threadContent: { flex: 1 },
  threadDivider: { height: 0.5, backgroundColor: DIVIDER, marginLeft: 78 },
  chatList: { padding: 16, paddingBottom: 80 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 8 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: ACCENT },
  bubbleThem: { alignSelf: "flex-start", backgroundColor: CARD_BG },
  bubbleTime: { color: TEXT_SECONDARY, marginTop: 4, textAlign: "right" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: DIVIDER, backgroundColor: DARK_BG },
  chatInput: { flex: 1, backgroundColor: CARD_BG, color: TEXT_PRIMARY, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT, justifyContent: "center", alignItems: "center" },
});

export default MessagesScreen;
