import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log("Notifications : appareil virtuel détecté");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission notifications refusée");
      return null;
    }

    // Récupérer le token — peut échouer sur Expo Go sans projectId
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Token push:", token);
      await AsyncStorage.setItem("pushToken", token);
      try {
        await api.post("/users/push-token", { token });
      } catch {}

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      return token;
    } catch (tokenError) {
      // Sur Expo Go, cette erreur est normale — les notifications
      // fonctionneront avec un vrai build
      console.log(
        "Notifications push non disponibles sur Expo Go — utilise un build de développement",
      );
      return null;
    }
  } catch (err) {
    console.log("Erreur notifications:", err.message);
    return null;
  }
};
