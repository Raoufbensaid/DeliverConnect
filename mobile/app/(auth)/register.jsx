import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { saveToken, saveUser } from "../../store/auth";
import api from "../../services/api";

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState("client");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [siret, setSiret] = useState("");
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      Alert.alert("Erreur", "Remplis tous les champs obligatoires");
      return;
    }
    if (role === "livreur" && (!siret || !iban)) {
      Alert.alert(
        "Erreur",
        "Le SIRET et l'IBAN sont obligatoires pour un livreur",
      );
      return;
    }
    setLoading(true);
    try {
      const body = { role, firstName, lastName, email, phone, password };
      if (role === "livreur") {
        body.siret = siret;
        body.iban = iban;
      }
      const res = await api.post("/auth/register", body);
      await saveToken(res.data.token);
      await saveUser(res.data.user);

      if (res.data.user.role === "client") {
        router.replace("/(client)");
      } else {
        router.replace("/(livreur)");
      }
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créer un compte</Text>

        {/* Choix du rôle */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "client" && styles.roleBtnActive]}
            onPress={() => setRole("client")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "client" && styles.roleBtnTextActive,
              ]}
            >
              📦 Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === "livreur" && styles.roleBtnActive]}
            onPress={() => setRole("livreur")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "livreur" && styles.roleBtnTextActive,
              ]}
            >
              🚗 Livreur
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor={COLORS.textSecond}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor={COLORS.textSecond}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textSecond}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          placeholderTextColor={COLORS.textSecond}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.textSecond}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Champs livreur uniquement */}
        {role === "livreur" && (
          <>
            <Text style={styles.sectionLabel}>
              Informations professionnelles
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Numéro SIRET (14 chiffres)"
              placeholderTextColor={COLORS.textSecond}
              value={siret}
              onChangeText={setSiret}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="IBAN"
              placeholderTextColor={COLORS.textSecond}
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Créer mon compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 24,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    backgroundColor: COLORS.grayLight,
  },
  roleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EBF4FF",
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecond,
  },
  roleBtnTextActive: {
    color: COLORS.primary,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecond,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    textAlign: "center",
    color: COLORS.primary,
    fontSize: 14,
  },
});
