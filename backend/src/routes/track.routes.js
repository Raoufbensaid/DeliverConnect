const express = require("express");
const router = express.Router();
const {
  startTracking,
  addPoint,
  pauseTracking,
  resumeTracking,
  finishTracking,
  getTrackByDelivery,
  getHistory,
} = require("../controllers/track.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

// Démarrer le tracking
router.post("/start", protect, authorize("livreur"), startTracking);

// Ajouter un point GPS
router.post("/:id/point", protect, authorize("livreur"), addPoint);

// Pause
router.patch("/:id/pause", protect, authorize("livreur"), pauseTracking);

// Reprendre
router.patch("/:id/resume", protect, authorize("livreur"), resumeTracking);

// Terminer
router.patch("/:id/finish", protect, authorize("livreur"), finishTracking);

// Récupérer le tracé d'une livraison
router.get("/delivery/:deliveryId", protect, getTrackByDelivery);

// Historique
router.get("/history", protect, getHistory);

module.exports = router;
