const { Expo } = require("expo-server-sdk");
const expo = new Expo();

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Token push invalide : ${expoPushToken}`);
    return;
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
      console.log(`✅ Notification envoyée : ${title}`);
    }
  } catch (error) {
    console.error("Erreur notification push:", error);
  }
};

module.exports = { sendPushNotification };
