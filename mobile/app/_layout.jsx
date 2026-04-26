import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "react-error-boundary";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { registerForPushNotifications } from "../services/notifications";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>❌ Erreur détectée</Text>
      <Text style={styles.errorMessage}>{error?.message}</Text>
      <Text style={styles.errorStack}>{error?.stack?.slice(0, 300)}</Text>
      <TouchableOpacity style={styles.errorBtn} onPress={resetErrorBoundary}>
        <Text style={styles.errorBtnText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(livreur)/delivering"
          options={{ gestureEnabled: false, headerShown: false }}
        />
      </Stack>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    marginBottom: 12,
  },
  errorMessage: { fontSize: 14, color: "#333", marginBottom: 12 },
  errorStack: { fontSize: 10, color: "#666", marginBottom: 20 },
  errorBtn: {
    backgroundColor: "#378ADD",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  errorBtnText: { color: "#fff", fontWeight: "600" },
});
