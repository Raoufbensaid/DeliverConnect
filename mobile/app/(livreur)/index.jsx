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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("disponibles");

  const fetchData = async () => {
    try {
      const u = await getUser();
      setUser(u);
      const res = await api.get("/parcels");
      setParcels(res.data.parcels);
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
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Quitter</Text>
        </TouchableOpacity>
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{parcels.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.success }]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>0€</Text>
          <Text style={styles.statLabel}>Gagné aujourd'hui</Text>
        </View>
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
          onPress={() => {
            setActiveTab("historique");
            router.push("/(livreur)/history");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "historique" && styles.tabTextActive,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste annonces */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {parcels.length === 0 ? (
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
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routePoints}>
                  <View style={styles.routeDotBlue} />
                  <View style={styles.routeLine} />
                  <View style={styles.routeDotGreen} />
                </View>
                <View style={styles.routeCities}>
                  <Text style={styles.routeCity}>
                    {p.sender?.address?.city}
                  </Text>
                  <Text style={styles.routeCity}>
                    {p.recipient?.address?.city}
                  </Text>
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
                  <Text style={styles.missionTagText}>
                    📍 {p.distanceKm} km
                  </Text>
                </View>
                {p.fragile && (
                  <View
                    style={[styles.missionTag, { backgroundColor: "#FAEEDA" }]}
                  >
                    <Text style={[styles.missionTagText, { color: "#633806" }]}>
                      ⚠️ Fragile
                    </Text>
                  </View>
                )}
                {p.urgent && (
                  <View
                    style={[styles.missionTag, { backgroundColor: "#FFF0EC" }]}
                  >
                    <Text style={[styles.missionTagText, { color: "#D85A30" }]}>
                      ⚡ Urgent
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.missionDate}>
                Publié le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight, paddingTop: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecond, marginTop: 2 },
  logoutBtn: { fontSize: 13, color: COLORS.danger, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecond,
    marginTop: 2,
    textAlign: "center",
  },
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
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  routePoints: { alignItems: "center", marginRight: 10 },
  routeDotBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 3,
  },
  routeDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  routeCities: { flex: 1, justifyContent: "space-between", height: 48 },
  routeCity: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  missionRight: { alignItems: "flex-end" },
  missionEarning: { fontSize: 22, fontWeight: "800", color: COLORS.success },
  missionEarningLabel: { fontSize: 11, color: COLORS.textSecond },
  missionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  missionTag: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  missionTagText: { fontSize: 11, color: COLORS.text, fontWeight: "500" },
  missionDate: { fontSize: 11, color: COLORS.textSecond },
});
