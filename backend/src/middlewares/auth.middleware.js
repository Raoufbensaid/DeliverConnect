const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extraire le token du header "Authorization: Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur sans le mot de passe
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur introuvable",
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Compte désactivé",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Accès refusé — token manquant",
    });
  }
};

module.exports = { protect };
