const Payment = require("../models/Payment.model");
const Parcel = require("../models/Parcel.model");
const { createPaymentIntent } = require("../services/stripe.service");
const stripe = require("../config/stripe");

// ================================
// @route   POST /api/payments/create-intent
// @desc    Créer un PaymentIntent Stripe
// @access  Privé (client uniquement)
// ================================
const createIntent = async (req, res) => {
  try {
    const { parcelId } = req.body;

    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Annonce introuvable" });
    }

    // Vérifier que c'est bien le client propriétaire
    if (parcel.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    // Créer le PaymentIntent Stripe
    const paymentIntent = await createPaymentIntent(parcel.price);

    // Sauvegarder le paiement en base
    const payment = await Payment.create({
      parcelId: parcel._id,
      clientId: req.user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: parcel.price,
      commissionAmount: parcel.commission,
      delivererAmount: parcel.delivererAmount,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   POST /api/payments/webhook
// @desc    Webhook Stripe — paiement confirmé
// @access  Public (appelé par Stripe)
// ================================
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }

  // Paiement confirmé par Stripe
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      // Mettre à jour le paiement
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: "captured" },
        { returnDocument: "after" },
      );

      if (payment) {
        // Publier l'annonce
        await Parcel.findByIdAndUpdate(payment.parcelId, {
          status: "pending",
        });
        console.log(`✅ Paiement confirmé pour l'annonce ${payment.parcelId}`);
      }
    } catch (error) {
      console.error("Erreur webhook:", error);
    }
  }

  res.status(200).json({ received: true });
};

// ================================
// @route   GET /api/payments/my
// @desc    Historique des paiements du client
// @access  Privé (client uniquement)
// ================================
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ clientId: req.user._id })
      .populate("parcelId", "status pickupAddress deliveryAddress price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createIntent, stripeWebhook, getMyPayments };
