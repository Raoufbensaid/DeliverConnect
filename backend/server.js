require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8081",
    ],
    credentials: true,
  },
});

// Rendre io accessible dans les controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connecté : ${socket.id}`);

  // Rejoindre la room d'une livraison
  socket.on("join_delivery", (parcelId) => {
    socket.join(`delivery_${parcelId}`);
    console.log(`📍 Socket ${socket.id} rejoint delivery_${parcelId}`);
  });

  // Quitter la room
  socket.on("leave_delivery", (parcelId) => {
    socket.leave(`delivery_${parcelId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client déconnecté : ${socket.id}`);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 Environnement : ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io actif`);
  });
});
