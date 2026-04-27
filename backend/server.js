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

  // ═══ TRACKING ═══
  socket.on("join_delivery", (parcelId) => {
    socket.join(`delivery_${parcelId}`);
    console.log(`📍 Socket ${socket.id} rejoint delivery_${parcelId}`);
  });

  socket.on("leave_delivery", (parcelId) => {
    socket.leave(`delivery_${parcelId}`);
  });

  // ═══ CHAT ═══
  socket.on("join_chat", (parcelId) => {
    socket.join(`chat_${parcelId}`);
    console.log(`💬 Socket ${socket.id} rejoint chat_${parcelId}`);
  });

  socket.on("leave_chat", (parcelId) => {
    socket.leave(`chat_${parcelId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const Message = require("./src/models/Message.model");
      const { parcelId, senderId, receiverId, content } = data;

      // Sauvegarder en base
      const message = await Message.create({
        parcelId,
        senderId,
        receiverId,
        content,
      });
      const populated = await message.populate([
        { path: "senderId", select: "firstName lastName role" },
        { path: "receiverId", select: "firstName lastName role" },
      ]);

      // Envoyer à tous les membres du chat
      io.to(`chat_${parcelId}`).emit("receive_message", populated);

      console.log(
        `💬 Message de ${senderId} → ${receiverId} sur colis ${parcelId}`,
      );
    } catch (err) {
      console.error("Erreur send_message:", err.message);
      socket.emit("message_error", { error: err.message });
    }
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
