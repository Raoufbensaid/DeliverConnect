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
import { useRouter } from "expo-router";
import { COLORS } from "../../../constants/colors";

const SIZES = [
  { id: "s", label: "S", desc: "Livre, chaussures", dims: "20×15×10 cm" },
  {
    id: "m",
    label: "M",
    desc: "Vêtements, petit électro",
    dims: "35×25×15 cm",
  },
  { id: "l", label: "L", desc: "Valise cabine, carton", dims: "50×40×30 cm" },
  { id: "xl", label: "XL", desc: "Carton déménagement", dims: "80×60×40 cm" },
  { id: "xxl", label: "XXL", desc: "Vélo, meuble", dims: "120×80×60 cm" },
];

export default function Step1() {
  const router = useRouter();
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState("");
  const [fragile, setFragile] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [description, setDescription] = useState("");

  const handleNext = () => {
    if (!size) {
      alert("Choisis une taille");
      return;
    }
    if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
      alert("Indique un poids valide (ex: 2.5)");
      return;
    }
    router.push({
      pathname: "/(client)/send/step2",
      params: {
        size,
        weight: String(parseFloat(weight)),
        fragile: String(fragile),
        urgent: String(urgent),
        description,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mon colis</Text>
        <Text style={styles.subtitle}>Étape 1 sur 5</Text>

        {/* Progression */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i === 1 && styles.progressDotActive]}
            />
          ))}
        </View>

        {/* Taille */}
        <Text style={styles.label}>Taille du colis</Text>
        <Text style={styles.hint}>
          Choisissez la taille qui correspond le mieux à votre colis
        </Text>
        {SIZES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sizeCard, size === s.id && styles.sizeCardActive]}
            onPress={() => setSize(s.id)}
          >
            <View
              style={[
                styles.sizeBadge,
                size === s.id && styles.sizeBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.sizeBadgeText,
                  size === s.id && styles.sizeBadgeTextActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
            <View style={styles.sizeInfo}>
              <Text
                style={[
                  styles.sizeDesc,
                  size === s.id && { color: COLORS.primary },
                ]}
              >
                {s.desc}
              </Text>
              <Text style={styles.sizeDims}>{s.dims}</Text>
            </View>
            {size === s.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Poids */}
        <Text style={styles.label}>Poids (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2.5"
          placeholderTextColor={COLORS.textSecond}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        {/* Fragile / Urgent */}
        <Text style={styles.label}>Options</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionBtn, fragile && styles.optionBtnActive]}
            onPress={() => setFragile(!fragile)}
          >
            <Text style={styles.optionIcon}>⚠️</Text>
            <Text
              style={[styles.optionText, fragile && { color: COLORS.primary }]}
            >
              Fragile
            </Text>
            <Text style={styles.optionExtra}>+15%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionBtn, urgent && styles.optionBtnActiveUrgent]}
            onPress={() => setUrgent(!urgent)}
          >
            <Text style={styles.optionIcon}>⚡</Text>
            <Text
              style={[styles.optionText, urgent && { color: COLORS.danger }]}
            >
              Urgent
            </Text>
            <Text style={styles.optionExtra}>+25%</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Ex: Carton contenant des verres, à manipuler avec soin..."
          placeholderTextColor={COLORS.textSecond}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

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
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 16,
  },
  hint: { fontSize: 12, color: COLORS.textSecond, marginBottom: 10 },
  sizeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    marginBottom: 8,
    backgroundColor: COLORS.grayLight,
  },
  sizeCardActive: { borderColor: COLORS.primary, backgroundColor: "#EBF4FF" },
  sizeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.grayBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeBadgeActive: { backgroundColor: COLORS.primary },
  sizeBadgeText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecond },
  sizeBadgeTextActive: { color: COLORS.white },
  sizeInfo: { flex: 1 },
  sizeDesc: { fontSize: 13, fontWeight: "500", color: COLORS.text },
  sizeDims: { fontSize: 11, color: COLORS.textSecond, marginTop: 2 },
  checkmark: { fontSize: 18, color: COLORS.primary },
  input: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  textarea: { height: 90, textAlignVertical: "top" },
  optionsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  optionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    backgroundColor: COLORS.grayLight,
    gap: 4,
  },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: "#EBF4FF" },
  optionBtnActiveUrgent: {
    borderColor: COLORS.danger,
    backgroundColor: "#FFF0EC",
  },
  optionIcon: { fontSize: 20 },
  optionText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  optionExtra: { fontSize: 11, color: COLORS.textSecond },
  nextBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
