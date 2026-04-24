const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["assigned", "picked_up", "delivered"],
      default: "assigned",
    },
    validationCode: {
      type: String,
      required: true,
    },
    pickupPhotoUrl: {
      type: String,
      default: null,
    },

    // Horodatages précis
    pickupAt: { type: Date, default: null }, // Date/heure réception colis
    deliveredAt: { type: Date, default: null }, // Date/heure remise colis

    // Infos tracking
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      default: null,
    },
  },
  { timestamps: true },
);

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;
