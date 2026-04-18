const express = require("express");
const router = express.Router();
const {
  createParcel,
  getParcels,
  getMyParcels,
  getParcelById,
  assignParcel,
} = require("../controllers/parcel.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

// Créer une annonce (client uniquement)
router.post(
  "/",
  protect,
  authorize("client"),
  upload.single("photo"),
  createParcel,
);
// Fil d'annonces disponibles (livreur uniquement)
router.get("/", protect, authorize("livreur"), getParcels);

// Mes annonces (client uniquement)
router.get("/my", protect, authorize("client"), getMyParcels);

// Détail d'une annonce
router.get("/:id", protect, getParcelById);

// Accepter une mission (livreur uniquement)
router.patch("/:id/assign", protect, authorize("livreur"), assignParcel);

module.exports = router;
