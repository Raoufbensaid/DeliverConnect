const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Parcel = require("../models/Parcel.model");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/parcels", protect, authorize("admin"), async (req, res) => {
  try {
    const parcels = await Parcel.find()
      .populate("clientId", "firstName lastName")
      .populate("delivererId", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json({ success: true, parcels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch(
  "/parcels/:id/cancel",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const parcel = await Parcel.findById(req.params.id);
      if (!parcel) {
        return res
          .status(404)
          .json({ success: false, message: "Colis introuvable" });
      }
      if (parcel.status === "delivered") {
        return res.status(400).json({
          success: false,
          message: "Impossible d'annuler une livraison terminée",
        });
      }
      parcel.status = "pending";
      parcel.delivererId = null;
      await parcel.save();
      res.json({
        success: true,
        message: "Livraison annulée — annonce remise sur le fil",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
