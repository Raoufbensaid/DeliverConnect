// Composant d'autocomplétion d'adresse via l'API Adresse du gouvernement français
import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { COLORS } from "../constants/colors";

export default function AddressInput({
  onAddressSelect,
  placeholder = "Rechercher une adresse...",
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef(null);

  const searchAddress = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowList(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=6`;
        const response = await fetch(url);
        const data = await response.json();

        const features = data.features || [];
        const results = features
          .map((f) => ({
            label: f.properties.label,
            street: f.properties.name,
            city: f.properties.city,
            postalCode: f.properties.postcode,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }))
          .filter((r) => r.city && r.postalCode);

        setSuggestions(results);
        setShowList(results.length > 0);
      } catch (err) {
        console.error("Erreur autocomplétion:", err.message);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    setQuery(item.label);
    setSuggestions([]);
    setShowList(false);
    onAddressSelect({
      street: item.street,
      city: item.city,
      postalCode: item.postalCode,
      lat: item.lat,
      lng: item.lng,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecond}
          value={query}
          onChangeText={searchAddress}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        )}
      </View>

      {showList && (
        <View style={styles.suggestionsList}>
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="always"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index === suggestions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {item.street}
                  </Text>
                  <Text style={styles.suggestionSub}>
                    {item.postalCode} {item.city}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", zIndex: 999 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  loader: { marginRight: 12 },
  suggestionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  suggestionItemLast: { borderBottomWidth: 0 },
  suggestionIcon: { fontSize: 14 },
  suggestionText: { flex: 1 },
  suggestionMain: { fontSize: 13, fontWeight: "500", color: COLORS.text },
  suggestionSub: { fontSize: 11, color: COLORS.textSecond, marginTop: 2 },
});
