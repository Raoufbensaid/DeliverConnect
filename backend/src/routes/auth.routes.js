const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

// POST /api/auth/register  — inscription
router.post("/register", register);

// POST /api/auth/login     — connexion
router.post("/login", login);

// GET  /api/auth/me        — profil connecté (route protégée)
router.get("/me", protect, getMe);

module.exports = router;
