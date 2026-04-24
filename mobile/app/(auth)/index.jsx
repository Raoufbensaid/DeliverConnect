import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";

export default function AuthIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DeliverConnect</Text>
      <Text style={styles.subtitle}>La livraison collaborative</Text>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.btnPrimaryText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.btnSecondaryText}>Créer un compte</Text>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecond,
    marginBottom: 48,
  },
  btnPrimary: {
    width: "100%",
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  btnSecondary: {
    width: "100%",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
