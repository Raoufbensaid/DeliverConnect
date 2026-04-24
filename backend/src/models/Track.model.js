const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    isPause: { type: Boolean, default: false },
  },
  { _id: false },
);

const trackSchema = new mongoose.Schema(
  {
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
    },
    delivererId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Points GPS du tracé
    points: [pointSchema],

    // Statut du tracking
    status: {
      type: String,
      enum: ["active", "paused", "finished"],
      default: "active",
    },

    // Statistiques de la course
    totalDistanceKm: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // en secondes
    pauseDuration: { type: Number, default: 0 }, // en secondes
    avgSpeedKmh: { type: Number, default: 0 },

    // Horodatages
    startedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    resumedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },

    // GPX export
    gpxData: { type: String, default: null },
  },
  { timestamps: true },
);

const Track = mongoose.model("Track", trackSchema);
module.exports = Track;
