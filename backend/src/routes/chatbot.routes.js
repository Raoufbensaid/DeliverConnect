const express = require("express");
const router = express.Router();

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
- S (20x15x10cm) = 4€ de base
- M (35x25x15cm) = 7€ de base
- L (50x40x30cm) = 11€ de base
- XL (80x60x40cm) = 16€ de base
- XXL (120x60x60cm) = 22€ de base
- Prix/km : 0-10km=1.5€ 10-30km=1.2€ 30-100km=0.5€ 100-300km=0.3€ 300+km=0.2€
- Fragile : +15%, Urgent : +25%
- Commission plateforme : 20% (livreur reçoit 80%)

PROCESSUS DE LIVRAISON :
1. Le client crée une annonce avec photo du colis
2. Le client paie en ligne via Stripe
3. Un livreur accepte la mission
4. Le livreur prend une photo du colis à la récupération
5. Le tracking GPS démarre automatiquement
6. Le client suit la livraison en temps réel sur la carte
7. Le livreur saisit le code OTP à 4 chiffres donné par le destinataire
8. La livraison est validée et le virement est déclenché automatiquement
9. Le client peut évaluer le livreur

RÈGLES :
- Réponds TOUJOURS en français
- Sois concis et sympathique (max 4-5 phrases)
- Si on te demande une estimation de prix, calcule-la avec les tarifs
- Ne parle QUE de DeliverConnect
- Tutoie l'utilisateur`;

router.post("/", async (req, res) => {
  try {
    console.log("=== CHATBOT ===");
    console.log("Body reçu:", req.body);
    console.log("Gemini Key:", GEMINI_API_KEY ? "présente" : "ABSENTE !");

    const { message, history = [] } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message requis" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            {
              role: "model",
              parts: [
                {
                  text: "Bonjour ! Je suis Raouf, l'assistant DeliverConnect.",
                },
              ],
            },
            ...history.map((msg) => ({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }],
            })),
            { role: "user", parts: [{ text: message }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      },
    );

    console.log("Status Gemini:", response.status);
    const data = await response.json();
    console.log("Réponse Gemini:", JSON.stringify(data).slice(0, 300));

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        message: "Erreur Gemini: " + JSON.stringify(data),
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Désolé, je n'ai pas pu répondre.";
    res.json({ success: true, reply });
  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
