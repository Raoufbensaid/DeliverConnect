const axios = require("axios");

// Convertir une adresse en coordonnées GPS
const geocodeAddress = async (address) => {
  const query = `${address.street}, ${address.postalCode} ${address.city}, France`;
  const response = await axios.get(
    "https://api.openrouteservice.org/geocode/search",
    {
      params: {
        api_key: process.env.ORS_API_KEY,
        text: query,
        "boundary.country": "FR",
        size: 1,
      },
    },
  );
  const features = response.data.features;
  if (!features || features.length === 0) {
    throw new Error(`Adresse introuvable : ${query}`);
  }
  const [lng, lat] = features[0].geometry.coordinates;
  return { lat, lng };
};

// Calculer la distance routière entre deux adresses en km
const calculateDistance = async (pickupAddress, deliveryAddress) => {
  const [pickup, delivery] = await Promise.all([
    geocodeAddress(pickupAddress),
    geocodeAddress(deliveryAddress),
  ]);

  const response = await axios.post(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      coordinates: [
        [pickup.lng, pickup.lat],
        [delivery.lng, delivery.lat],
      ],
    },
    {
      headers: {
        Authorization: process.env.ORS_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const meters = response.data.routes[0].summary.distance;
  const km = Math.round((meters / 1000) * 10) / 10;

  return {
    km,
    pickupCoords: { lat: pickup.lat, lng: pickup.lng },
    deliveryCoords: { lat: delivery.lat, lng: delivery.lng },
  };
};

module.exports = { calculateDistance };
