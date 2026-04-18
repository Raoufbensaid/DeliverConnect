const Parcel = require("../models/Parcel.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");

// Calcul automatique de la commission (20%)
const calculatePrices = (totalPrice) => {
  const commission = Math.round(totalPrice * 0.2 * 100) / 100;
  const delivererAmount = Math.round((totalPrice - commission) * 100) / 100;
  return { commission, delivererAmount };
};

// ================================
// @route   POST /api/parcels
// @desc    Créer une annonce de colis
// @access  Privé (client uniquement)
// ================================
const createParcel = async (req, res) => {
  try {
    const { weight, size, description, pickupAddress, deliveryAddress, price } =
      req.body;

    // Upload de la photo si présente
    let photoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "deliverconnect/parcels",
      );
      photoUrl = result.secure_url;
    }

    const { commission, delivererAmount } = calculatePrices(Number(price));

    const parcel = await Parcel.create({
      clientId: req.user._id,
      weight: Number(weight),
      size,
      description,
      photoUrl,
      pickupAddress: JSON.parse(pickupAddress),
      deliveryAddress: JSON.parse(deliveryAddress),
      price: Number(price),
      commission,
      delivererAmount,
    });

    res.status(201).json({
      success: true,
      message: "Annonce créée avec succès",
      parcel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/parcels
// @desc    Récupérer toutes les annonces disponibles (fil livreurs)
// @access  Privé (livreur uniquement)
// ================================
const getParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ status: "pending" })
      .populate("clientId", "firstName lastName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: parcels.length,
      parcels,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/parcels/my
// @desc    Récupérer les annonces du client connecté
// @access  Privé (client uniquement)
// ================================
const getMyParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ clientId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: parcels.length,
      parcels,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/parcels/:id
// @desc    Récupérer le détail d'une annonce
// @access  Privé
// ================================
const getParcelById = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate("clientId", "firstName lastName phone")
      .populate("delivererId", "firstName lastName phone");

    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Annonce introuvable" });
    }

    res.status(200).json({ success: true, parcel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   PATCH /api/parcels/:id/assign
// @desc    Livreur accepte une mission
// @access  Privé (livreur uniquement)
// ================================
const assignParcel = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Annonce introuvable" });
    }

    if (parcel.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cette annonce n'est plus disponible",
      });
    }

    parcel.status = "assigned";
    parcel.delivererId = req.user._id;
    await parcel.save();

    res.status(200).json({
      success: true,
      message: "Mission acceptée avec succès",
      parcel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createParcel,
  getParcels,
  getMyParcels,
  getParcelById,
  assignParcel,
};
