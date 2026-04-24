const Track = require("../models/Track.model");
const Delivery = require("../models/Delivery.model");
const Parcel = require("../models/Parcel.model");

// Convertir les points GPS en format GPX
const generateGPX = (track, delivererName) => {
  const points = track.points
    .map(
      (p) => `
    <trkpt lat="${p.lat}" lon="${p.lng}">
      <time>${new Date(p.timestamp).toISOString()}</time>
      ${p.isPause ? "<name>PAUSE</name>" : ""}
    </trkpt>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DeliverConnect">
  <metadata>
    <name>Livraison DeliverConnect</name>
    <time>${new Date(track.startedAt).toISOString()}</time>
  </metadata>
  <trk>
    <name>${delivererName}</name>
    <trkseg>${points}</trkseg>
  </trk>
</gpx>`;
};

// Calculer la distance entre deux points GPS (formule Haversine)
const haversineDistance = (p1, p2) => {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ================================
// @route   POST /api/tracks/start
// @desc    Démarrer le tracking
// @access  Privé (livreur)
// ================================
const startTracking = async (req, res) => {
  try {
    const { deliveryId, lat, lng } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison introuvable" });
    }

    // Créer le track
    const track = await Track.create({
      deliveryId,
      parcelId: delivery.parcelId,
      delivererId: req.user._id,
      clientId: delivery.clientId,
      status: "active",
      startedAt: new Date(),
      points: [
        {
          lat: Number(lat),
          lng: Number(lng),
          timestamp: new Date(),
          isPause: false,
        },
      ],
    });

    // Lier le track à la livraison
    delivery.trackId = track._id;
    await delivery.save();

    res.status(201).json({
      success: true,
      message: "Tracking démarré",
      trackId: track._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   POST /api/tracks/:id/point
// @desc    Ajouter un point GPS
// @access  Privé (livreur)
// ================================
const addPoint = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const track = await Track.findById(req.params.id);

    if (!track || track.status === "finished") {
      return res
        .status(404)
        .json({ success: false, message: "Track introuvable ou terminé" });
    }

    if (track.status === "paused") {
      return res
        .status(400)
        .json({ success: false, message: "Tracking en pause" });
    }

    const newPoint = {
      lat: Number(lat),
      lng: Number(lng),
      timestamp: new Date(),
      isPause: false,
    };

    track.points.push(newPoint);

    // Calculer la distance totale
    if (track.points.length > 1) {
      const prev = track.points[track.points.length - 2];
      track.totalDistanceKm += haversineDistance(prev, newPoint);
      track.totalDistanceKm = Math.round(track.totalDistanceKm * 100) / 100;
    }

    await track.save();

    // Émettre la position en temps réel via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`delivery_${track.parcelId}`).emit("location_update", {
        lat: newPoint.lat,
        lng: newPoint.lng,
        timestamp: newPoint.timestamp,
        trackId: track._id,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   PATCH /api/tracks/:id/pause
// @desc    Mettre en pause le tracking
// @access  Privé (livreur)
// ================================
const pauseTracking = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track || track.status !== "active") {
      return res
        .status(400)
        .json({ success: false, message: "Track non actif" });
    }

    track.status = "paused";
    track.pausedAt = new Date();

    // Ajouter un point de pause
    const lastPoint = track.points[track.points.length - 1];
    if (lastPoint) {
      track.points.push({
        lat: lastPoint.lat,
        lng: lastPoint.lng,
        timestamp: new Date(),
        isPause: true,
      });
    }

    await track.save();

    // Notifier les observateurs
    const io = req.app.get("io");
    if (io) {
      io.to(`delivery_${track.parcelId}`).emit("tracking_paused", {
        trackId: track._id,
        pausedAt: track.pausedAt,
      });
    }

    res.status(200).json({ success: true, message: "Tracking mis en pause" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   PATCH /api/tracks/:id/resume
// @desc    Reprendre le tracking
// @access  Privé (livreur)
// ================================
const resumeTracking = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const track = await Track.findById(req.params.id);

    if (!track || track.status !== "paused") {
      return res
        .status(400)
        .json({ success: false, message: "Track non en pause" });
    }

    // Calculer la durée de pause
    const pauseDuration = Math.round((new Date() - track.pausedAt) / 1000);
    track.pauseDuration += pauseDuration;
    track.status = "active";
    track.resumedAt = new Date();

    // Ajouter un point de reprise
    track.points.push({
      lat: Number(lat),
      lng: Number(lng),
      timestamp: new Date(),
      isPause: false,
    });

    await track.save();

    // Notifier les observateurs
    const io = req.app.get("io");
    if (io) {
      io.to(`delivery_${track.parcelId}`).emit("tracking_resumed", {
        trackId: track._id,
        resumedAt: track.resumedAt,
      });
    }

    res.status(200).json({ success: true, message: "Tracking repris" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   PATCH /api/tracks/:id/finish
// @desc    Terminer le tracking
// @access  Privé (livreur)
// ================================
const finishTracking = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id).populate(
      "delivererId",
      "firstName lastName",
    );

    if (!track) {
      return res
        .status(404)
        .json({ success: false, message: "Track introuvable" });
    }

    track.status = "finished";
    track.finishedAt = new Date();

    // Calculer durée totale et vitesse moyenne
    track.totalDuration = Math.round(
      (track.finishedAt - track.startedAt) / 1000,
    );
    const activeSeconds = track.totalDuration - track.pauseDuration;
    if (activeSeconds > 0 && track.totalDistanceKm > 0) {
      track.avgSpeedKmh =
        Math.round((track.totalDistanceKm / (activeSeconds / 3600)) * 10) / 10;
    }

    // Générer le GPX
    const delivererName = `${track.delivererId.firstName} ${track.delivererId.lastName}`;
    track.gpxData = generateGPX(track, delivererName);

    await track.save();

    // Notifier les observateurs
    const io = req.app.get("io");
    if (io) {
      io.to(`delivery_${track.parcelId}`).emit("tracking_finished", {
        trackId: track._id,
        finishedAt: track.finishedAt,
        totalDistanceKm: track.totalDistanceKm,
        totalDuration: track.totalDuration,
        avgSpeedKmh: track.avgSpeedKmh,
      });
    }

    res.status(200).json({
      success: true,
      message: "Tracking terminé",
      stats: {
        totalDistanceKm: track.totalDistanceKm,
        totalDuration: track.totalDuration,
        pauseDuration: track.pauseDuration,
        avgSpeedKmh: track.avgSpeedKmh,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/tracks/delivery/:deliveryId
// @desc    Récupérer le tracé d'une livraison
// @access  Privé (client, livreur, admin)
// ================================
const getTrackByDelivery = async (req, res) => {
  try {
    const track = await Track.findOne({ deliveryId: req.params.deliveryId })
      .populate("delivererId", "firstName lastName")
      .populate("parcelId", "sender recipient distanceKm price");

    if (!track) {
      return res
        .status(404)
        .json({ success: false, message: "Tracé introuvable" });
    }

    // Récupérer la livraison pour les horodatages
    const delivery = await Delivery.findById(req.params.deliveryId);

    res.status(200).json({
      success: true,
      track,
      timestamps: {
        pickupAt: delivery?.pickupAt,
        deliveredAt: delivery?.deliveredAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/tracks/history
// @desc    Historique des livraisons avec tracés
// @access  Privé (selon le rôle)
// ================================
const getHistory = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "livreur") {
      filter.delivererId = req.user._id;
    } else if (req.user.role === "client") {
      filter.clientId = req.user._id;
    }
    // admin → pas de filtre, voit tout

    const tracks = await Track.find({ ...filter, status: "finished" })
      .populate("parcelId", "sender recipient distanceKm price status")
      .populate("delivererId", "firstName lastName")
      .sort({ createdAt: -1 });

    // Enrichir avec les horodatages de livraison
    const history = await Promise.all(
      tracks.map(async (track) => {
        const delivery = await Delivery.findById(track.deliveryId);
        return {
          trackId: track._id,
          deliveryId: track.deliveryId,
          parcel: track.parcelId,
          deliverer: track.delivererId,
          startedAt: track.startedAt,
          finishedAt: track.finishedAt,
          pickupAt: delivery?.pickupAt,
          deliveredAt: delivery?.deliveredAt,
          totalDistanceKm: track.totalDistanceKm,
          totalDuration: track.totalDuration,
          pauseDuration: track.pauseDuration,
          avgSpeedKmh: track.avgSpeedKmh,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startTracking,
  addPoint,
  pauseTracking,
  resumeTracking,
  finishTracking,
  getTrackByDelivery,
  getHistory,
};
