const { Vonage } = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const sendSMS = async (to, message) => {
  try {
    // Formater le numéro pour Vonage (sans le +)
    const formattedTo = to.replace("+", "");

    const response = await vonage.sms.send({
      to: formattedTo,
      from: process.env.VONAGE_FROM,
      text: message,
    });

    if (response.messages[0].status === "0") {
      console.log(`✅ SMS envoyé à ${to}`);
    } else {
      console.error(`❌ Erreur SMS: ${response.messages[0]["error-text"]}`);
    }

    return response;
  } catch (error) {
    console.error(`❌ Erreur SMS vers ${to}:`, error.message);
    throw error;
  }
};

module.exports = { sendSMS };
