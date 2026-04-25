import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function Delivering() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { parcelId, deliveryId } = params;

  const [trackId, setTrackId] = useState(null);
  const [parcel, setParcel] = useState(null);
  const [status, setStatus] = useState("active");
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [starting, setStarting] = useState(true);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // Bloquer le bouton retour Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  // Démarrage
  useEffect(() => {
    fetchParcel();
    if (params.trackId) {
      setTrackId(params.trackId);
      setStarting(false);
      startPositionInterval(params.trackId);
    } else {
      startTracking();
    }
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const fetchParcel = async () => {
    try {
      const res = await api.get(`/parcels/${parcelId}`);
      setParcel(res.data.parcel);
    } catch {}
  };

  const startPositionInterval = (id) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        let loc = { coords: { latitude: 48.8566, longitude: 2.3522 } };
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch {}
        await api.post(`/tracks/${id}/point`, {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
        setDistance((d) => Math.round((d + 0.05) * 100) / 100);
      } catch {}
    }, 10000);
  };

  const startTracking = async () => {
    try {
      let location = { coords: { latitude: 48.8566, longitude: 2.3522 } };
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {}

      const res = await api.post("/tracks/start", {
        deliveryId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      setTrackId(res.data.trackId);
      startPositionInterval(res.data.trackId);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    if (!trackId) return;
    try {
      await api.patch(`/tracks/${trackId}/pause`);
      setStatus("paused");
      clearInterval(intervalRef.current);
    } catch {}
  };

  const handleResume = async () => {
    if (!trackId) return;
    try {
      let location = { coords: { latitude: 48.8566, longitude: 2.3522 } };
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {}
      await api.patch(`/tracks/${trackId}/resume`, {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      setStatus("active");
      startPositionInterval(trackId);
    } catch {}
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (starting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.startingText}>Démarrage du tracking GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Livraison en cours</Text>
          <View
            style={[
              styles.statusBadge,
              status === "paused" && styles.statusBadgePaused,
            ]}
          >
            <Text style={styles.statusText}>
              {status === "active" ? "🟢 En cours" : "⏸️ Pause"}
            </Text>
          </View>
        </View>

        {/* Avertissement */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            🔒 Tu ne peux pas quitter cette page tant que la livraison n'est pas
            validée.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Durée</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{distance} km</Text>
            <Text style={styles.statLabel}>Parcouru</Text>
          </View>
        </View>

        {/* Contacts */}
        {parcel && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Contacts</Text>
            <View style={styles.contactBlock}>
              <Text style={styles.contactRole}>📦 Expéditeur</Text>
              <Text style={styles.contactName}>
                {parcel.sender?.firstName} {parcel.sender?.lastName}
              </Text>
              <Text style={styles.contactPhone}>📞 {parcel.sender?.phone}</Text>
              <Text style={styles.contactAddress}>
                📍 {parcel.sender?.address?.street},{" "}
                {parcel.sender?.address?.postalCode}{" "}
                {parcel.sender?.address?.city}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.contactBlock}>
              <Text style={styles.contactRole}>🏠 Destinataire</Text>
              <Text style={styles.contactName}>
                {parcel.recipient?.firstName} {parcel.recipient?.lastName}
              </Text>
              <Text style={styles.contactPhone}>
                📞 {parcel.recipient?.phone}
              </Text>
              <Text style={styles.contactAddress}>
                📍 {parcel.recipient?.address?.street},{" "}
                {parcel.recipient?.address?.postalCode}{" "}
                {parcel.recipient?.address?.city}
              </Text>
            </View>
          </View>
        )}

        {/* Info OTP */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💬</Text>
          <Text style={styles.infoText}>
            Un code à 4 chiffres a été envoyé par SMS au destinataire.
            Demande-lui à la livraison.
          </Text>
        </View>

        {/* Pause / Reprendre */}
        {status === "active" ? (
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
            <Text style={styles.actionIcon}>⏸️</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Mettre en pause</Text>
              <Text style={styles.actionDesc}>
                Position masquée, tracé conservé
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
            <Text style={styles.actionIcon}>▶️</Text>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: COLORS.success }]}>
                Reprendre
              </Text>
              <Text style={styles.actionDesc}>Le tracking GPS reprend</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Info tracking */}
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingInfoText}>
            📍 Position partagée en temps réel avec le client
          </Text>
        </View>
      </ScrollView>

      {/* Bouton valider */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.validateBtn}
          onPress={() =>
            router.push({
              pathname: "/(livreur)/validate",
              params: { parcelId, deliveryId, trackId },
            })
          }
        >
          <Text style={styles.validateBtnText}>
            🔢 Saisir le code de livraison
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  startingText: { fontSize: 14, color: COLORS.textSecond, marginTop: 12 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  statusBadge: {
    backgroundColor: "#EAF3DE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#C0DD97",
  },
  statusBadgePaused: { backgroundColor: "#FAEEDA", borderColor: "#FAC775" },
  statusText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  warningCard: {
    backgroundColor: "#FFF8E6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warningText: {
    fontSize: 12,
    color: "#633806",
    textAlign: "center",
    lineHeight: 18,
  },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  statValue: {
    fontSize: 20,
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
  contactBlock: { paddingVertical: 4, gap: 3 },
  contactRole: {
    fontSize: 11,
    color: COLORS.textSecond,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  contactPhone: { fontSize: 13, color: COLORS.primary },
  contactAddress: { fontSize: 12, color: COLORS.textSecond },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 10,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EBF4FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#B8D4F0",
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 17 },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF3DE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  actionIcon: { fontSize: 24, flexShrink: 0 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  actionDesc: { fontSize: 12, color: COLORS.textSecond, marginTop: 2 },
  trackingInfo: {
    backgroundColor: "#EBF4FF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#B8D4F0",
  },
  trackingInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  validateBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  validateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
