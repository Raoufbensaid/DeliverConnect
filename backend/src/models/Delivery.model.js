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
    pickupAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;
