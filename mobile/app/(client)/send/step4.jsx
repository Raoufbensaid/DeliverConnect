import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../../constants/colors";
import api from "../../../services/api";

export default function Step4() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimate();
  }, []);

  const fetchEstimate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("size", params.size);
      formData.append("fragile", params.fragile);
      formData.append("urgent", params.urgent);
      formData.append(
        "sender",
        JSON.stringify({
          street: params.senderStreet,
          city: params.senderCity,
          postalCode: params.senderPostalCode,
        }),
      );
      formData.append(
        "recipient",
        JSON.stringify({
          street: params.recipientStreet,
          city: params.recipientCity,
          postalCode: params.recipientPostalCode,
        }),
      );

      const res = await api.post("/parcels/estimate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEstimate(res.data);
    } catch (err) {
      Alert.alert(
        "Erreur",
        "Impossible de calculer le prix. Vérifie les adresses.",
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    router.push({
      pathname: "/(client)/send/step5",
      params: {
        ...params,
        price: String(estimate.price),
        delivererAmount: String(estimate.delivererAmount),
        distanceKm: String(estimate.distanceKm),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calcul du prix en cours...</Text>
        <Text style={styles.loadingSubText}>Calcul de la distance réelle</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Estimation du prix</Text>
      <Text style={styles.subtitle}>Étape 4 sur 5</Text>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= 4 && styles.progressDotActive]}
          />
        ))}
      </View>

      {/* Résumé trajet */}
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <Text style={styles.routeCity}>{params.senderCity}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View
            style={[styles.routeDot, { backgroundColor: COLORS.success }]}
          />
          <Text style={styles.routeCity}>{params.recipientCity}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>📍 {estimate?.distanceKm} km</Text>
        </View>
      </View>

      {/* Détail du prix */}
      <View style={styles.priceCard}>
        <Text style={styles.priceTitle}>Détail du calcul</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            Prix de base ({params.size?.toUpperCase()})
          </Text>
          <Text style={styles.priceValue}>
            {estimate?.priceBreakdown?.basePrice}€
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            Distance ({estimate?.distanceKm} km)
          </Text>
          <Text style={styles.priceValue}>
            {estimate?.priceBreakdown?.distancePrice}€
          </Text>
        </View>
        {estimate?.priceBreakdown?.fragileExtra > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>⚠️ Fragile (+15%)</Text>
            <Text style={styles.priceValue}>
              +{estimate?.priceBreakdown?.fragileExtra}€
            </Text>
          </View>
        )}
        {estimate?.priceBreakdown?.urgentExtra > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>⚡ Urgent (+25%)</Text>
            <Text style={styles.priceValue}>
              +{estimate?.priceBreakdown?.urgentExtra}€
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValue}>{estimate?.price}€</Text>
        </View>

        <View style={styles.commissionRow}>
          <Text style={styles.commissionText}>
            dont {Math.round(estimate?.price * 0.2 * 100) / 100}€ de commission
            plateforme (20%)
          </Text>
        </View>
      </View>

      {/* Résumé colis */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taille</Text>
          <Text style={styles.summaryValue}>{params.size?.toUpperCase()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Poids</Text>
          <Text style={styles.summaryValue}>{params.weight} kg</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fragile</Text>
          <Text style={styles.summaryValue}>
            {params.fragile === "true" ? "⚠️ Oui" : "Non"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Urgent</Text>
          <Text style={styles.summaryValue}>
            {params.urgent === "true" ? "⚡ Oui" : "Non"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>Confirmer — {estimate?.price}€ →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.recalcBtn} onPress={fetchEstimate}>
        <Text style={styles.recalcText}>🔄 Recalculer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: COLORS.white,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 13,
    color: COLORS.textSecond,
    marginTop: 4,
  },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: COLORS.textSecond, marginBottom: 16 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 28 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayBorder,
  },
  progressDotActive: { backgroundColor: COLORS.primary },
  routeCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.grayBorder,
    marginLeft: 4,
    marginVertical: 4,
  },
  routeCity: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  distanceBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  distanceText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  priceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  priceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: { fontSize: 14, color: COLORS.textSecond },
  priceValue: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  totalValue: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  commissionRow: { marginTop: 6 },
  commissionText: { fontSize: 11, color: COLORS.textSecond },
  summaryCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecond },
  summaryValue: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  nextBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  recalcBtn: { alignItems: "center", padding: 12 },
  recalcText: { fontSize: 14, color: COLORS.textSecond },
});
