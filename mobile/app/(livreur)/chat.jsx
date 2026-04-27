import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { io } from "socket.io-client";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";
import { getUser } from "../../store/auth";

const SOCKET_URL = "https://deliverconnect-production.up.railway.app";

export default function Chat() {
  const router = useRouter();
  const { parcelId, receiverId, receiverName } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      // 1 — Charger l'utilisateur EN PREMIER
      const u = await getUser();
      setUser(u);
      userRef.current = u;

      // 2 — Charger l'historique
      try {
        const res = await api.get(`/messages/${parcelId}`);
        setMessages(res.data.messages || []);
        await api.patch(`/messages/${parcelId}/read`);
      } catch (err) {
        console.error("Erreur chargement messages:", err.message);
      } finally {
        setLoading(false);
      }

      // 3 — Connexion Socket.io APRÈS avoir le user
      socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket connecté:", socketRef.current.id);
        socketRef.current.emit("join_chat", parcelId);
      });

      socketRef.current.on("connect_error", (err) => {
        console.log("❌ Erreur connexion socket:", err.message);
      });

      socketRef.current.on("receive_message", (message) => {
        console.log("📨 Message reçu:", message);
        setMessages((prev) => [...prev, message]);
        flatListRef.current?.scrollToEnd({ animated: true });
        api.patch(`/messages/${parcelId}/read`).catch(() => {});
      });

      socketRef.current.on("message_error", (err) => {
        console.log("❌ Erreur message:", err);
      });
    };

    setup();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_chat", parcelId);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const content = input.trim();
    const currentUser = userRef.current;
    const userId = currentUser?._id || currentUser?.id;

    if (!userId) {
      console.log("❌ User non chargé:", currentUser);
      return;
    }

    setInput("");

    socketRef.current?.emit("send_message", {
      parcelId,
      senderId: userId,
      receiverId,
      content,
    });
  };

  const renderMessage = ({ item }) => {
    const isMe =
      item.senderId?._id === (userRef.current?._id || userRef.current?.id) ||
      item.senderId === (userRef.current?._id || userRef.current?.id);

    return (
      <View
        style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
      >
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.senderId?.firstName?.[0]}
              {item.senderId?.lastName?.[0]}
            </Text>
          </View>
        )}
        <View
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
        >
          <Text
            style={[
              styles.bubbleText,
              isMe ? styles.bubbleTextMe : styles.bubbleTextOther,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {receiverName?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{receiverName}</Text>
            <Text style={styles.headerSub}>Client</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatIcon}>💬</Text>
          <Text style={styles.emptyChatText}>Démarrez la conversation !</Text>
          <Text style={styles.emptyChatSub}>
            Envoyez un message à votre livreur
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          placeholderTextColor={COLORS.textSecond}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 22, color: COLORS.primary },
  headerInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  headerName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.textSecond },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyChatIcon: { fontSize: 48 },
  emptyChatText: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  emptyChatSub: { fontSize: 13, color: COLORS.textSecond },
  messagesList: { padding: 16, gap: 8 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.grayBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "700", color: COLORS.text },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: COLORS.white },
  bubbleTextOther: { color: COLORS.text },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  bubbleTimeOther: { color: COLORS.textSecond },
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
