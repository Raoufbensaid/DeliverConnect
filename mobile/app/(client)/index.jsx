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

const statusLabel = {
  pending: { label: "En attente", color: "#BA7517", bg: "#FAEEDA" },
  assigned: { label: "Assigné", color: "#185FA5", bg: "#E6F1FB" },
  picked_up: { label: "En cours", color: "#0F6E56", bg: "#E1F5EE" },
  delivered: { label: "Livré", color: "#27500A", bg: "#EAF3DE" },
  cancelled: { label: "Annulé", color: "#791F1F", bg: "#FCEBEB" },
};

export default function ClientHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const u = await getUser();
      setUser(u);
      const res = await api.get("/parcels/my");
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
            Que voulez-vous envoyer aujourd'hui ?
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Quitter</Text>
        </TouchableOpacity>
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

      {/* Historique */}
      <Text style={styles.sectionTitle}>Mes envois ({parcels.length})</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {parcels.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun envoi pour le moment</Text>
            <Text style={styles.emptySub}>Créez votre première annonce !</Text>
          </View>
        ) : (
          parcels.map((p, i) => {
            const status = statusLabel[p.status] || statusLabel.pending;
            return (
              <TouchableOpacity
                key={i}
                style={styles.parcelCard}
                onPress={() =>
                  router.push(`/(client)/tracking?parcelId=${p._id}`)
                }
              >
                <View style={styles.parcelRow}>
                  <View style={styles.parcelInfo}>
                    <Text style={styles.parcelRoute}>
                      {p.sender?.address?.city} → {p.recipient?.address?.city}
                    </Text>
                    <Text style={styles.parcelDetail}>
                      {p.size?.toUpperCase()} · {p.weight}kg · {p.distanceKm}km
                    </Text>
                    {p.fragile && (
                      <Text style={styles.fragileTag}>⚠️ Fragile</Text>
                    )}
                    {p.urgent && (
                      <Text style={styles.urgentTag}>⚡ Urgent</Text>
                    )}
                  </View>
                  <View style={styles.parcelRight}>
                    <Text style={styles.parcelPrice}>{p.price}€</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: status.color }]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.parcelDate}>
                  {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecond,
    marginTop: 2,
  },
  logoutBtn: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: 4,
  },
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
  mainBtnIcon: {
    fontSize: 28,
  },
  mainBtnTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
  },
  mainBtnSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  mainBtnArrow: {
    marginLeft: "auto",
    fontSize: 20,
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecond,
  },
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
  parcelInfo: {
    flex: 1,
  },
  parcelRoute: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  parcelDetail: {
    fontSize: 12,
    color: COLORS.textSecond,
    marginBottom: 4,
  },
  fragileTag: {
    fontSize: 11,
    color: COLORS.warning,
  },
  urgentTag: {
    fontSize: 11,
    color: COLORS.danger,
  },
  parcelRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  parcelPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  parcelDate: {
    fontSize: 11,
    color: COLORS.textSecond,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    paddingTop: 8,
  },
});
