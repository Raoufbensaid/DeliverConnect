import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
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

const sizeLabels = { s: "S", m: "M", l: "L", xl: "XL", xxl: "XXL" };

export default function LivreurHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParcels = async () => {
    try {
      const res = await api.get("/parcels");
      setParcels(res.data.parcels);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les annonces");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const u = await getUser();
      setUser(u);
      fetchParcels();
    };
    init();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  const renderParcel = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(livreur)/mission",
          params: { id: item._id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.badges}>
          <View style={styles.sizeBadge}>
            <Text style={styles.sizeBadgeText}>{sizeLabels[item.size]}</Text>
          </View>
          {item.fragile && (
            <View style={[styles.badge, { backgroundColor: "#FFF3E0" }]}>
              <Text style={[styles.badgeText, { color: "#E65100" }]}>
                Fragile
              </Text>
            </View>
          )}
          {item.urgent && (
            <View style={[styles.badge, { backgroundColor: "#FCE4EC" }]}>
              <Text style={[styles.badgeText, { color: "#C62828" }]}>
                Urgent
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.price}>{item.delivererAmount}€</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.sender?.address?.city || item.sender?.city}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.recipient?.address?.city || item.recipient?.city}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.distance}>{item.distanceKm} km</Text>
        <Text style={styles.weight}>{item.weight} kg</Text>
        {item.description && (
          <Text style={styles.desc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Bonjour {user?.firstName} 👋</Text>
          <Text style={styles.headerSub}>
            {parcels.length} mission{parcels.length > 1 ? "s" : ""} disponible
            {parcels.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push("/(livreur)/history")}
          >
            <Text style={styles.historyBtnText}>Historique</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fil d'annonces */}
      <FlatList
        data={parcels}
        keyExtractor={(item) => item._id}
        renderItem={renderParcel}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune mission disponible</Text>
            <Text style={styles.emptySub}>
              Tire vers le bas pour actualiser
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecond, marginTop: 2 },
  headerRight: { alignItems: "flex-end", gap: 6 },
  historyBtn: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  logoutText: { fontSize: 12, color: COLORS.danger },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badges: { flexDirection: "row", gap: 6 },
  sizeBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sizeBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  price: { fontSize: 22, fontWeight: "bold", color: COLORS.success },
  route: { marginBottom: 12 },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.grayBorder,
    marginLeft: 4.5,
    marginVertical: 2,
  },
  routeText: { fontSize: 15, color: COLORS.text, fontWeight: "500", flex: 1 },
  cardFooter: { flexDirection: "row", gap: 12, alignItems: "center" },
  distance: {
    fontSize: 12,
    color: COLORS.textSecond,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weight: {
    fontSize: 12,
    color: COLORS.textSecond,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  desc: { fontSize: 12, color: COLORS.textSecond, flex: 1 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecond, fontWeight: "500" },
  emptySub: { fontSize: 13, color: COLORS.grayBorder, marginTop: 6 },
});
