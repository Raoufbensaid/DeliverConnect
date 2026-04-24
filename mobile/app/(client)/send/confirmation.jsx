import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../../constants/colors";

export default function Confirmation() {
  const router = useRouter();
  const { parcelId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎉</Text>
      <Text style={styles.title}>Annonce publiée !</Text>
      <Text style={styles.subtitle}>
        Votre annonce est maintenant visible par les livreurs disponibles. Vous
        serez notifié dès qu'un livreur accepte votre mission.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>🔍 En attente d'un livreur...</Text>
        <Text style={styles.cardSub}>
          Votre colis sera pris en charge très prochainement
        </Text>
      </View>

      <TouchableOpacity
        style={styles.trackBtn}
        onPress={() => router.push(`/(client)/tracking?parcelId=${parcelId}`)}
      >
        <Text style={styles.trackBtnText}>Suivre ma livraison</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => router.replace("/(client)")}
      >
        <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.white,
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
    fontSize: 15,
    color: COLORS.textSecond,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#EBF4FF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B8D4F0",
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 6,
  },
  cardSub: { fontSize: 13, color: COLORS.textSecond, textAlign: "center" },
  trackBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  trackBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
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
