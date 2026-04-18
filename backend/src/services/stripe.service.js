const stripe = require("../config/stripe");

// Créer un PaymentIntent — le client paie avant publication
const createPaymentIntent = async (amount) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe travaille en centimes
    currency: "eur",
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
};

// Transférer l'argent au livreur (80%)
const transferToDeliverer = async (amount, stripeAccountId) => {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // en centimes
    currency: "eur",
    destination: stripeAccountId,
  });
  return transfer;
};

module.exports = { createPaymentIntent, transferToDeliverer };
