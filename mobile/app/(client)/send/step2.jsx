import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../../constants/colors";
import { getUser } from "../../../store/auth";

export default function Step2() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Remplissage automatique depuis le compte
  useEffect(() => {
    const loadUser = async () => {
      const user = await getUser();
      if (user) {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.phone || "");
      }
    };
    loadUser();
  }, []);

  const handleNext = () => {
    if (!firstName || !lastName || !phone || !street || !city || !postalCode) {
      alert("Remplis tous les champs");
      return;
    }
    router.push({
      pathname: "/(client)/send/step3",
      params: {
        ...params,
        senderFirstName: firstName,
        senderLastName: lastName,
        senderPhone: phone,
        senderStreet: street,
        senderCity: city,
        senderPostalCode: postalCode,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expéditeur</Text>
        <Text style={styles.subtitle}>Étape 2 sur 5</Text>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= 2 && styles.progressDotActive]}
            />
          ))}
        </View>

        {/* Infos personnelles auto-remplies */}
        <Text style={styles.sectionLabel}>Informations personnelles</Text>
        <View style={styles.autoFilledBox}>
          <Text style={styles.autoFilledNote}>
            ✅ Rempli automatiquement depuis votre compte
          </Text>
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }, styles.autoFilled]}
            placeholder="Prénom"
            placeholderTextColor={COLORS.textSecond}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, { flex: 1 }, styles.autoFilled]}
            placeholder="Nom"
            placeholderTextColor={COLORS.textSecond}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          style={[styles.input, styles.autoFilled]}
          placeholder="Numéro de téléphone"
          placeholderTextColor={COLORS.textSecond}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Adresse */}
        <Text style={styles.sectionLabel}>Adresse d'enlèvement</Text>

        <TextInput
          style={styles.input}
          placeholder="Rue et numéro"
          placeholderTextColor={COLORS.textSecond}
          value={street}
          onChangeText={setStreet}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Code postal"
            placeholderTextColor={COLORS.textSecond}
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Ville"
            placeholderTextColor={COLORS.textSecond}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Continuer →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  subtitle: { fontSize: 13, color: COLORS.textSecond, marginBottom: 16 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 28 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayBorder,
  },
  progressDotActive: { backgroundColor: COLORS.primary },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  autoFilledBox: {
    backgroundColor: "#EAF3DE",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  autoFilledNote: {
    fontSize: 12,
    color: "#27500A",
  },
  autoFilled: {
    backgroundColor: "#F0F7FF",
    borderColor: "#B8D4F0",
  },
  input: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  row: { flexDirection: "row", gap: 10 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
