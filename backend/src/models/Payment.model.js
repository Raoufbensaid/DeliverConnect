const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
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
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    stripeTransferId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    delivererAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "eur",
    },
    status: {
      type: String,
      enum: ["pending", "captured", "transferred", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
