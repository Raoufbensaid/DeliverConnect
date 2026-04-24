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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      await saveToken(res.data.token);
      await saveUser(res.data.user);

      if (res.data.user.role === "client") {
        router.replace("/(client)");
      } else if (res.data.user.role === "livreur") {
        router.replace("/(livreur)");
      }
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Email ou mot de passe incorrect",
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
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Bienvenue sur DeliverConnect</Text>

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
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.textSecond}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecond,
    marginBottom: 32,
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
