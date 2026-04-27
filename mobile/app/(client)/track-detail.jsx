import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapFallback from "../../components/MapFallback";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

const { width } = Dimensions.get("window");

export default function TrackDetail() {
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams();
  const [track, setTrack] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState("standard");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get(`/tracks/delivery/${deliveryId}`);
        setTrack({
          ...res.data.track,
          timestamps: res.data.timestamps,
        });
        // Récupérer l'évaluation liée à cette livraison
        try {
          const rev = await api.get(`/reviews/delivery/${deliveryId}`);
          if (rev.data.review) setReview(rev.data.review);
        } catch {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((s) => (
      <Text
        key={s}
        style={{ fontSize: 20, color: s <= rating ? "#F6AD55" : "#CBD5E0" }}
      >
        ★
      </Text>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const points = track?.points || [];
  const activePoints = points.filter((p) => !p.isPause);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Détail du tracé</Text>
      </View>

      <ScrollView>
        {/* Carte */}
        <View style={styles.mapContainer}>
          <MapFallback height={280} points={activePoints} />
          <View style={styles.mapToggle}>
            <TouchableOpacity
              style={[
                styles.mapToggleBtn,
                mapType === "standard" && styles.mapToggleBtnActive,
              ]}
              onPress={() => setMapType("standard")}
            >
              <Text
                style={[
                  styles.mapToggleTxt,
                  mapType === "standard" && styles.mapToggleTxtActive,
                ]}
              >
                Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mapToggleBtn,
                mapType === "satellite" && styles.mapToggleBtnActive,
              ]}
              onPress={() => setMapType("satellite")}
            >
              <Text
                style={[
                  styles.mapToggleTxt,
                  mapType === "satellite" && styles.mapToggleTxtActive,
                ]}
              >
                Satellite
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsGrid}>
            {[
              { label: "Distance", value: `${track?.totalDistanceKm || 0} km` },
              { label: "Durée", value: formatDuration(track?.totalDuration) },
              {
                label: "Vitesse moy.",
                value: `${track?.avgSpeedKmh || 0} km/h`,
              },
              { label: "Pause", value: formatDuration(track?.pauseDuration) },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Horodatages */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Horodatages</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>🚀 Départ tracking</Text>
              <Text style={styles.timeValue}>
                {formatDate(track?.startedAt)}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>🏁 Fin tracking</Text>
              <Text style={styles.timeValue}>
                {formatDate(track?.finishedAt)}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>📦 Prise en charge</Text>
              <Text style={styles.timeValue}>
                {formatDate(track?.timestamps?.pickupAt)}
              </Text>
            </View>
            <View style={[styles.timeRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.timeLabel}>✅ Remise colis</Text>
              <Text style={styles.timeValue}>
                {formatDate(track?.timestamps?.deliveredAt)}
              </Text>
            </View>
          </View>

          {/* Points du tracé */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📍 Points enregistrés</Text>
            <Text style={styles.pointsCount}>
              {points.length} points GPS enregistrés
              {points.filter((p) => p.isPause).length > 0 &&
                ` dont ${points.filter((p) => p.isPause).length} points de pause`}
            </Text>
          </View>

          {/* Évaluation client */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Évaluation du client</Text>
            {review ? (
              <>
                {/* Note étoiles */}
                <View
                  style={{ flexDirection: "row", gap: 4, marginBottom: 14 }}
                >
                  {renderStars(review.rating)}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: COLORS.text,
                      marginLeft: 8,
                    }}
                  >
                    {review.rating}/5
                  </Text>
                </View>

                {/* Questions */}
                {[
                  { label: "✅ Livraison à temps", value: review.onTime },
                  { label: "📦 Colis en bon état", value: review.damaged },
                  { label: "🤝 Bien réceptionné", value: review.wellReceived },
                  {
                    label: "⚠️ La livraison s'est bien passée",
                    value: review.hadIssues,
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.reviewRow}>
                    <Text style={styles.reviewRowLabel}>{item.label}</Text>
                    <View
                      style={[
                        styles.reviewBadge,
                        { backgroundColor: item.value ? "#EAF3DE" : "#FCEBEB" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reviewBadgeText,
                          { color: item.value ? "#27500A" : "#791F1F" },
                        ]}
                      >
                        {item.value ? "Oui" : "Non"}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Commentaire */}
                {review.comment ? (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentLabel}>💬 Commentaire</Text>
                    <Text style={styles.commentText}>{review.comment}</Text>
                  </View>
                ) : null}

                {/* Date */}
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.textSecond,
                    marginTop: 10,
                  }}
                >
                  Évalué le {formatDate(review.createdAt)}
                </Text>
              </>
            ) : (
              <View style={styles.noReview}>
                <Text style={styles.noReviewIcon}>⏳</Text>
                <Text style={styles.noReviewText}>Pas encore d'évaluation</Text>
                <Text style={styles.noReviewSub}>
                  Le client n'a pas encore évalué cette livraison
                </Text>
              </View>
            )}
          </View>
        </View>
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
  mapContainer: { position: "relative" },
  map: { width, height: 280 },
  mapToggle: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  mapToggleBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  mapToggleBtnActive: { backgroundColor: COLORS.primary },
  mapToggleTxt: { fontSize: 12, color: COLORS.textSecond, fontWeight: "500" },
  mapToggleTxtActive: { color: COLORS.white },
  content: { padding: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  timeLabel: { fontSize: 13, color: COLORS.textSecond },
  timeValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  pointsCount: { fontSize: 13, color: COLORS.textSecond },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  reviewRowLabel: { fontSize: 13, color: COLORS.text, flex: 1 },
  reviewBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  reviewBadgeText: { fontSize: 12, fontWeight: "600" },
  commentBox: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecond,
    marginBottom: 6,
  },
  commentText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  noReview: { alignItems: "center", paddingVertical: 20 },
  noReviewIcon: { fontSize: 32, marginBottom: 8 },
  noReviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  noReviewSub: { fontSize: 12, color: COLORS.textSecond, textAlign: "center" },
});
