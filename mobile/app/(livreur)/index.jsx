import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { getUser, logout } from "../../store/auth";
import api from "../../services/api";

export default function LivreurHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("disponibles");

  const fetchData = async () => {
    try {
      const u = await getUser();
      setUser(u);

      // Fil d'annonces disponibles
      const res = await api.get("/parcels");
      setParcels(res.data.parcels);

      // Historique des livraisons
      const histRes = await api.get("/tracks/history");
      setHistory(histRes.data.history);

      // Calculer le total gagné
      const total = histRes.data.history.reduce((sum, item) => {
        return (
          sum +
          (item.parcel?.price
            ? Math.round(item.parcel.price * 0.8 * 100) / 100
            : 0)
        );
      }, 0);
      setTotalEarned(Math.round(total * 100) / 100);

      // Vérifier si une livraison est en cours
      try {
        const delivRes = await api.get("/deliveries/my");
        console.log("Livraisons:", JSON.stringify(delivRes.data.deliveries));
        const active = delivRes.data.deliveries.find(
          (d) => d.status === "picked_up" && d.parcelId?.status === "picked_up",
        );
        console.log("Active delivery:", JSON.stringify(active));
        setActiveDelivery(active || null);
      } catch (err) {
        console.log("Erreur deliveries:", err.message);
      }
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.firstName} 👋</Text>
          <Text style={styles.headerSub}>
            Choisissez votre prochaine mission
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push("/(livreur)/profile")}
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

      {/* Total gagné */}
      <View style={styles.earningCard}>
        <View>
          <Text style={styles.earningLabel}>Total gagné</Text>
          <Text style={styles.earningValue}>{totalEarned}€</Text>
        </View>
        <Text style={styles.earningIcon}>💰</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "disponibles" && styles.tabActive]}
          onPress={() => setActiveTab("disponibles")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "disponibles" && styles.tabTextActive,
            ]}
          >
            Disponibles ({parcels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "historique" && styles.tabActive]}
          onPress={() => setActiveTab("historique")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "historique" && styles.tabTextActive,
            ]}
          >
            Historique ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu selon l'onglet */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {activeTab === "disponibles" ? (
          parcels.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Aucune mission disponible</Text>
              <Text style={styles.emptySub}>
                Tire vers le bas pour actualiser
              </Text>
            </View>
          ) : (
            parcels.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={styles.missionCard}
                onPress={() =>
                  router.push(`/(livreur)/mission?parcelId=${p._id}`)
                }
              >
                {/* Route avec adresses complètes */}
                <View style={styles.routeRow}>
                  <View style={styles.routePoints}>
                    <View style={styles.routeDotBlue} />
                    <View style={styles.routeLine} />
                    <View style={styles.routeDotGreen} />
                  </View>
                  <View style={styles.routeAddresses}>
                    <View style={styles.routeStop}>
                      <Text style={styles.routeCity}>
                        {p.sender?.address?.city}
                      </Text>
                      <Text style={styles.routeStreet}>
                        {p.sender?.address?.street}
                      </Text>
                    </View>
                    <View style={styles.routeStop}>
                      <Text style={styles.routeCity}>
                        {p.recipient?.address?.city}
                      </Text>
                      <Text style={styles.routeStreet}>
                        {p.recipient?.address?.street}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.missionRight}>
                    <Text style={styles.missionEarning}>
                      {p.delivererAmount}€
                    </Text>
                    <Text style={styles.missionEarningLabel}>à gagner</Text>
                  </View>
                </View>

                {/* Détails */}
                <View style={styles.missionDetails}>
                  <View style={styles.missionTag}>
                    <Text style={styles.missionTagText}>
                      📦 {p.size?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.missionTag}>
                    <Text style={styles.missionTagText}>⚖️ {p.weight}kg</Text>
                  </View>
                  {p.distanceKm > 0 && (
                    <View style={styles.missionTag}>
                      <Text style={styles.missionTagText}>
                        📍 {p.distanceKm} km
                      </Text>
                    </View>
                  )}
                  {p.fragile && (
                    <View
                      style={[
                        styles.missionTag,
                        { backgroundColor: "#FAEEDA" },
                      ]}
                    >
                      <Text
                        style={[styles.missionTagText, { color: "#633806" }]}
                      >
                        ⚠️ Fragile
                      </Text>
                    </View>
                  )}
                  {p.urgent && (
                    <View
                      style={[
                        styles.missionTag,
                        { backgroundColor: "#FFF0EC" },
                      ]}
                    >
                      <Text
                        style={[styles.missionTagText, { color: "#D85A30" }]}
                      >
                        ⚡ Urgent
                      </Text>
                    </View>
                  )}
                </View>

                {/* Contacts
                <View style={styles.contactsRow}>
                  <Text style={styles.contactText}>
                    👤 {p.sender?.firstName} {p.sender?.lastName} ·{" "}
                    {p.sender?.phone}
                  </Text>
                  <Text style={styles.contactText}>
                    👤 {p.recipient?.firstName} {p.recipient?.lastName} ·{" "}
                    {p.recipient?.phone}
                  </Text>
                </View> */}

                <Text style={styles.missionDate}>
                  Publié le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : // Historique
        history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucune livraison effectuée</Text>
          </View>
        ) : (
          history.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.historyCard}
              onPress={() =>
                router.push(
                  `/(livreur)/track-detail?deliveryId=${item.deliveryId}`,
                )
              }
            >
              <View style={styles.routeRow}>
                <View style={styles.routePoints}>
                  <View style={styles.routeDotBlue} />
                  <View style={styles.routeLine} />
                  <View style={styles.routeDotGreen} />
                </View>
                <View style={styles.routeAddresses}>
                  <View style={styles.routeStop}>
                    <Text style={styles.routeCity}>
                      {item.parcel?.sender?.address?.city}
                    </Text>
                    <Text style={styles.routeStreet}>
                      {item.parcel?.sender?.address?.street}
                    </Text>
                  </View>
                  <View style={styles.routeStop}>
                    <Text style={styles.routeCity}>
                      {item.parcel?.recipient?.address?.city}
                    </Text>
                    <Text style={styles.routeStreet}>
                      {item.parcel?.recipient?.address?.street}
                    </Text>
                  </View>
                </View>
                <View style={styles.missionRight}>
                  <Text style={styles.missionEarning}>
                    {item.parcel?.price
                      ? Math.round(item.parcel.price * 0.8 * 100) / 100
                      : "—"}
                    €
                  </Text>
                  <View style={styles.deliveredBadge}>
                    <Text style={styles.deliveredText}>✅ Livré</Text>
                  </View>
                </View>
              </View>
              <View style={styles.historyStats}>
                <Text style={styles.historyStat}>
                  📍 {item.totalDistanceKm || 0} km
                </Text>
                <Text style={styles.historyStat}>
                  ⏱{" "}
                  {item.totalDuration
                    ? `${Math.floor(item.totalDuration / 60)}min`
                    : "—"}
                </Text>
                <Text style={styles.historyStat}>
                  📦 {new Date(item.pickupAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },
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
    marginBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecond, marginTop: 2 },
  logoutBtn: { fontSize: 13, color: COLORS.danger, marginTop: 4 },
  earningCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.success,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
  },
  earningLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  earningValue: { fontSize: 28, fontWeight: "800", color: COLORS.white },
  earningIcon: { fontSize: 36 },
  activeDeliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8E6",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  activeDeliveryIcon: { fontSize: 24 },
  activeDeliveryInfo: { flex: 1 },
  activeDeliveryTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  activeDeliveryDesc: { fontSize: 12, color: COLORS.textSecond, marginTop: 2 },
  activeDeliveryArrow: { fontSize: 18, color: COLORS.warning },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecond, fontWeight: "500" },
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
  missionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  routePoints: { alignItems: "center", marginRight: 10 },
  routeDotBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 3,
  },
  routeDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  routeAddresses: { flex: 1, justifyContent: "space-between", height: 56 },
  routeStop: { justifyContent: "center" },
  routeCity: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  routeStreet: { fontSize: 11, color: COLORS.textSecond, marginTop: 1 },
  missionRight: { alignItems: "flex-end", gap: 4 },
  missionEarning: { fontSize: 20, fontWeight: "800", color: COLORS.success },
  missionEarningLabel: { fontSize: 10, color: COLORS.textSecond },
  missionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  missionTag: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  missionTagText: { fontSize: 11, color: COLORS.text, fontWeight: "500" },
  contactsRow: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 4,
  },
  contactText: { fontSize: 11, color: COLORS.textSecond },
  missionDate: { fontSize: 11, color: COLORS.textSecond },
  deliveredBadge: {
    backgroundColor: "#EAF3DE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  deliveredText: { fontSize: 11, color: COLORS.success, fontWeight: "500" },
  historyStats: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  historyStat: { fontSize: 11, color: COLORS.textSecond },
  noDeliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.grayLight,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  noDeliveryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecond,
  },
  noDeliveryDesc: { fontSize: 12, color: COLORS.textSecond, marginTop: 2 },
  noDeliveryIcon: { fontSize: 24 },
});
