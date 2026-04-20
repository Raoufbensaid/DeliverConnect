const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/parcels", require("./routes/parcel.routes"));
app.use("/api/deliveries", require("./routes/delivery.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

app.get("/", (req, res) => {
  res.json({ message: "🚀 DeliverConnect API — opérationnelle" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable" });
});

module.exports = app;
