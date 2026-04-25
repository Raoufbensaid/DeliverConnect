const Parcel = require("../models/Parcel.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");
const { calculateDistance } = require("../services/distance.service");

// Tarifs de base par taille
const BASE_PRICES = { s: 4, m: 7, l: 11, xl: 16, xxl: 22 };
const PRICE_PER_KM_FUNC = (distanceKm) => {
  if (distanceKm <= 10) return 1.5;
  if (distanceKm <= 30) return 1.2;
  if (distanceKm <= 100) return 0.5;
  if (distanceKm <= 300) return 0.3;
  return 0.2;
};
const FRAGILE_RATE = 0.15;
const URGENT_RATE = 0.25;
const COMMISSION_RATE = 0.2;

const calculatePrice = (size, distanceKm, fragile, urgent) => {
  const basePrice = BASE_PRICES[size] || 7;
  const distancePrice =
    Math.round(distanceKm * PRICE_PER_KM_FUNC(distanceKm) * 100) / 100;

  let total = basePrice + distancePrice;
  const fragileExtra = fragile
    ? Math.round(total * FRAGILE_RATE * 100) / 100
    : 0;
  total += fragileExtra;
  const urgentExtra = urgent ? Math.round(total * URGENT_RATE * 100) / 100 : 0;
  total += urgentExtra;

  const price = Math.round(total * 100) / 100;
  const commission = Math.round(price * COMMISSION_RATE * 100) / 100;
  const delivererAmount = Math.round((price - commission) * 100) / 100;

  return {
    price,
    commission,
    delivererAmount,
    priceBreakdown: { basePrice, distancePrice, fragileExtra, urgentExtra },
  };
};

// ================================
// @route   POST /api/parcels/estimate
// @desc    Estimer le prix avant création
// @access  Privé (client uniquement)
// ================================
const estimatePrice = async (req, res) => {
  try {
    const { size, fragile, urgent, sender, recipient } = req.body;

    if (!BASE_PRICES[size]) {
      return res
        .status(400)
        .json({ success: false, message: "Taille invalide" });
    }

    const senderParsed = JSON.parse(sender);
    const recipientParsed = JSON.parse(recipient);

    const result = await calculateDistance(
      senderParsed.address || senderParsed,
      recipientParsed.address || recipientParsed,
    );

    const distanceKm = result.km;

    const { price, commission, delivererAmount, priceBreakdown } =
      calculatePrice(size, distanceKm, fragile === "true", urgent === "true");

    res.status(200).json({
      success: true,
      distanceKm,
      price,
      delivererAmount,
      priceBreakdown: {
        ...priceBreakdown,
        fragile: fragile === "true",
        urgent: urgent === "true",
        size,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   POST /api/parcels
// @desc    Créer une annonce
// @access  Privé (client uniquement)
// ================================
const createParcel = async (req, res) => {
  try {
    const { weight, size, fragile, urgent, description, sender, recipient } =
      req.body;

    if (!BASE_PRICES[size]) {
      return res
        .status(400)
        .json({ success: false, message: "Taille invalide" });
    }

    const senderParsed = JSON.parse(sender);
    const recipientParsed = JSON.parse(recipient);

    // Calcul de la distance + récupération des coordonnées GPS
    const result = await calculateDistance(
      senderParsed.address,
      recipientParsed.address,
    );

    const distanceKm = result.km;

    // Ajouter les coordonnées GPS aux adresses
    senderParsed.address.lat = result.pickupCoords.lat;
    senderParsed.address.lng = result.pickupCoords.lng;
    recipientParsed.address.lat = result.deliveryCoords.lat;
    recipientParsed.address.lng = result.deliveryCoords.lng;

    // Calcul automatique du prix
    const { price, commission, delivererAmount, priceBreakdown } =
      calculatePrice(size, distanceKm, fragile === "true", urgent === "true");

    // Upload photo
    let photoUrl = null;
    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "deliverconnect/parcels",
      );
      photoUrl = uploaded.secure_url;
    }

    const parcel = await Parcel.create({
      clientId: req.user._id,
      weight: Number(weight),
      size,
      fragile: fragile === "true",
      urgent: urgent === "true",
      description,
      photoUrl,
      sender: senderParsed,
      recipient: recipientParsed,
      distanceKm,
      price,
      commission,
      delivererAmount,
      priceBreakdown,
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
// @desc    Fil d'annonces (livreur)
// @access  Privé (livreur uniquement)
// ================================
const getParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ status: "pending" })
      .populate("clientId", "firstName lastName phone")
      .select("-commission -price")
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
// @desc    Annonces du client connecté
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
// @desc    Détail d'une annonce
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
  estimatePrice,
  createParcel,
  getParcels,
  getMyParcels,
  getParcelById,
  assignParcel,
};
