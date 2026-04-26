const Stripe = require("stripe");

let stripeInstance = null;

const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante");
    }
    stripeInstance = Stripe(key);
  }
  return stripeInstance;
};

module.exports = getStripe;
