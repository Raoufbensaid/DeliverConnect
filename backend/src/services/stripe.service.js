const getStripe = require("../config/stripe");

// Créer un PaymentIntent — le client paie avant publication
const createPaymentIntent = async (amount) => {
  const stripe = getStripe();
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "eur",
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never", // ← évite les redirections
    },
  });
};

// Transférer l'argent au livreur (80%)
const transferToDeliverer = async (amount, stripeAccountId) => {
  const transfer = await getStripe().transfers.create({
    amount: Math.round(amount * 100), // en centimes
    currency: "eur",
    destination: stripeAccountId,
  });
  return transfer;
};

module.exports = { createPaymentIntent, transferToDeliverer };
