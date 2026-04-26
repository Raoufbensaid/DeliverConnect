import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { io } from "socket.io-client";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

const { width, height } = Dimensions.get("window");
const SOCKET_URL = "http://192.168.1.182:3000";

export default function Tracking() {
  const router = useRouter();
  const { parcelId } = useLocalSearchParams();
  const [parcel, setParcel] = useState(null);
  const [livreurPos, setLivreurPos] = useState(null);
  const [tracePath, setTracePath] = useState([]);
  const [trackingStatus, setTrackingStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState("standard");
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchParcel();
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_delivery", parcelId);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchParcel = async () => {
    try {
      const res = await api.get(`/parcels/${parcelId}`);
      setParcel(res.data.parcel);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connecté");
      socketRef.current.emit("join_delivery", parcelId);
    });

    // Position en temps réel du livreur
    socketRef.current.on("location_update", (data) => {
      const newPos = { latitude: data.lat, longitude: data.lng };
      setLivreurPos(newPos);
      setTracePath((prev) => [...prev, newPos]);

      // Centrer la carte sur la position du livreur
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...newPos,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      }
    });

    // Tracking en pause
    socketRef.current.on("tracking_paused", () => {
      setTrackingStatus("paused");
    });

    // Tracking repris
    socketRef.current.on("tracking_resumed", () => {
      setTrackingStatus("active");
    });

    // Livraison terminée
    socketRef.current.on("tracking_finished", () => {
      setTrackingStatus("finished");
    });
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
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

  const senderCoords = parcel?.sender?.address?.lat
    ? {
        latitude: parcel.sender.address.lat,
        longitude: parcel.sender.address.lng,
      }
    : null;

  const recipientCoords = parcel?.recipient?.address?.lat
    ? {
        latitude: parcel.recipient.address.lat,
        longitude: parcel.recipient.address.lng,
      }
    : null;

  const initialRegion = senderCoords
    ? {
        latitude: senderCoords.latitude,
        longitude: senderCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
      >
        {/* Marqueur départ */}
        {senderCoords && (
          <Marker
            coordinate={senderCoords}
            title="Départ"
            description={parcel?.sender?.address?.city}
            pinColor="blue"
          />
        )}

        {/* Marqueur arrivée */}
        {recipientCoords && (
          <Marker
            coordinate={recipientCoords}
            title="Arrivée"
            description={parcel?.recipient?.address?.city}
            pinColor="green"
          />
        )}

        {/* Position livreur en live */}
        {livreurPos && (
          <Marker coordinate={livreurPos} title="Livreur">
            <View style={styles.livreurMarker}>
              <Text style={styles.livreurMarkerText}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Tracé du livreur */}
        {tracePath.length > 1 && (
          <Polyline
            coordinates={tracePath}
            strokeColor={COLORS.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Toggle carte */}
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

      {/* Panel bas */}
      <View style={styles.panel}>
        {/* Statut */}
        <View
          style={[
            styles.statusRow,
            trackingStatus === "paused" && styles.statusRowPaused,
            trackingStatus === "finished" && styles.statusRowFinished,
          ]}
        >
          <Text style={styles.statusIcon}>
            {trackingStatus === "active"
              ? "🟢"
              : trackingStatus === "paused"
                ? "⏸️"
                : "✅"}
          </Text>
          <Text style={styles.statusText}>
            {trackingStatus === "active"
              ? "Livreur en route"
              : trackingStatus === "paused"
                ? "Livreur en pause"
                : "Livraison terminée"}
          </Text>
          {!livreurPos && trackingStatus === "active" && (
            <Text style={styles.waitingText}>En attente de position...</Text>
          )}
        </View>

        {/* Infos trajet */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>De</Text>
            <Text style={styles.infoValue}>
              {parcel?.sender?.address?.city}
            </Text>
          </View>
          <Text style={styles.infoArrow}>→</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>À</Text>
            <Text style={styles.infoValue}>
              {parcel?.recipient?.address?.city}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{parcel?.distanceKm} km</Text>
          </View>
        </View>

        {/* Destinataire */}
        <View style={styles.recipientRow}>
          <Text style={styles.recipientLabel}>👤 Destinataire</Text>
          <Text style={styles.recipientValue}>
            {parcel?.recipient?.firstName} {parcel?.recipient?.lastName} ·{" "}
            {parcel?.recipient?.phone}
          </Text>
        </View>

        {/* Bouton retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width, height: height * 0.55 },
  mapToggle: {
    position: "absolute",
    top: 60,
    right: 16,
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
  livreurMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  livreurMarkerText: { fontSize: 18 },
  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF3DE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C0DD97",
  },
  statusRowPaused: { backgroundColor: "#FAEEDA", borderColor: "#FAC775" },
  statusRowFinished: { backgroundColor: "#EAF3DE", borderColor: "#C0DD97" },
  statusIcon: { fontSize: 16 },
  statusText: { fontSize: 14, fontWeight: "600", color: COLORS.text, flex: 1 },
  waitingText: { fontSize: 11, color: COLORS.textSecond },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: COLORS.grayLight,
    borderRadius: 10,
    padding: 12,
  },
  infoItem: { alignItems: "center" },
  infoLabel: { fontSize: 10, color: COLORS.textSecond, marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  infoArrow: { fontSize: 16, color: COLORS.textSecond },
  recipientRow: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  recipientLabel: { fontSize: 11, color: COLORS.textSecond, marginBottom: 4 },
  recipientValue: { fontSize: 13, fontWeight: "500", color: COLORS.text },
  backBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  backBtnText: { fontSize: 14, color: COLORS.textSecond },
});
