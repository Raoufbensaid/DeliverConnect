import { View, Text, StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";
import Constants from "expo-constants";

// Vérifie si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

let MapViewComponent = null;
let MarkerComponent = null;
let PolylineComponent = null;

if (!isExpoGo) {
  try {
    const Maps = require("react-native-maps");
    MapViewComponent = Maps.default;
    MarkerComponent = Maps.Marker;
    PolylineComponent = Maps.Polyline;
  } catch {}
}

export const Marker = MarkerComponent;
export const Polyline = PolylineComponent;

export default function SafeMapView({ style, children, ...props }) {
  if (isExpoGo || !MapViewComponent) {
    return (
      <View style={[style, styles.fallback]}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.text}>Carte non disponible sur Expo Go</Text>
        <Text style={styles.sub}>
          Installe l'APK Android pour voir la carte en temps réel
        </Text>
      </View>
    );
  }

  return (
    <MapViewComponent style={style} {...props}>
      {children}
    </MapViewComponent>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.grayLight,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 48 },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecond,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
