const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
- Tailles disponibles : S (livres, chaussures 20x15x10cm) = 4€ de base, M (vêtements, petit électro 35x25x15cm) = 7€, L (valise, carton 50x40x30cm) = 11€, XL (carton déménagement 80x60x40cm) = 16€, XXL (vélo, meuble 120x60x60cm) = 22€
- Prix par km : 0-10km = 1.5€/km, 10-30km = 1.2€/km, 30-100km = 0.5€/km, 100-300km = 0.3€/km, 300+km = 0.2€/km
- Option Fragile : +15% sur le prix total
- Option Urgent : +25% sur le prix total
- Commission plateforme : 20% (le livreur reçoit 80%)

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
- Commence toujours par une phrase courte et directe`;

router.post("/", protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message requis" });
    }

    // Construire l'historique pour Gemini
    const contents = [
      // System prompt comme premier message
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Bonjour ! Je suis Alex, l'assistant DeliverConnect. Comment puis-je t'aider ?",
          },
        ],
      },
      // Historique de la conversation
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      // Message actuel
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res
        .status(500)
        .json({ success: false, message: "Erreur Gemini API" });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Désolé, je n'ai pas pu répondre.";

    res.json({ success: true, reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
