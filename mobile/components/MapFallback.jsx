import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useRef, useEffect } from "react";
import { COLORS } from "../constants/colors";

export default function MapFallback({
  height = 280,
  originLat,
  originLng,
  destLat,
  destLng,
  points = [],
  livreurPos = null, // ← nouvelle prop
}) {
  const webViewRef = useRef(null);

  // Envoyer la position du livreur en temps réel
  useEffect(() => {
    if (livreurPos && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "livreur_position",
          lat: livreurPos.latitude,
          lng: livreurPos.longitude,
        }),
      );
    }
  }, [livreurPos]);

  const buildHTML = () => {
    const centerLat = originLat || points[0]?.lat || 48.8566;
    const centerLng = originLng || points[0]?.lng || 2.3522;

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

    // Marqueur livreur en temps réel
    var livreurMarker = null
    var livreurPath   = []
    var livreurPolyline = null

    // Écouter les messages de React Native
    document.addEventListener('message', function(e) {
      handleMessage(e.data)
    })
    window.addEventListener('message', function(e) {
      handleMessage(e.data)
    })

    function handleMessage(data) {
      try {
        var msg = JSON.parse(data)
        if (msg.type === 'livreur_position') {
          var latlng = [msg.lat, msg.lng]

          // La première fois qu'on reçoit une position — efface le tracé de base
          if (livreurPath.length === 0 && polyline) {
            map.removeLayer(polyline)
          }

          // Mettre à jour ou créer le marqueur livreur
          if (livreurMarker) {
            livreurMarker.setLatLng(latlng)
          } else {
            livreurMarker = L.marker(latlng, {
              icon: L.divIcon({
                className: '',
                html: '<div style="background:#FF6B35;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:10px;">🚗</div>',
                iconSize: [20, 20],
              })
            }).addTo(map).bindPopup('Livreur')
          }

          // Tracer le chemin du livreur
          livreurPath.push(latlng)
          if (livreurPolyline) {
            livreurPolyline.setLatLngs(livreurPath)
          } else {
            livreurPolyline = L.polyline(livreurPath, {
              color: '#FF6B35',
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 5',
            }).addTo(map)
          }

          // Centrer la carte sur le livreur
          map.panTo(latlng)
        }
      } catch(e) {}
    }
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
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
