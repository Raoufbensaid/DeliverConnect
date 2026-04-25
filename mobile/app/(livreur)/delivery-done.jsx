import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function DeliveryDone() {
  const router = useRouter();
  const { parcelId, trackId, deliveryId } = useLocalSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (trackId) {
        const res = await api.get(`/tracks/delivery/${trackId}`);
        setStats(res.data.track);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎉</Text>
      <Text style={styles.title}>Livraison validée !</Text>
      <Text style={styles.subtitle}>
        Félicitations ! Le colis a bien été remis au destinataire. Le virement
        va être déclenché automatiquement.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Résumé de la course</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.totalDistanceKm || 0} km
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDuration(stats.totalDuration)}
                </Text>
                <Text style={styles.statLabel}>Durée</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.avgSpeedKmh || 0} km/h
                </Text>
                <Text style={styles.statLabel}>Vitesse moy.</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDuration(stats.pauseDuration)}
                </Text>
                <Text style={styles.statLabel}>Pause</Text>
              </View>
            </View>
          </View>
        )
      )}

      <View style={styles.paymentCard}>
        <Text style={styles.paymentIcon}>💰</Text>
        <Text style={styles.paymentText}>Virement en cours de traitement</Text>
        <Text style={styles.paymentSub}>
          Vous recevrez votre paiement sous peu
        </Text>
      </View>

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() =>
          router.push(`/(livreur)/track-detail?deliveryId=${deliveryId}`)
        }
      >
        <Text style={styles.historyBtnText}>Voir l'historique</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => router.replace("/(livreur)")}
      >
        <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  icon: { fontSize: 72, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecond,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecond },
  paymentCard: {
    backgroundColor: "#EAF3DE",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C0DD97",
  },
  paymentIcon: { fontSize: 32, marginBottom: 8 },
  paymentText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.success,
    marginBottom: 4,
  },
  paymentSub: { fontSize: 12, color: COLORS.textSecond },
  historyBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  historyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  homeBtn: {
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  homeBtnText: { color: COLORS.textSecond, fontSize: 15 },
});
