import { useState } from "react";
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
import { COLORS } from "../../../constants/colors";
import api from "../../../services/api";

export default function Step5() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (!result.canceled) {
      setPhoto(result.assets[0]);
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
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert(
        "Photo requise",
        "Prends une photo de ton colis avant de continuer",
      );
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("size", params.size);
      formData.append(
        "weight",
        params.weight ? String(parseFloat(params.weight)) : "1",
      );
      formData.append("fragile", params.fragile);
      formData.append("urgent", params.urgent);
      formData.append("description", params.description || "");
      formData.append(
        "sender",
        JSON.stringify({
          firstName: params.senderFirstName,
          lastName: params.senderLastName,
          phone: params.senderPhone,
          address: {
            street: params.senderStreet,
            city: params.senderCity,
            postalCode: params.senderPostalCode,
          },
        }),
      );
      formData.append(
        "recipient",
        JSON.stringify({
          firstName: params.recipientFirstName,
          lastName: params.recipientLastName,
          phone: params.recipientPhone,
          address: {
            street: params.recipientStreet,
            city: params.recipientCity,
            postalCode: params.recipientPostalCode,
          },
        }),
      );
      formData.append("photo", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "parcel.jpg",
      });

      const res = await api.post("/parcels", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.replace({
        pathname: "/(client)/send/confirmation",
        params: { parcelId: res.data.parcel._id },
      });
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.message || "Erreur lors de la création",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Photo du colis</Text>
      <Text style={styles.subtitle}>Étape 5 sur 5</Text>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.progressDot, styles.progressDotActive]}
          />
        ))}
      </View>

      <Text style={styles.hint}>
        Prenez une photo claire de votre colis. Elle sera visible par les
        livreurs.
      </Text>

      {/* Zone photo */}
      {photo ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderIcon}>📷</Text>
          <Text style={styles.photoPlaceholderText}>
            Aucune photo sélectionnée
          </Text>
        </View>
      )}

      {/* Boutons photo */}
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
          <Text style={styles.photoBtnIcon}>📷</Text>
          <Text style={styles.photoBtnText}>Prendre une photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnIcon}>🖼️</Text>
          <Text style={styles.photoBtnText}>Choisir depuis la galerie</Text>
        </TouchableOpacity>
      </View>

      {/* Récapitulatif final */}
      <View style={styles.recapCard}>
        <Text style={styles.recapTitle}>Récapitulatif final</Text>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>De</Text>
          <Text style={styles.recapValue}>{params.senderCity}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>À</Text>
          <Text style={styles.recapValue}>{params.recipientCity}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Distance</Text>
          <Text style={styles.recapValue}>{params.distanceKm} km</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Prix total</Text>
          <Text
            style={[
              styles.recapValue,
              { color: COLORS.primary, fontWeight: "700" },
            ]}
          >
            {params.price}€
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitBtnText}>Publier l'annonce 🚀</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: COLORS.white,
    paddingTop: 60,
  },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: COLORS.textSecond, marginBottom: 16 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayBorder,
  },
  progressDotActive: { backgroundColor: COLORS.primary },
  hint: {
    fontSize: 13,
    color: COLORS.textSecond,
    marginBottom: 20,
    lineHeight: 18,
  },
  photoContainer: { alignItems: "center", marginBottom: 16 },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 10,
  },
  changePhotoBtn: {
    padding: 8,
  },
  changePhotoText: { fontSize: 13, color: COLORS.primary },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.grayBorder,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { fontSize: 13, color: COLORS.textSecond },
  photoButtons: { flexDirection: "row", gap: 12, marginBottom: 20 },
  photoBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: "center",
    gap: 6,
  },
  photoBtnIcon: { fontSize: 24 },
  photoBtnText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "500",
  },
  recapCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  recapTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecond,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  recapLabel: { fontSize: 13, color: COLORS.textSecond },
  recapValue: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
