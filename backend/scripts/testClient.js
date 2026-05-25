require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User.model");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connecté");
  console.log("📊 Base:", mongoose.connection.db.databaseName);

  const password = await bcrypt.hash("test123", 10);

  const user = await User.create({
    firstName: "Test",
    lastName: "Client",
    email: "test.client@gmail.com",
    phone: "0612345678",
    password,
    role: "client",
    isActive: true,
    isVerified: true,
  });

  console.log("✅ Client créé :", user._id);
  console.log("Email    : test.client@gmail.com");
  console.log("Password : test123");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
