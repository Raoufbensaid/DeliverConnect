const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const Review = require("../models/Review.model");
const Parcel = require("../models/Parcel.model");
const Delivery = require("../models/Delivery.model");

// POST /api/reviews — créer une évaluation
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res
        .status(403)
        .json({ success: false, message: "Accès réservé aux clients" });
    }

    const {
      parcelId,
      rating,
      onTime,
      damaged,
      wellReceived,
      hadIssues,
      comment,
    } = req.body;

    const parcel = await Parcel.findOne({
      _id: parcelId,
      clientId: req.user._id,
      status: "delivered",
    });
    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Colis introuvable ou non livré" });

    const existing = await Review.findOne({ parcelId });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà évalué cette livraison",
      });

    const delivery = await Delivery.findOne({ parcelId });
    if (!delivery)
      return res
        .status(404)
        .json({ success: false, message: "Livraison introuvable" });

    const review = await Review.create({
      parcelId,
      deliveryId: delivery._id,
      clientId: req.user._id,
      delivererId: parcel.delivererId,
      rating,
      onTime,
      damaged,
      wellReceived,
      hadIssues,
      comment,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/parcel/:parcelId — évaluation d'un colis
router.get("/parcel/:parcelId", protect, async (req, res) => {
  try {
    const review = await Review.findOne({ parcelId: req.params.parcelId })
      .populate("clientId", "firstName lastName")
      .populate("delivererId", "firstName lastName");
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/delivery/:deliveryId — évaluation d'une livraison (livreur)
router.get("/delivery/:deliveryId", protect, async (req, res) => {
  try {
    const review = await Review.findOne({
      deliveryId: req.params.deliveryId,
    }).populate("clientId", "firstName lastName");
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews — toutes les évaluations (admin)
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Accès réservé aux admins" });
    }
    const reviews = await Review.find()
      .populate("clientId", "firstName lastName")
      .populate("delivererId", "firstName lastName")
      .populate("parcelId", "sender recipient price")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
