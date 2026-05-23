import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { getUser, logout } from "../../store/auth";
import api from "../../services/api";

const statusLabel = {
  pending: { label: "En attente", color: "#BA7517", bg: "#FAEEDA" },
  assigned: { label: "Assigné", color: "#185FA5", bg: "#E6F1FB" },
  picked_up: { label: "En cours", color: "#0F6E56", bg: "#E1F5EE" },
  delivered: { label: "Livré", color: "#27500A", bg: "#EAF3DE" },
  cancelled: { label: "Annulé", color: "#791F1F", bg: "#FCEBEB" },
};

const TABS = [
  { key: "active", label: "En cours" },
  { key: "delivered", label: "Livré" },
];

const SUGGESTIONS = [
  "Comment envoyer un colis ?",
  "Estimer le prix d'un envoi",
  "Comment fonctionne la livraison ?",
  "Comment suivre mon colis ?",
  "Comment évaluer le livreur ?",
];

function StarRating({ value, onChange }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Text
            style={{
              fontSize: 32,
              color: star <= value ? "#F6AD55" : "#CBD5E0",
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function YesNo({ value, onChange }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginVertical: 6 }}>
      {["Oui", "Non"].map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt === "Oui")}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor:
              value === (opt === "Oui") ? COLORS.primary : COLORS.grayBorder,
            backgroundColor:
              value === (opt === "Oui") ? COLORS.primary : COLORS.white,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: value === (opt === "Oui") ? COLORS.white : COLORS.text,
            }}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ClientHome() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const [user, setUser] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [reviews, setReviews] = useState({});

  // Review
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewParcel, setReviewParcel] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [onTime, setOnTime] = useState(null);
  const [damaged, setDamaged] = useState(null);
  const [wellReceived, setWellReceived] = useState(null);
  const [hadIssues, setHadIssues] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis **Raouf**, l'assistant DeliverConnect 🤖\n\nJe peux t'aider à :\n• Envoyer un colis\n• Estimer un prix\n• Comprendre le processus de livraison\n\nQue puis-je faire pour toi ?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchData = async () => {
    try {
      const u = await getUser();
      setUser(u);
      const [parcelsRes] = await Promise.all([api.get("/parcels/my")]);
      setParcels(parcelsRes.data.parcels);
      try {
        const reviewsRes = await api.get("/reviews/my");
        const reviewsMap = {};
        reviewsRes.data.reviews?.forEach((r) => {
          reviewsMap[r.parcelId] = r;
        });
        setReviews(reviewsMap);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Oui",
        onPress: async () => {
          await logout();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const openReview = async (parcel) => {
    setReviewParcel(parcel);
    setRating(0);
    setOnTime(null);
    setDamaged(null);
    setWellReceived(null);
    setHadIssues(null);
    setComment("");
    setExistingReview(null);
    try {
      const res = await api.get(`/reviews/parcel/${parcel._id}`);
      if (res.data.review) {
        setExistingReview(res.data.review);
        setRating(res.data.review.rating);
        setOnTime(res.data.review.onTime);
        setDamaged(res.data.review.damaged);
        setWellReceived(res.data.review.wellReceived);
        setHadIssues(res.data.review.hadIssues);
        setComment(res.data.review.comment || "");
      }
    } catch {}
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (rating === 0)
      return Alert.alert("Erreur", "Veuillez donner une note !");
    if (
      onTime === null ||
      damaged === null ||
      wellReceived === null ||
      hadIssues === null
    )
      return Alert.alert(
        "Erreur",
        "Veuillez répondre à toutes les questions !",
      );
    setSubmitting(true);
    try {
      await api.post("/reviews", {
        parcelId: reviewParcel._id,
        rating,
        onTime,
        damaged,
        wellReceived,
        hadIssues,
        comment,
      });
      Alert.alert("Merci !", "Votre évaluation a été envoyée avec succès 🎉");
      setReviewModal(false);
      fetchData();
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Erreur lors de l'envoi",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ════ CHATBOT ════
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
      setChatMessages((prev) => [...prev, assistantMsg]);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: res.data.reply },
      ]);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, je rencontre un problème technique. Réessaie dans un instant ! 🔧",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const resetChat = () => {
    setChatMessages([
      {
        role: "assistant",
        content:
          "Bonjour ! Je suis **Raouf**, l'assistant DeliverConnect 🤖\n\nJe peux t'aider à :\n• Envoyer un colis\n• Estimer un prix\n• Comprendre le processus de livraison\n\nQue puis-je faire pour toi ?",
      },
    ]);
    setChatHistory([]);
    setChatInput("");
  };

  const renderChatMessage = ({ item, index }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={{
          marginBottom: 12,
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>AI</Text>
          </View>
        )}
        <View
          style={[
            styles.chatBubble,
            isUser ? styles.chatBubbleUser : styles.chatBubbleBot,
          ]}
        >
          <Text
            style={[
              styles.chatBubbleText,
              isUser ? styles.chatBubbleTextUser : styles.chatBubbleTextBot,
            ]}
          >
            {item.content.replace(/\*\*/g, "")}
          </Text>
        </View>
      </View>
    );
  };

  const activeParcels = parcels.filter((p) =>
    ["pending", "assigned", "picked_up"].includes(p.status),
  );
  const deliveredParcels = parcels.filter((p) => p.status === "delivered");
  const displayedParcels =
    activeTab === "active" ? activeParcels : deliveredParcels;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderCard = (p, i) => {
    const status = statusLabel[p.status] || statusLabel.pending;
    const isDelivered = p.status === "delivered";
    const existingReview = reviews[p._id];

    return (
      <TouchableOpacity
        key={i}
        style={styles.parcelCard}
        onPress={() => {
          if (isDelivered) {
            if (existingReview) {
              router.push(
                `/(client)/track-detail?deliveryId=${existingReview?.deliveryId}`,
              );
            } else {
              openReview(p);
            }
          } else {
            router.push(`/(client)/tracking?parcelId=${p._id}`);
          }
        }}
      >
        <View style={styles.parcelRow}>
          <View style={styles.parcelInfo}>
            <Text style={styles.parcelRoute}>
              {p.sender?.address?.city} → {p.recipient?.address?.city}
            </Text>
            <Text style={styles.parcelDetail}>
              {p.size?.toUpperCase()} · {p.weight}kg · {p.distanceKm}km
            </Text>
            {p.fragile && <Text style={styles.fragileTag}>⚠️ Fragile</Text>}
            {p.urgent && <Text style={styles.urgentTag}>⚡ Urgent</Text>}
          </View>
          <View style={styles.parcelRight}>
            <Text style={styles.parcelPrice}>{p.price}€</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.grayBorder,
            paddingTop: 8,
          }}
        >
          <Text style={styles.parcelDate}>
            {new Date(p.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          {isDelivered &&
            (existingReview ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={{ fontSize: 13, color: "#F6AD55" }}>
                  {"★".repeat(existingReview.rating)}
                  {"☆".repeat(5 - existingReview.rating)}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecond }}>
                  →
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.primary,
                  fontWeight: "600",
                }}
              >
                ⭐ Évaluer →
              </Text>
            ))}
        </View>

        {["assigned", "picked_up"].includes(p.status) && p.delivererId && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() =>
              router.push({
                pathname: "/(client)/chat",
                params: {
                  parcelId: p._id,
                  receiverId: p.delivererId?._id || p.delivererId,
                  receiverName:
                    `${p.delivererId?.firstName || ""} ${p.delivererId?.lastName || ""}`.trim(),
                },
              })
            }
          >
            <Text style={styles.chatBtnText}>💬 Contacter le livreur</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.firstName} 👋</Text>
          <Text style={styles.headerSub}>
            Que voulez-vous envoyer aujourd'hui ?
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push("/(client)/profile")}
            style={styles.avatarBtn}
          >
            <Text style={styles.avatarBtnText}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutBtn}>Quitter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton principal */}
      <TouchableOpacity
        style={styles.mainBtn}
        onPress={() => router.push("/(client)/send/step1")}
      >
        <Text style={styles.mainBtnIcon}>📦</Text>
        <View>
          <Text style={styles.mainBtnTitle}>Envoyer un colis</Text>
          <Text style={styles.mainBtnSub}>Créer une nouvelle annonce</Text>
        </View>
        <Text style={styles.mainBtnArrow}>→</Text>
      </TouchableOpacity>

      {/* Titre section */}
      <Text style={styles.sectionTitle}>Mes envois ({parcels.length})</Text>

      {/* Onglets */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.key === "active" ? ` (${activeParcels.length})` : ""}
              {tab.key === "delivered" ? ` (${deliveredParcels.length})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayedParcels.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              {activeTab === "active"
                ? "Aucun envoi en cours"
                : "Aucune livraison terminée"}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === "active"
                ? "Créez votre première annonce !"
                : "Vos livraisons terminées apparaîtront ici"}
            </Text>
          </View>
        ) : (
          displayedParcels.map((p, i) => renderCard(p, i))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ════ BULLE CHATBOT FLOTTANTE ════ */}
      <TouchableOpacity
        style={styles.chatbotBubble}
        onPress={() => setChatOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.chatbotBubbleIcon}>🤖</Text>
        <View style={styles.chatbotBubbleDot} />
      </TouchableOpacity>

      {/* ════ MODAL CHATBOT ════ */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        onRequestClose={() => setChatOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: COLORS.grayLight }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header chatbot */}
          <View style={styles.chatbotHeader}>
            <View style={styles.chatbotHeaderLeft}>
              <View style={styles.chatbotHeaderAvatar}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.chatbotHeaderName}>Raouf</Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View style={styles.chatbotOnlineDot} />
                  <Text style={styles.chatbotHeaderSub}>
                    Assistant DeliverConnect
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={resetChat}
                style={styles.chatbotHeaderBtn}
              >
                <Text style={{ fontSize: 16 }}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChatOpen(false)}
                style={styles.chatbotHeaderBtn}
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
            renderItem={renderChatMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              chatLoading ? (
                <View
                  style={[
                    styles.chatBubble,
                    styles.chatBubbleBot,
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
          {chatMessages.length <= 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 8,
                gap: 8,
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input */}
          <View style={styles.chatbotInputRow}>
            <TextInput
              style={styles.chatbotInput}
              placeholder="Pose ta question à Raouf...."
              placeholderTextColor={COLORS.textSecond}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={[
                styles.chatbotSendBtn,
                (!chatInput.trim() || chatLoading) &&
                  styles.chatbotSendBtnDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Text style={styles.chatbotSendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal évaluation */}
      <Modal
        visible={reviewModal}
        animationType="slide"
        onRequestClose={() => setReviewModal(false)}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: COLORS.white }}
          contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        >
          <TouchableOpacity
            onPress={() => setReviewModal(false)}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ fontSize: 15, color: COLORS.primary }}>
              ← Retour
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: COLORS.text,
              marginBottom: 4,
            }}
          >
            {existingReview ? "Votre évaluation" : "Évaluer le livreur"}
          </Text>
          <Text
            style={{ fontSize: 13, color: COLORS.textSecond, marginBottom: 20 }}
          >
            {reviewParcel?.sender?.address?.city} →{" "}
            {reviewParcel?.recipient?.address?.city}
          </Text>

          {existingReview && (
            <View
              style={{
                backgroundColor: "#EAF3DE",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 12, color: "#27500A", fontWeight: "600" }}
              >
                ✅ Évaluation déjà envoyée
              </Text>
            </View>
          )}

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>⭐ Note globale</Text>
            <StarRating
              value={rating}
              onChange={existingReview ? () => {} : setRating}
            />
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>
              ✅ Livraison effectuée à temps ?
            </Text>
            <YesNo
              value={onTime}
              onChange={existingReview ? () => {} : setOnTime}
            />
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>📦 Colis en bon état ?</Text>
            <YesNo
              value={damaged}
              onChange={existingReview ? () => {} : setDamaged}
            />
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>
              🤝 Expéditeur a bien réceptionné le colis ?
            </Text>
            <YesNo
              value={wellReceived}
              onChange={existingReview ? () => {} : setWellReceived}
            />
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>
              ⚠️ La livraison s'est bien passée ?
            </Text>
            <YesNo
              value={hadIssues}
              onChange={existingReview ? () => {} : setHadIssues}
            />
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>💬 Commentaire</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Décrivez votre expérience..."
              placeholderTextColor={COLORS.textSecond}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={existingReview ? () => {} : setComment}
              editable={!existingReview}
            />
          </View>

          {!existingReview && (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitReview}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? "Envoi en cours..." : "Envoyer l'évaluation ⭐"}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: { alignItems: "flex-end", gap: 6 },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.grayLight, paddingTop: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecond, marginTop: 2 },
  logoutBtn: { fontSize: 13, color: COLORS.danger, marginTop: 4 },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 14,
  },
  mainBtnIcon: { fontSize: 28 },
  mainBtnTitle: { fontSize: 17, fontWeight: "700", color: COLORS.white },
  mainBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  mainBtnArrow: { marginLeft: "auto", fontSize: 20, color: COLORS.white },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecond },
  tabTextActive: { color: COLORS.white },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: COLORS.textSecond },
  parcelCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  parcelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  parcelInfo: { flex: 1 },
  parcelRoute: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  parcelDetail: { fontSize: 12, color: COLORS.textSecond, marginBottom: 4 },
  fragileTag: { fontSize: 11, color: COLORS.warning },
  urgentTag: { fontSize: 11, color: COLORS.danger },
  parcelRight: { alignItems: "flex-end", gap: 6 },
  parcelPrice: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: "600" },
  parcelDate: { fontSize: 11, color: COLORS.textSecond },
  chatBtn: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  chatBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  // ════ CHATBOT ════
  chatbotBubble: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatbotBubbleIcon: { fontSize: 26 },
  chatbotBubbleDot: {
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
  chatbotHeader: {
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
  chatbotHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  chatbotHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  chatbotHeaderName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  chatbotHeaderSub: { fontSize: 11, color: COLORS.textSecond },
  chatbotOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#48BB78",
  },
  chatbotHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.grayLight,
    justifyContent: "center",
    alignItems: "center",
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  chatAvatarText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  chatBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  chatBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  chatBubbleBot: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  chatBubbleText: { fontSize: 14, lineHeight: 20 },
  chatBubbleTextUser: { color: COLORS.white },
  chatBubbleTextBot: { color: COLORS.text },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  suggestionText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  chatbotInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    gap: 10,
  },
  chatbotInput: {
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
  chatbotSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  chatbotSendBtnDisabled: { backgroundColor: COLORS.grayBorder },
  chatbotSendBtnText: { fontSize: 18, color: COLORS.white, fontWeight: "700" },

  // Review
  reviewSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  commentInput: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: COLORS.white },
});
