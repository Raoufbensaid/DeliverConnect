const express = require("express");
const router = express.Router();
const {
  createIntent,
  stripeWebhook,
  getMyPayments,
} = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const Payment = require("../models/Payment.model");
const getStripe = require("../config/stripe");

// Créer un PaymentIntent (client uniquement)
router.post("/create-intent", protect, authorize("client"), createIntent);

// Webhook Stripe — doit recevoir le body brut (raw)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Historique des paiements (client uniquement)
router.get("/my", protect, authorize("client"), getMyPayments);

// Confirmer le paiement avec la carte de test Stripe
router.post("/confirm-test", protect, async (req, res) => {
  try {
    console.log("Body reçu:", req.body);
    const { parcelId, clientSecret } = req.body;
    console.log("clientSecret:", clientSecret);
    console.log("parcelId:", parcelId);

    if (!clientSecret) {
      return res
        .status(400)
        .json({ success: false, message: "clientSecret manquant" });
    }

    const stripe = getStripe();
    const paymentIntentId = clientSecret.split("_secret_")[0];
    console.log("paymentIntentId extrait:", paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
      return_url: "https://deliverconnect-production.up.railway.app",
    });

    await Payment.findOneAndUpdate(
      { parcelId },
      { status: "captured", stripePaymentIntentId: paymentIntentId },
      { new: true },
    );

    res.json({ success: true, paymentIntent });
  } catch (err) {
    console.error("Erreur confirm-test:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
