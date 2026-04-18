const crypto = require("crypto");
const Delivery = require("../models/Delivery.model");
const Parcel = require("../models/Parcel.model");
const Payment = require("../models/Payment.model");
const User = require("../models/User.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");
const { transferToDeliverer } = require("../services/stripe.service");
const { sendSMS } = require("../services/sms.service");

// Générer un code OTP à 4 chiffres
const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// Formater un numéro français pour Twilio (+33)
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("0")) {
    return "+33" + cleaned.slice(1);
  }
  return cleaned;
};

// ================================
// @route   POST /api/deliveries/pickup
// @desc    Livreur confirme la prise en charge + génère le code OTP
// @access  Privé (livreur uniquement)
// ================================
const pickupParcel = async (req, res) => {
  try {
    const { parcelId } = req.body;

    const parcel = await Parcel.findById(parcelId).populate(
      "clientId",
      "firstName lastName phone",
    );

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Annonce introuvable",
      });
    }

    // Vérifier que c'est bien le livreur assigné
    if (parcel.delivererId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    if (parcel.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: "Ce colis ne peut pas être pris en charge",
      });
    }

    // Upload de la photo de prise en charge
    let pickupPhotoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "deliverconnect/pickups",
      );
      pickupPhotoUrl = result.secure_url;
    }

    // Générer le code OTP à 4 chiffres
    const validationCode = generateOTP();

    // Créer la livraison
    const delivery = await Delivery.create({
      parcelId: parcel._id,
      delivererId: req.user._id,
      clientId: parcel.clientId,
      validationCode,
      pickupPhotoUrl,
      pickupAt: new Date(),
      status: "picked_up",
    });

    // Mettre à jour le statut du colis
    parcel.status = "picked_up";
    await parcel.save();

    // Envoyer le code OTP par SMS au destinataire
    const recipientPhone = formatPhoneNumber(parcel.recipient.phone);
    const smsMessage = `DeliverConnect code: ${validationCode}`;

    await sendSMS(recipientPhone, smsMessage);

    res.status(201).json({
      success: true,
      message:
        "Prise en charge confirmée — code envoyé par SMS au destinataire",
      delivery: {
        id: delivery._id,
        status: delivery.status,
        pickupPhotoUrl: delivery.pickupPhotoUrl,
        pickupAt: delivery.pickupAt,
      },
      // Affiché uniquement en développement pour les tests
      ...(process.env.NODE_ENV === "development" && { validationCode }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   POST /api/deliveries/validate
// @desc    Livreur saisit le code OTP pour valider la livraison
// @access  Privé (livreur uniquement)
// ================================
const validateDelivery = async (req, res) => {
  try {
    const { parcelId, code } = req.body;

    const delivery = await Delivery.findOne({
      parcelId,
      delivererId: req.user._id,
      status: "picked_up",
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Livraison introuvable",
      });
    }

    // Vérifier le code OTP
    if (delivery.validationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Code incorrect",
      });
    }

    // Mettre à jour la livraison
    delivery.status = "delivered";
    delivery.deliveredAt = new Date();
    await delivery.save();

    // Mettre à jour le colis
    await Parcel.findByIdAndUpdate(parcelId, { status: "delivered" });

    // Déclencher le virement au livreur
    const deliverer = await User.findById(req.user._id);
    const payment = await Payment.findOne({ parcelId });

    if (payment && deliverer.stripeAccountId) {
      try {
        const transfer = await transferToDeliverer(
          payment.delivererAmount,
          deliverer.stripeAccountId,
        );
        await Payment.findByIdAndUpdate(payment._id, {
          status: "transferred",
          stripeTransferId: transfer.id,
          delivererId: req.user._id,
        });
        console.log(
          `✅ Virement de ${payment.delivererAmount}€ effectué au livreur`,
        );
      } catch (stripeError) {
        console.error("Erreur virement Stripe:", stripeError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Livraison validée avec succès !",
      delivery: {
        id: delivery._id,
        status: delivery.status,
        deliveredAt: delivery.deliveredAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/deliveries/my
// @desc    Historique des livraisons du livreur
// @access  Privé (livreur uniquement)
// ================================
const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ delivererId: req.user._id })
      .populate("parcelId", "status sender recipient price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { pickupParcel, validateDelivery, getMyDeliveries };
