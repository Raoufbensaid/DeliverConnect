const express = require("express");
const router = express.Router();
const {
  createIntent,
  stripeWebhook,
  getMyPayments,
} = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

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

module.exports = router;
