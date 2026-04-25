import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function Validate() {
  const router = useRouter();
  const { parcelId, deliveryId, trackId } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (code.length !== 4) {
      Alert.alert("Code invalide", "Le code doit contenir 4 chiffres");
      return;
    }
    setLoading(true);
    try {
      // Terminer le tracking
      if (trackId) {
        await api.patch(`/tracks/${trackId}/finish`);
      }

      // Valider la livraison
      await api.post("/deliveries/validate", { parcelId, code });

      router.replace({
        pathname: "/(livreur)/delivery-done",
        params: { parcelId, trackId, deliveryId },
      });
    } catch (err) {
      Alert.alert("Erreur", err.response?.data?.message || "Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code de livraison</Text>
      <Text style={styles.subtitle}>
        Demande le code à 4 chiffres au destinataire et saisis-le ci-dessous
      </Text>

      {/* Saisie du code */}
      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 4))}
          keyboardType="numeric"
          maxLength={4}
          placeholder="0000"
          placeholderTextColor={COLORS.grayBorder}
          textAlign="center"
        />
      </View>

      {/* Indicateur 4 cases */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, code.length > i && styles.dotFilled]}
          />
        ))}
      </View>

      <Text style={styles.hint}>
        Le destinataire a reçu ce code par SMS lors de la prise en charge du
        colis
      </Text>

      <TouchableOpacity
        style={[
          styles.validateBtn,
          (code.length !== 4 || loading) && styles.validateBtnDisabled,
        ]}
        onPress={handleValidate}
        disabled={code.length !== 4 || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.validateBtnText}>✅ Valider la livraison</Text>
        )}
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
  title: {
    fontSize: 26,
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
    marginBottom: 40,
  },
  codeContainer: {
    width: 180,
    height: 80,
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    letterSpacing: 16,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.grayBorder,
  },
  dotFilled: { backgroundColor: COLORS.primary },
  hint: {
    fontSize: 13,
    color: COLORS.textSecond,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  validateBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  validateBtnDisabled: { backgroundColor: COLORS.gray, opacity: 0.5 },
  validateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
