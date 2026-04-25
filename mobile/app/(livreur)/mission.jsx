import { useState, useEffect } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function Mission() {
  const router = useRouter();
  const { parcelId } = useLocalSearchParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchParcel = async () => {
      try {
        const res = await api.get(`/parcels/${parcelId}`);
        setParcel(res.data.parcel);
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger cette annonce");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchParcel();
  }, []);

  const handleAccept = async () => {
    Alert.alert(
      "Accepter la mission",
      `Confirmes-tu vouloir livrer ce colis de ${parcel?.sender?.address?.city} à ${parcel?.recipient?.address?.city} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setAccepting(true);
            try {
              await api.patch(`/parcels/${parcelId}/assign`);
              router.replace(`/(livreur)/pickup?parcelId=${parcelId}`);
            } catch (err) {
              Alert.alert(
                "Erreur",
                err.response?.data?.message || "Erreur lors de l'acceptation",
              );
            } finally {
              setAccepting(false);
            }
          },
        },
      ],
    );
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
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Détail de la mission</Text>

        {/* Trajet */}
        {/* Trajet */}
        <TouchableOpacity style={styles.card} onPress={() => setShowMap(true)}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>📍 Trajet</Text>
            <Text style={styles.cardTitleAction}>Voir la carte →</Text>
          </View>

          <View style={styles.stopRow}>
            <View style={styles.stopLeft}>
              <View style={styles.dotBlue} />
              <View style={styles.routeLine} />
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopType}>DÉPART</Text>
              <Text style={styles.stopCity}>
                {parcel?.sender?.address?.city}
              </Text>
              <Text style={styles.stopStreet}>
                {parcel?.sender?.address?.street},{" "}
                {parcel?.sender?.address?.postalCode}
              </Text>
            </View>
          </View>

          <View style={styles.stopRow}>
            <View style={styles.stopLeft}>
              <View style={styles.routeLineOnly} />
            </View>
            <View style={styles.distanceMid}>
              <Text style={styles.distanceMidText}>
                📍{" "}
                {parcel?.distanceKm > 0
                  ? `${parcel.distanceKm} km`
                  : "Non disponible"}{" "}
                · Appuie pour voir la carte
              </Text>
            </View>
          </View>

          <View style={styles.stopRow}>
            <View style={styles.stopLeft}>
              <View style={styles.routeLine} />
              <View style={styles.dotGreen} />
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopType}>ARRIVÉE</Text>
              <Text style={styles.stopCity}>
                {parcel?.recipient?.address?.city}
              </Text>
              <Text style={styles.stopStreet}>
                {parcel?.recipient?.address?.street},{" "}
                {parcel?.recipient?.address?.postalCode}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Modal Carte */}
        <Modal
          visible={showMap}
          animationType="slide"
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Itinéraire</Text>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Text style={styles.modalClose}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>

            <MapView
              style={styles.modalMap}
              initialRegion={{
                latitude: parcel?.sender?.address?.lat || 48.8566,
                longitude: parcel?.sender?.address?.lng || 2.3522,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              }}
            >
              {/* Marqueur départ */}
              <Marker
                coordinate={{
                  latitude: parcel?.sender?.address?.lat || 48.8566,
                  longitude: parcel?.sender?.address?.lng || 2.3522,
                }}
                title="Départ"
                description={`${parcel?.sender?.address?.street}, ${parcel?.sender?.address?.city}`}
                pinColor="blue"
              />

              {/* Marqueur arrivée */}
              <Marker
                coordinate={{
                  latitude: parcel?.recipient?.address?.lat || 45.764,
                  longitude: parcel?.recipient?.address?.lng || 4.8357,
                }}
                title="Arrivée"
                description={`${parcel?.recipient?.address?.street}, ${parcel?.recipient?.address?.city}`}
                pinColor="green"
              />

              {/* Ligne entre les deux points */}
              <Polyline
                coordinates={[
                  {
                    latitude: parcel?.sender?.address?.lat || 48.8566,
                    longitude: parcel?.sender?.address?.lng || 2.3522,
                  },
                  {
                    latitude: parcel?.recipient?.address?.lat || 45.764,
                    longitude: parcel?.recipient?.address?.lng || 4.8357,
                  },
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            </MapView>

            {/* Infos en bas */}
            <View style={styles.modalFooter}>
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>Distance</Text>
                <Text style={styles.modalInfoValue}>
                  {parcel?.distanceKm} km
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>De</Text>
                <Text style={styles.modalInfoValue}>
                  {parcel?.sender?.address?.city}
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>À</Text>
                <Text style={styles.modalInfoValue}>
                  {parcel?.recipient?.address?.city}
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Contacts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Contacts</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Expéditeur</Text>
            <Text style={styles.contactValue}>
              {parcel?.sender?.firstName} {parcel?.sender?.lastName}
            </Text>
            <Text style={styles.contactPhone}>📞 {parcel?.sender?.phone}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Destinataire</Text>
            <Text style={styles.contactValue}>
              {parcel?.recipient?.firstName} {parcel?.recipient?.lastName}
            </Text>
            <Text style={styles.contactPhone}>
              📞 {parcel?.recipient?.phone}
            </Text>
          </View>
        </View>

        {/* Colis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Colis</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taille</Text>
            <Text style={styles.infoValue}>{parcel?.size?.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Poids</Text>
            <Text style={styles.infoValue}>{parcel?.weight} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fragile</Text>
            <Text style={styles.infoValue}>
              {parcel?.fragile === true ? "⚠️ Oui" : "Non"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Urgent</Text>
            <Text style={styles.infoValue}>
              {parcel?.urgent === true ? "⚡ Oui" : "Non"}
            </Text>
          </View>
          {parcel?.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: "right" }]}>
                {parcel?.description}
              </Text>
            </View>
          )}
        </View>

        {/* Rémunération */}
        <View style={[styles.card, styles.earningCard]}>
          <Text style={styles.cardTitle}>💰 Rémunération</Text>
          <Text style={styles.earningAmount}>{parcel?.delivererAmount}€</Text>
          <Text style={styles.earningNote}>
            Versé automatiquement après confirmation de livraison
          </Text>
        </View>
      </ScrollView>

      {/* Bouton accepter */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptBtn, accepting && { opacity: 0.7 }]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.acceptBtnText}>✅ Accepter cette mission</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
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
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  routePoints: { alignItems: "center", paddingTop: 4 },
  dotBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 44,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 4,
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  routeInfo: { flex: 1, justifyContent: "space-between", height: 72 },
  routeStop: {},
  routeCity: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  routeStreet: { fontSize: 12, color: COLORS.textSecond, marginTop: 1 },
  routePostal: { fontSize: 12, color: COLORS.textSecond },
  distanceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  distanceText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  contactRow: { paddingVertical: 4 },
  contactLabel: {
    fontSize: 11,
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 2,
  },
  contactPhone: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecond },
  infoValue: { fontSize: 13, fontWeight: "500", color: COLORS.text },
  earningCard: { borderColor: COLORS.success, borderWidth: 1.5 },
  earningAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.success,
    marginBottom: 4,
  },
  earningNote: { fontSize: 12, color: COLORS.textSecond },
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
  acceptBtn: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },

  acceptBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },

  // Nouveaux styles à ajouter ici ↓
  stopRow: { flexDirection: "row", gap: 12 },
  stopLeft: { alignItems: "center", width: 20 },
  routeLineOnly: { width: 2, height: 28, backgroundColor: COLORS.grayBorder },
  stopContent: { flex: 1, paddingBottom: 14 },
  stopType: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  stopCity: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  stopStreet: { fontSize: 12, color: COLORS.textSecond },
  distanceMid: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#EBF4FF",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  distanceMidText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitleAction: { fontSize: 12, color: COLORS.primary },
  modalContainer: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  modalClose: { fontSize: 14, color: COLORS.danger },
  modalMap: { flex: 1 },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    backgroundColor: COLORS.white,
  },
  modalInfo: { flex: 1, alignItems: "center" },
  modalInfoLabel: { fontSize: 11, color: COLORS.textSecond, marginBottom: 4 },
  modalInfoValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});
