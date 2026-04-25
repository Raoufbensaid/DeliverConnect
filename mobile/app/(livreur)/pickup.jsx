import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { COLORS } from "../../constants/colors";
import api from "../../services/api";

export default function Pickup() {
  const router = useRouter();
  const { parcelId } = useLocalSearchParams();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [locationOk, setLocationOk] = useState(false);

  // Vérifier la permission de localisation au démarrage
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // const checkLocationPermission = async () => {
  //   setChecking(true);
  //   try {
  //     const { status } = await Location.getBackgroundPermissionsAsync();
  //     if (status === "granted") {
  //       setLocationOk(true);
  //     } else {
  //       setLocationOk(false);
  //     }
  //   } catch {
  //     setLocationOk(false);
  //   } finally {
  //     setChecking(false);
  //   }
  // };

  // const requestLocationPermission = async () => {
  //   try {
  //     // D'abord demander la permission de base
  //     const { status: fgStatus } =
  //       await Location.requestForegroundPermissionsAsync();
  //     if (fgStatus !== "granted") {
  //       Alert.alert(
  //         "Permission refusée",
  //         "La localisation est nécessaire pour suivre la livraison. Active-la dans les paramètres.",
  //         [
  //           { text: "Annuler", style: "cancel" },
  //           {
  //             text: "Paramètres",
  //             onPress: () => Location.enableNetworkProviderAsync(),
  //           },
  //         ],
  //       );
  //       return;
  //     }
  //     // Ensuite demander la permission en arrière-plan
  //     const { status: bgStatus } =
  //       await Location.requestBackgroundPermissionsAsync();
  //     if (bgStatus === "granted") {
  //       setLocationOk(true);
  //     } else {
  //       Alert.alert(
  //         "Permission arrière-plan requise",
  //         'Pour suivre la livraison en temps réel, sélectionne "Toujours" dans les paramètres de localisation.',
  //         [
  //           { text: "Annuler", style: "cancel" },
  //           {
  //             text: "Ouvrir les paramètres",
  //             onPress: () => Location.enableNetworkProviderAsync(),
  //           },
  //         ],
  //       );
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const checkLocationPermission = async () => {
    setChecking(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationOk(true);
      } else {
        setLocationOk(false);
      }
    } catch {
      // Sur Expo Go iOS, on ignore l'erreur et on laisse passer
      setLocationOk(true);
    } finally {
      setChecking(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationOk(true);
      } else {
        Alert.alert(
          "Permission refusée",
          "Active la localisation dans les paramètres de ton téléphone.",
          [{ text: "OK" }],
        );
      }
    } catch {
      // Sur Expo Go iOS, on ignore et on laisse passer
      setLocationOk(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Autorise l'accès à ta caméra dans les paramètres",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Autorise l'accès à ta galerie dans les paramètres",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleConfirmPickup = async () => {
    if (!locationOk) {
      Alert.alert(
        "⚠️ Localisation requise",
        'Tu dois autoriser la localisation "Toujours" avant de valider la prise en charge.',
        [{ text: "OK" }],
      );
      return;
    }
    if (!photo) {
      Alert.alert(
        "Photo requise",
        "Prends une photo du colis avant de valider",
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("parcelId", parcelId);
      formData.append("photo", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "pickup.jpg",
      });

      const res = await api.post("/deliveries/pickup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const deliveryId = res.data.delivery.id;
      const validationCode = res.data.validationCode;

      router.replace({
        pathname: "/(livreur)/delivering",
        params: { parcelId, deliveryId, validationCode },
      });
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Erreur lors de la prise en charge",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.checkingText}>
          Vérification de la localisation...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Prise en charge</Text>
        <Text style={styles.subtitle}>
          Confirme que tu as récupéré le colis
        </Text>

        {/* Localisation */}
        <View style={[styles.card, !locationOk && styles.cardWarning]}>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>{locationOk ? "✅" : "⚠️"}</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>
                {locationOk ? "Localisation activée" : "Localisation requise"}
              </Text>
              <Text style={styles.locationDesc}>
                {locationOk
                  ? "Le suivi GPS est prêt — le client pourra suivre ta livraison en temps réel"
                  : 'Active la localisation "Toujours" pour que le client puisse suivre sa livraison'}
              </Text>
            </View>
          </View>
          {!locationOk && (
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={requestLocationPermission}
            >
              <Text style={styles.locationBtnText}>
                Activer la localisation →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📷 Photo du colis</Text>
          <Text style={styles.cardDesc}>
            Prends une photo du colis pour confirmer la prise en charge. Elle
            servira de preuve horodatée.
          </Text>

          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={takePhoto}
              >
                <Text style={styles.changePhotoText}>Reprendre la photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
            </View>
          )}

          <View style={styles.photoBtns}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>Caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info code OTP */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💬</Text>
          <Text style={styles.infoText}>
            Après confirmation, un code à 4 chiffres sera envoyé par SMS au
            destinataire. Tu devras saisir ce code à la livraison.
          </Text>
        </View>
      </ScrollView>

      {/* Bouton confirmer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!locationOk || !photo || loading) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirmPickup}
          disabled={!locationOk || !photo || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              ✅ Confirmer la prise en charge
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  checkingText: { fontSize: 14, color: COLORS.textSecond, marginTop: 12 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: COLORS.textSecond, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cardWarning: { borderColor: "#FAC775", backgroundColor: "#FFFBF0" },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecond,
    marginBottom: 14,
    lineHeight: 18,
  },
  locationRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  locationIcon: { fontSize: 24, marginTop: 2 },
  locationInfo: { flex: 1 },
  locationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  locationDesc: { fontSize: 12, color: COLORS.textSecond, lineHeight: 17 },
  locationBtn: {
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  locationBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  photoContainer: { alignItems: "center", marginBottom: 10 },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  changePhotoBtn: { padding: 6 },
  changePhotoText: { fontSize: 13, color: COLORS.primary },
  photoPlaceholder: {
    height: 140,
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grayBorder,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  photoIcon: { fontSize: 36, marginBottom: 6 },
  photoPlaceholderText: { fontSize: 13, color: COLORS.textSecond },
  photoBtns: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: "center",
    gap: 4,
  },
  photoBtnIcon: { fontSize: 20 },
  photoBtnText: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EBF4FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#B8D4F0",
  },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: COLORS.gray, opacity: 0.6 },
  confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
