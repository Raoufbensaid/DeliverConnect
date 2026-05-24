require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User.model");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connecté");

  const existing = await User.findOne({ email: "admin@deliverconnect.com" });
  if (existing) {
    console.log("✅ Admin existe déjà !");
    process.exit(0);
  }

  const password = await bcrypt.hash("admin123", 10);
  await User.create({
    firstName: "Admin",
    lastName: "DeliverConnect",
    email: "admin@deliverconnect.com",
    phone: "0600000000",
    password,
    role: "admin",
    isActive: true,
    isVerified: true,
  });

  console.log("✅ Admin créé !");
  console.log("Email    : admin@deliverconnect.com");
  console.log("Password : admin123");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
