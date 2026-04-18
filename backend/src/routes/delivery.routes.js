const express = require("express");
const router = express.Router();
const {
  pickupParcel,
  validateDelivery,
  getMyDeliveries,
} = require("../controllers/delivery.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

// Confirmer la prise en charge (livreur uniquement)
router.post(
  "/pickup",
  protect,
  authorize("livreur"),
  upload.single("photo"),
  pickupParcel,
);

// Valider la livraison par code OTP (livreur uniquement)
router.post("/validate", protect, authorize("livreur"), validateDelivery);

// Historique des livraisons (livreur uniquement)
router.get("/my", protect, authorize("livreur"), getMyDeliveries);

module.exports = router;
