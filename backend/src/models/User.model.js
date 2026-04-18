const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["client", "livreur", "admin"],
      required: [true, "Le rôle est obligatoire"],
    },
    firstName: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    phone: {
      type: String,
      required: [true, "Le numéro de téléphone est obligatoire"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Le mot de passe doit faire au moins 6 caractères"],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    siret: {
      type: String,
      trim: true,
      default: null,
    },
    iban: {
      type: String,
      trim: true,
      default: null,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Hashage du mot de passe avant sauvegarde
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
