import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";
import { getUser } from "../store/auth";
import api from "../services/api";

const SUGGESTIONS = [
  "📦 Envoyer un colis",
  "💰 Estimer un prix",
  "🚗 Comment ça marche ?",
  "📍 Suivre mon colis",
  "📏 Tailles disponibles",
  "⚠️ Option Fragile",
  "⚡ Option Urgent",
  "💳 Paiement",
  "⭐ Évaluer le livreur",
  "💬 Contacter le livreur",
  "🔢 Code OTP",
  "💸 Commission plateforme",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Bonjour ! Je suis Alex, l'assistant DeliverConnect 🤖\n\nJe peux t'aider à :\n• Envoyer un colis\n• Estimer un prix\n• Comprendre le processus de livraison\n\nQue puis-je faire pour toi ?",
};

const getChatKey = async () => {
  const user = await getUser();
  return `deliverconnect_chat_${user?.id || user?._id || "guest"}`;
};

export default function ChatbotBubble() {
  const flatListRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([INITIAL_MESSAGE]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // ════ DRAG ════
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // ════ CHARGEMENT HISTORIQUE ════
  useEffect(() => {
    const loadChat = async () => {
      try {
        const key = await getChatKey();
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const { messages, history } = JSON.parse(saved);
          setChatMessages(messages);
          setChatHistory(history);
        }
      } catch {}
    };
    loadChat();
  }, []);

  const saveChat = async (messages, history) => {
    try {
      const key = await getChatKey();
      await AsyncStorage.setItem(key, JSON.stringify({ messages, history }));
    } catch {}
  };

  // ════ PAN RESPONDER AVEC LIMITES ════
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: lastPos.current.x, y: lastPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gesture);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        const { width, height } = Dimensions.get("window");
        const BUBBLE_SIZE = 58;
        const MARGIN = 100;

        const MIN_X = 0;
        const MAX_X = 0;
        const MIN_Y = -height + BUBBLE_SIZE + MARGIN + 100;
        const MAX_Y = 0;

        const newX = Math.min(
          Math.max(lastPos.current.x + gesture.dx, MIN_X),
          MAX_X,
        );
        const newY = Math.min(
          Math.max(lastPos.current.y + gesture.dy, MIN_Y),
          MAX_Y,
        );

        lastPos.current = { x: newX, y: newY };

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();

        if (!isDragging.current) {
          setChatOpen(true);
        }
      },
    }),
  ).current;

  // ════ ENVOI MESSAGE ════
  const sendMessage = async (messageText) => {
    const text = messageText || chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");

    const userMsg = { role: "user", content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatLoading(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post("/chatbot", {
        message: text,
        history: chatHistory,
      });
      const assistantMsg = { role: "assistant", content: res.data.reply };
      const finalMessages = [...newMessages, assistantMsg];
      const newHistory = [
        ...chatHistory,
        { role: "user", content: text },
        { role: "assistant", content: res.data.reply },
      ];

      setChatMessages(finalMessages);
      setChatHistory(newHistory);
      saveChat(finalMessages, newHistory);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch {
      const errorMessages = [
        ...newMessages,
        {
          role: "assistant",
          content: "Désolé, je rencontre un problème technique. Réessaie ! 🔧",
        },
      ];
      setChatMessages(errorMessages);
      saveChat(errorMessages, chatHistory);
    } finally {
      setChatLoading(false);
    }
  };

  // ════ RENDU MESSAGE ════
  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={{
          marginBottom: 12,
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
            ]}
          >
            {item.content.replace(/\*\*/g, "")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* ════ BULLE DRAGGABLE ════ */}
      <Animated.View
        style={[styles.floatingBtn, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.floatingIcon}>🤖</Text>
        <View style={styles.onlineDot} />
      </Animated.View>

      {/* ════ MODAL CHAT ════ */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        onRequestClose={() => setChatOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: COLORS.grayLight }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerName}>Alex</Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View style={styles.headerDot} />
                  <Text style={styles.headerSub}>Assistant DeliverConnect</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setChatOpen(false)}
                style={styles.headerBtn}
              >
                <Text style={{ fontSize: 18, color: COLORS.textSecond }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              chatLoading ? (
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleBot,
                    { alignSelf: "flex-start", paddingHorizontal: 16 },
                  ]}
                >
                  <Text
                    style={{
                      color: COLORS.textSecond,
                      fontSize: 18,
                      letterSpacing: 4,
                    }}
                  >
                    ···
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Suggestions */}
          {/* Suggestions */}
          {chatMessages.length <= 1 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                padding: 12,
                gap: 8,
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Pose ta question à Alex..."
              placeholderTextColor={COLORS.textSecond}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!chatInput.trim() || chatLoading) && styles.sendBtnDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingIcon: { fontSize: 26 },
  onlineDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#48BB78",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.textSecond },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#48BB78",
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.grayLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  bubbleBot: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.white },
  bubbleTextBot: { color: COLORS.text },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.grayBorder },
  sendBtnText: { fontSize: 18, color: COLORS.white, fontWeight: "700" },
});
