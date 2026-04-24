import { useState } from "react";
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

export default function Step3() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleNext = () => {
    if (!firstName || !lastName || !phone || !street || !city || !postalCode) {
      alert("Remplis tous les champs");
      return;
    }
    router.push({
      pathname: "/(client)/send/step4",
      params: {
        ...params,
        recipientFirstName: firstName,
        recipientLastName: lastName,
        recipientPhone: phone,
        recipientStreet: street,
        recipientCity: city,
        recipientPostalCode: postalCode,
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
        <Text style={styles.title}>Destinataire</Text>
        <Text style={styles.subtitle}>Étape 3 sur 5</Text>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= 3 && styles.progressDotActive]}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Informations personnelles</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Prénom"
            placeholderTextColor={COLORS.textSecond}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Nom"
            placeholderTextColor={COLORS.textSecond}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          placeholderTextColor={COLORS.textSecond}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionLabel}>Adresse de livraison</Text>

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
