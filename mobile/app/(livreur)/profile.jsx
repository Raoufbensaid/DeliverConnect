import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { getUser, saveUser } from "../../store/auth";
import api from "../../services/api";

export default function LivreurProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await getUser();
      setUser(u);
      setFirstName(u?.firstName || "");
      setLastName(u?.lastName || "");
      setPhone(u?.phone || "");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/users/profile", {
        firstName,
        lastName,
        phone,
      });
      await saveUser(res.data.user);
      setUser(res.data.user);
      setEditing(false);
      Alert.alert("✅ Succès", "Profil mis à jour avec succès");
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Erreur lors de la mise à jour",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mon profil</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: COLORS.success }]}>
            <Text style={styles.avatarText}>
              {firstName?.[0]}
              {lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.avatarName}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.avatarRole}>🚗 Livreur</Text>
        </View>

        {/* Infos personnelles */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editBtn}>✏️ Modifier</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                placeholderTextColor={COLORS.textSecond}
              />
            ) : (
              <Text style={styles.fieldValue}>{firstName}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                placeholderTextColor={COLORS.textSecond}
              />
            ) : (
              <Text style={styles.fieldValue}>{lastName}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Téléphone</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Téléphone"
                placeholderTextColor={COLORS.textSecond}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{phone}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={[styles.fieldValue, { color: COLORS.textSecond }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Infos pro (lecture seule) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations professionnelles</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>SIRET</Text>
            <Text style={styles.fieldValue}>{user?.siret || "—"}</Text>
          </View>
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>IBAN</Text>
            <Text style={styles.fieldValue}>
              {user?.iban ? `****${user.iban.slice(-4)}` : "—"}
            </Text>
          </View>
        </View>

        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditing(false);
                setFirstName(user?.firstName || "");
                setLastName(user?.lastName || "");
                setPhone(user?.phone || "");
              }}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 24,
  },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: COLORS.white },
  avatarName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  avatarRole: { fontSize: 13, color: COLORS.textSecond },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  editBtn: { fontSize: 13, color: COLORS.primary },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  fieldLabel: { fontSize: 13, color: COLORS.textSecond, flex: 1 },
  fieldValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  input: {
    flex: 2,
    textAlign: "right",
    fontSize: 14,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
  },
  editActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cancelBtnText: { fontSize: 14, color: COLORS.textSecond },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.success,
  },
  saveBtnText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
});
