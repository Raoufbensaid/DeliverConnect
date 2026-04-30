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
    const { parcelId, clientSecret } = req.body;
    const stripe = getStripe();

    // Extraire le paymentIntentId depuis le clientSecret
    // Format : pi_xxxxx_secret_xxxxx
    const paymentIntentId = clientSecret.split("_secret_")[0];

    // Confirmer avec la carte de test Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
    });

    // Mettre à jour le payment en base
    await Payment.findOneAndUpdate(
      { parcelId },
      { status: "captured", stripePaymentIntentId: paymentIntentId },
      { new: true },
    );

    res.json({ success: true, paymentIntent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;
