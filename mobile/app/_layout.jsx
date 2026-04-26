import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { registerForPushNotifications } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(livreur)/delivering"
          options={{ gestureEnabled: false, headerShown: false }}
        />
      </Stack>
    </>
  );
}
