const express = require("express");
const router = express.Router();
const {
  getOverview,
  getRevenue,
  getDeliveriesStats,
  getTopDeliverers,
  getParcelsBySize,
  getDistanceStats,
} = require("../controllers/analytics.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.get("/overview", protect, authorize("admin"), getOverview);
router.get("/revenue", protect, authorize("admin"), getRevenue);
router.get("/deliveries", protect, authorize("admin"), getDeliveriesStats);
router.get("/top-deliverers", protect, authorize("admin"), getTopDeliverers);
router.get("/parcels-by-size", protect, authorize("admin"), getParcelsBySize);
router.get("/distances", protect, authorize("admin"), getDistanceStats);

module.exports = router;
