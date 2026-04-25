import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function Delivering() {
  const router = useRouter();
  const { parcelId, deliveryId, validationCode } = useLocalSearchParams();
  const [trackId, setTrackId] = useState(null);
  const [status, setStatus] = useState("active");
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // Démarrer le tracking au montage
  useEffect(() => {
    startTracking();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  // Timer durée
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

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

      // Envoyer la position toutes les 10 secondes
      intervalRef.current = setInterval(async () => {
        if (status === "paused") return;
        try {
          let loc = { coords: { latitude: 48.8566, longitude: 2.3522 } };
          try {
            loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
          } catch {}

          await api.post(`/tracks/${res.data.trackId}/point`, {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
          setDistance((d) => Math.round((d + 0.05) * 100) / 100);
        } catch {}
      }, 10000);
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
    } catch (err) {
      Alert.alert("Erreur", "Impossible de mettre en pause");
    }
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

      // Reprendre l'envoi de position
      intervalRef.current = setInterval(async () => {
        try {
          let loc = { coords: { latitude: 48.8566, longitude: 2.3522 } };
          try {
            loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
          } catch {}
          await api.post(`/tracks/${trackId}/point`, {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        } catch {}
      }, 10000);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de reprendre");
    }
  };

  const handleValidate = () => {
    router.push({
      pathname: "/(livreur)/validate",
      params: { parcelId, deliveryId, trackId },
    });
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
      {/* Status bar */}
      <View
        style={[
          styles.statusBar,
          status === "paused" && styles.statusBarPaused,
        ]}
      >
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {status === "active" ? "🟢 Livraison en cours" : "⏸️ En pause"}
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
        <View style={styles.statCard}>
          <Text
            style={[
              styles.statValue,
              { color: status === "active" ? COLORS.success : COLORS.warning },
            ]}
          >
            {status === "active" ? "Actif" : "Pause"}
          </Text>
          <Text style={styles.statLabel}>Statut GPS</Text>
        </View>
      </View>

      {/* Info code OTP */}
      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>
          💬 Code destinataire envoyé par SMS
        </Text>
        <Text style={styles.codeDesc}>
          Le destinataire a reçu un code à 4 chiffres par SMS. Demande-lui ce
          code à la livraison pour valider la remise.
        </Text>
      </View>

      {/* Pause / Reprendre */}
      {status === "active" ? (
        <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
          <Text style={styles.pauseBtnIcon}>⏸️</Text>
          <View>
            <Text style={styles.pauseBtnTitle}>Mettre en pause</Text>
            <Text style={styles.pauseBtnDesc}>
              Le tracé restera visible mais votre position sera masquée
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
          <Text style={styles.resumeBtnIcon}>▶️</Text>
          <View>
            <Text style={styles.resumeBtnTitle}>Reprendre la livraison</Text>
            <Text style={styles.resumeBtnDesc}>
              Le tracking GPS reprend depuis votre position actuelle
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Info tracking */}
      <View style={styles.trackingInfo}>
        <Text style={styles.trackingInfoText}>
          📍 Votre position est partagée en temps réel avec le client et
          l'administrateur
        </Text>
      </View>

      {/* Bouton valider livraison */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.validateBtn, loading && { opacity: 0.7 }]}
          onPress={handleValidate}
          disabled={loading}
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
  container: { flex: 1, backgroundColor: COLORS.grayLight, paddingTop: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  startingText: { fontSize: 14, color: COLORS.textSecond, marginTop: 12 },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF3DE",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C0DD97",
  },
  statusBarPaused: { backgroundColor: "#FAEEDA", borderColor: "#FAC775" },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
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
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecond },
  codeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  codeDesc: { fontSize: 13, color: COLORS.textSecond, lineHeight: 18 },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  pauseBtnIcon: { fontSize: 28 },
  pauseBtnTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  pauseBtnDesc: { fontSize: 12, color: COLORS.textSecond },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF3DE",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  resumeBtnIcon: { fontSize: 28 },
  resumeBtnTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.success,
    marginBottom: 2,
  },
  resumeBtnDesc: { fontSize: 12, color: COLORS.textSecond },
  trackingInfo: {
    backgroundColor: "#EBF4FF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
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
