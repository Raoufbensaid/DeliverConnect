import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getToken, getUser } from "../store/auth";
import { COLORS } from "../constants/colors";
import Svg, {
  Circle,
  Path,
  Rect,
  Line,
  Polygon,
  Text as SvgText,
  TSpan,
} from "react-native-svg";

function LogoIcon({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Hexagone principal */}
      <Polygon
        points="100,18 145,43 145,93 100,118 55,93 55,43"
        fill="#1A56DB"
      />
      {/* Hexagone intérieur */}
      <Polygon
        points="100,30 135,50 135,90 100,110 65,90 65,50"
        fill="none"
        stroke="#378ADD"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Route verte */}
      <Path
        d="M68 75 Q88 58 108 68 Q128 78 142 65"
        fill="none"
        stroke="#48BB78"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Point départ */}
      <Circle cx="68" cy="75" r="7" fill="#63B3ED" />
      <Circle cx="68" cy="75" r="3" fill="white" />
      {/* Camion */}
      <Rect x="108" y="58" width="22" height="14" rx="3" fill="white" />
      <Rect x="126" y="61" width="10" height="11" rx="2" fill="#63B3ED" />
      <Circle cx="114" cy="73" r="4" fill="#0A1628" />
      <Circle cx="114" cy="73" r="2" fill="#48BB78" />
      <Circle cx="129" cy="73" r="4" fill="#0A1628" />
      <Circle cx="129" cy="73" r="2" fill="#48BB78" />
      {/* Flèche destination */}
      <Circle cx="142" cy="65" r="9" fill="#48BB78" />
      <Path d="M138 65 L142 61 L146 65 L142 69 Z" fill="white" />
      {/* Étoiles */}
      <Circle cx="82" cy="48" r="2.5" fill="#F6AD55" opacity="0.8" />
      <Circle cx="118" cy="44" r="2" fill="#F6AD55" opacity="0.6" />
      {/* Traînées de vitesse */}
      <Line
        x1="55"
        y1="68"
        x2="40"
        y2="65"
        stroke="#63B3ED"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <Line
        x1="54"
        y1="75"
        x2="37"
        y2="75"
        stroke="#63B3ED"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <Line
        x1="55"
        y1="82"
        x2="40"
        y2="85"
        stroke="#63B3ED"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Anneau vitesse */}
      <Path
        d="M42 55 A62 62 0 0 1 158 55"
        fill="none"
        stroke="#1A56DB"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M38 65 A68 68 0 0 1 162 65"
        fill="none"
        stroke="#378ADD"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
    </Svg>
  );
}

export default function Index() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Vérification auth après l'animation
    const checkAuth = async () => {
      await new Promise((r) => setTimeout(r, 3000)); // laisse le splash s'afficher
      const token = await getToken();
      const user = await getUser();

      if (token && user) {
        if (user.role === "client") router.replace("/(client)");
        else if (user.role === "livreur") router.replace("/(livreur)");
        else router.replace("/(auth)");
      } else {
        router.replace("/(auth)");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo animé */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LogoIcon size={500} />
      </Animated.View>

      {/* Texte animé */}
      <Animated.View
        style={[
          styles.textWrap,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>
          Deliver<Text style={styles.titleBlue}>Connect</Text>
        </Text>
        <Text style={styles.tagline}>MARKETPLACE DE LIVRAISON</Text>
      </Animated.View>

      {/* Indicateur de chargement animé */}
      <Animated.View style={[styles.loadingWrap, { opacity: fadeAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill]} />
        </View>
        <Text style={styles.loadingText}>Chargement...</Text>
      </Animated.View>

      {/* Badge bas de page */}
      <Animated.View style={[styles.badge, { opacity: fadeAnim }]}>
        <Text style={styles.badgeText}>By Raouf</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1628",
    gap: 16,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    height: 160,
    borderRadius: 40,
    backgroundColor: "#0D1F3C",
    borderWidth: 1,
    borderColor: "#1A2848",
    marginBottom: 8,
  },
  textWrap: {
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#F0F4FF",
    letterSpacing: -0.5,
  },
  titleBlue: {
    color: "#63B3ED",
  },
  tagline: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A5568",
    letterSpacing: 3,
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  loadingBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#1A2848",
    overflow: "hidden",
  },
  loadingFill: {
    width: "60%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#1A56DB",
  },
  loadingText: {
    fontSize: 12,
    color: "#4A5568",
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    bottom: 48,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#0D1F3C",
    borderWidth: 1,
    borderColor: "#1A2848",
  },
  badgeText: {
    fontSize: 11,
    color: "#4A5568",
    fontWeight: "600",
    letterSpacing: 1,
  },
});
