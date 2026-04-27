const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    delivererId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    onTime: { type: Boolean, required: true },
    damaged: { type: Boolean, required: true },
    wellReceived: { type: Boolean, required: true },
    hadIssues: { type: Boolean, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
