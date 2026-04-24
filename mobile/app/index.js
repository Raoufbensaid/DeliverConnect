import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getToken, getUser } from "../store/auth";
import { COLORS } from "../constants/colors";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const user = await getUser();

      if (token && user) {
        if (user.role === "client") {
          router.replace("/(client)");
        } else if (user.role === "livreur") {
          router.replace("/(livreur)");
        }
      } else {
        router.replace("/(auth)");
      }
    };
    checkAuth();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.white,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
