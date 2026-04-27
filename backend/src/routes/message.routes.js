const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const Message = require("../models/Message.model");
const Parcel = require("../models/Parcel.model");

// GET /api/messages/:parcelId — historique des messages
router.get("/:parcelId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ parcelId: req.params.parcelId })
      .populate("senderId", "firstName lastName role")
      .populate("receiverId", "firstName lastName role")
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/messages/:parcelId/read — marquer comme lus
router.patch("/:parcelId/read", protect, async (req, res) => {
  try {
    await Message.updateMany(
      { parcelId: req.params.parcelId, receiverId: req.user._id, read: false },
      { read: true },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/:parcelId/unread — nombre de messages non lus
router.get("/:parcelId/unread", protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      parcelId: req.params.parcelId,
      receiverId: req.user._id,
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
