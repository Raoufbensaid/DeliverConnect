router.post("/", async (req, res) => {
  try {
    console.log("=== CHATBOT ===");
    console.log("Body reçu:", req.body);
    console.log("Message:", req.body.message);
    console.log("Gemini Key:", GEMINI_API_KEY ? "présente" : "ABSENTE !");

    const { message, history = [] } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message requis" });
    }

    console.log("Appel Gemini...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: SYSTEM_PROMPT }],
            },
            {
              role: "model",
              parts: [{ text: "Bonjour ! Je suis Alex." }],
            },
            ...history.map((msg) => ({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }],
            })),
            {
              role: "user",
              parts: [{ text: message }],
            },
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
    console.log("Réponse Gemini:", JSON.stringify(data).slice(0, 200));

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
