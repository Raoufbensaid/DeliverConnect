// Carte OpenStreetMap via WebView — fonctionne sur iOS et Android sans build natif
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../constants/colors";

export default function MapFallback({
  height = 280,
  originLat,
  originLng,
  destLat,
  destLng,
  points = [],
}) {
  // Construire les marqueurs et le tracé
  const buildHTML = () => {
    const centerLat = originLat || points[0]?.lat || 48.8566;
    const centerLng = originLng || points[0]?.lng || 2.3522;

    // Construire les points du tracé GPX
    const polylinePoints =
      points.length > 0
        ? points
            .filter((p) => !p.isPause)
            .map((p) => `[${p.lat}, ${p.lng}]`)
            .join(",")
        : originLat && destLat
          ? `[${originLat}, ${originLng}], [${destLat}, ${destLng}]`
          : "";

    const markersJS = [];

    if (originLat && originLng) {
      markersJS.push(`
        L.marker([${originLat}, ${originLng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#378ADD;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
          })
        }).addTo(map).bindPopup('Départ')
      `);
    }

    if (destLat && destLng) {
      markersJS.push(`
        L.marker([${destLat}, ${destLng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#1D9E75;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
          })
        }).addTo(map).bindPopup('Arrivée')
      `);
    }

    // Marqueurs du tracé
    if (points.length > 0) {
      const first = points[0];
      const last = points[points.length - 1];
      markersJS.push(`
        L.marker([${first.lat}, ${first.lng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#378ADD;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
          })
        }).addTo(map).bindPopup('Départ')
      `);
      markersJS.push(`
        L.marker([${last.lat}, ${last.lng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#1D9E75;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
          })
        }).addTo(map).bindPopup('Arrivée')
      `);
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 13)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    ${markersJS.join("\n")}

    ${
      polylinePoints
        ? `
      var polyline = L.polyline([${polylinePoints}], {
        color: '#378ADD',
        weight: 4,
        opacity: 0.8,
      }).addTo(map)
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] })
    `
        : ""
    }
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: buildHTML() }}
        style={styles.webview}
        scrollEnabled={false}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: "hidden" },
  webview: { flex: 1 },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
  },
});
