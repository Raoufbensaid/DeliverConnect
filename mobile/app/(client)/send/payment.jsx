import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../../constants/colors";
import api from "../../../services/api";

export default function Payment() {
  const router = useRouter();
  const { parcelId, clientSecret, price } = useLocalSearchParams();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3)
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    return cleaned;
  };

  const validateCard = () => {
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length !== 16) {
      Alert.alert("Erreur", "Numéro de carte invalide — 16 chiffres requis");
      return false;
    }
    if (expiry.length !== 5) {
      Alert.alert("Erreur", "Date d'expiration invalide — format MM/AA");
      return false;
    }
    if (cvc.length < 3) {
      Alert.alert("Erreur", "CVC invalide — 3 chiffres requis");
      return false;
    }
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom sur la carte");
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    if (!validateCard()) return;
    setLoading(true);
    try {
      await api.post("/payments/confirm-test", {
        parcelId: String(parcelId),
        clientSecret: String(clientSecret),
      });

      router.replace({
        pathname: "/(client)/send/confirmation",
        params: { parcelId },
      });
    } catch (err) {
      Alert.alert(
        "Erreur paiement",
        err.response?.data?.message || "Erreur lors du paiement",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Paiement sécurisé</Text>
      <Text style={styles.subtitle}>
        Entrez vos informations de carte bancaire
      </Text>

      {/* Montant */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Montant à payer</Text>
        <Text style={styles.amountValue}>{price}€</Text>
        <Text style={styles.amountSub}>Paiement sécurisé par Stripe</Text>
      </View>

      {/* Formulaire carte */}
      <View style={styles.formCard}>
        {/* Nom sur la carte */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Nom sur la carte</Text>
          <TextInput
            style={styles.input}
            placeholder="JEAN DUPONT"
            placeholderTextColor={COLORS.textSecond}
            value={name}
            onChangeText={(v) => setName(v.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>

        {/* Numéro de carte */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Numéro de carte</Text>
          <View style={styles.cardInputWrap}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="4242 4242 4242 4242"
              placeholderTextColor={COLORS.textSecond}
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              keyboardType="numeric"
              maxLength={19}
            />
            <Text style={styles.cardIcon}>💳</Text>
          </View>
        </View>

        {/* Expiry + CVC */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Date d'expiration</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/AA"
              placeholderTextColor={COLORS.textSecond}
              value={expiry}
              onChangeText={(v) => setExpiry(formatExpiry(v))}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>CVC</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor={COLORS.textSecond}
              value={cvc}
              onChangeText={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      {/* Info carte de test */}
      <View style={styles.testCard}>
        <Text style={styles.testTitle}>💡 Carte de test Stripe</Text>
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>Numéro</Text>
          <Text style={styles.testValue}>4242 4242 4242 4242</Text>
        </View>
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>Date</Text>
          <Text style={styles.testValue}>N'importe quelle date future</Text>
        </View>
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>CVC</Text>
          <Text style={styles.testValue}>N'importe quels 3 chiffres</Text>
        </View>
      </View>

      {/* Bouton payer */}
      <TouchableOpacity
        style={[styles.payBtn, loading && { opacity: 0.7 }]}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.payBtnText}>🔒 Payer {price}€</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.secureText}>
        🔒 Paiement sécurisé SSL — Powered by Stripe
      </Text>
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
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: COLORS.textSecond, marginBottom: 24 },
  amountCard: {
    backgroundColor: "#EBF4FF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#B8D4F0",
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
  },
  amountSub: { fontSize: 11, color: COLORS.textSecond },
  formCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cardInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    paddingRight: 12,
  },
  cardIcon: { fontSize: 20 },
  rowFields: { flexDirection: "row", gap: 12 },
  testCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FAC775",
  },
  testTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#854F0B",
    marginBottom: 8,
  },
  testRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  testLabel: { fontSize: 11, color: "#854F0B" },
  testValue: { fontSize: 11, color: "#633806", fontWeight: "600" },
  payBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  payBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
  secureText: { fontSize: 11, color: COLORS.textSecond, textAlign: "center" },
});
