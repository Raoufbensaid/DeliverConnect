const express = require("express");
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `Tu es Raouf, l'assistant virtuel officiel de DeliverConnect.
DeliverConnect est une marketplace de livraison collaborative qui connecte des clients qui veulent envoyer des colis avec des livreurs particuliers, inspirée de Strava et Uber.

TU PEUX AIDER AVEC :
- Expliquer comment créer une annonce en 5 étapes
- Calculer une estimation de prix
- Expliquer le suivi GPS en temps réel
- Expliquer le système de paiement Stripe
- Expliquer le chat avec le livreur
- Expliquer comment évaluer le livreur
- Expliquer le code OTP de validation

TARIFS :
- S (20x15x10cm) = 4€ de base
- M (35x25x15cm) = 7€ de base
- L (50x40x30cm) = 11€ de base
- XL (80x60x40cm) = 16€ de base
- XXL (120x60x60cm) = 22€ de base
- Prix/km : 0-10km=1.5€/km, 10-30km=1.2€/km, 30-100km=0.5€/km, 100-300km=0.3€/km, 300+km=0.2€/km
- Option Fragile : +15% sur le prix total
- Option Urgent : +25% sur le prix total
- Commission plateforme : 20% (le livreur reçoit 80%)

EXEMPLE DE CALCUL :
Colis M, Paris → Lyon (465km), fragile :
- Base M = 7€
- Distance 465km : 10km×1.5 + 20km×1.2 + 100km×0.5 + 300km×0.3 + 35km×0.2 = 15+24+50+90+7 = 186€ ... non, calcule par tranche
- Prix distance = 10×1.5 + 20×1.2 + 100×0.5 + 300×0.3 + 35×0.2 = 15+24+50+90+7 = 186€
- Sous-total = 7 + 186 = 193€ ... simplifie et arrondis
- Fragile +15% = total × 1.15
- Commission 20% = pour la plateforme

PROCESSUS DE LIVRAISON :
1. Le client crée une annonce avec photo du colis
2. Le client paie en ligne via Stripe
3. Un livreur accepte la mission
4. Le livreur prend une photo du colis à la récupération
5. Le tracking GPS démarre automatiquement
6. Le client suit la livraison en temps réel sur la carte
7. Le livreur saisit le code OTP à 4 chiffres donné par le destinataire
8. La livraison est validée et le virement est déclenché automatiquement
9. Le client peut évaluer le livreur (note + critères qualitatifs)

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Sois concis et sympathique (max 4-5 phrases par réponse)
- Si on te demande une estimation de prix, calcule-la avec les tarifs ci-dessus
- Ne parle QUE de DeliverConnect
- Si tu ne sais pas, dis-le honnêtement
- Tutoie l'utilisateur
- Commence toujours par une réponse directe et claire`;

router.post("/", async (req, res) => {
  try {
    console.log("=== CHATBOT ===");
    console.log("Message reçu:", req.body.message);
    console.log("Groq Key:", GROQ_API_KEY ? "présente" : "ABSENTE !");

    const { message, history = [] } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message requis" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          temperature: 0.7,
          max_tokens: 400,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((msg) => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
            })),
            { role: "user", content: message },
          ],
        }),
      },
    );

    console.log("Status Groq:", response.status);
    const data = await response.json();
    console.log("Réponse Groq:", JSON.stringify(data).slice(0, 200));

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({
        success: false,
        message: "Erreur Groq API: " + (data.error?.message || "inconnue"),
      });
    }

    const reply =
      data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
    res.json({ success: true, reply });
  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
