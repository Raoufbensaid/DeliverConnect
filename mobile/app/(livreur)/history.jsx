import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function History() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/tracks/history");
        setHistory(res.data.history);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.count}>
          {history.length} livraison{history.length > 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucune livraison effectuée</Text>
          </View>
        ) : (
          history.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() =>
                router.push(
                  `/(livreur)/track-detail?deliveryId=${item.deliveryId}`,
                )
              }
            >
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routeLeft}>
                  <View style={styles.dotBlue} />
                  <View style={styles.routeLine} />
                  <View style={styles.dotGreen} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>
                    {item.parcel?.sender?.address?.city}
                  </Text>
                  <Text style={styles.routeCity}>
                    {item.parcel?.recipient?.address?.city}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardEarning}>
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

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>
                    {item.totalDistanceKm || 0} km
                  </Text>
                  <Text style={styles.statLbl}>Distance</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>
                    {formatDuration(item.totalDuration)}
                  </Text>
                  <Text style={styles.statLbl}>Durée</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>
                    {item.avgSpeedKmh || 0} km/h
                  </Text>
                  <Text style={styles.statLbl}>Vitesse moy.</Text>
                </View>
              </View>

              {/* Horodatages */}
              <View style={styles.timestamps}>
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>📦 Prise en charge</Text>
                  <Text style={styles.timestampValue}>
                    {formatDate(item.pickupAt)}
                  </Text>
                </View>
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>✅ Remise</Text>
                  <Text style={styles.timestampValue}>
                    {formatDate(item.deliveredAt)}
                  </Text>
                </View>
              </View>

              <Text style={styles.seeMore}>Voir le tracé →</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  backText: { fontSize: 15, color: COLORS.primary, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textSecond, marginTop: 2 },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  routeLeft: { alignItems: "center", marginRight: 10 },
  dotBlue: {
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
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  routeInfo: { flex: 1, justifyContent: "space-between", height: 48 },
  routeCity: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  cardRight: { alignItems: "flex-end", gap: 6 },
  cardEarning: { fontSize: 20, fontWeight: "800", color: COLORS.success },
  deliveredBadge: {
    backgroundColor: "#EAF3DE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  deliveredText: { fontSize: 11, color: COLORS.success, fontWeight: "500" },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    paddingTop: 12,
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statVal: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLbl: { fontSize: 10, color: COLORS.textSecond },
  timestamps: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampLabel: { fontSize: 12, color: COLORS.textSecond },
  timestampValue: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  seeMore: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: "right",
    fontWeight: "500",
  },
});
