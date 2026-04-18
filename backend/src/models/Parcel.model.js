const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
);

const parcelSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    delivererId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "delivered", "cancelled"],
      default: "pending",
    },
    weight: {
      type: Number,
      required: [true, "Le poids est obligatoire"],
    },
    size: {
      type: String,
      enum: ["xs", "s", "m", "l", "xl"],
      required: [true, "La taille est obligatoire"],
    },
    description: {
      type: String,
      default: null,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    pickupAddress: {
      type: addressSchema,
      required: true,
    },
    deliveryAddress: {
      type: addressSchema,
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Le prix est obligatoire"],
    },
    commission: {
      type: Number,
      required: true,
    },
    delivererAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour accélérer la récupération du fil d'annonces
parcelSchema.index({ status: 1, createdAt: -1 });
parcelSchema.index({ clientId: 1 });

const Parcel = mongoose.model("Parcel", parcelSchema);
module.exports = Parcel;
