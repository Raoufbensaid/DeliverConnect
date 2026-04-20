const Parcel = require("../models/Parcel.model");
const User = require("../models/User.model");
const Payment = require("../models/Payment.model");
const Delivery = require("../models/Delivery.model");

// ================================
// @route   GET /api/analytics/overview
// @desc    KPIs généraux de la plateforme
// @access  Privé (admin uniquement)
// ================================
const getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalLivreurs,
      totalParcels,
      totalDelivered,
      totalPending,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "livreur" }),
      Parcel.countDocuments(),
      Parcel.countDocuments({ status: "delivered" }),
      Parcel.countDocuments({ status: "pending" }),
      Payment.aggregate([
        { $match: { status: { $in: ["pending", "captured", "transferred"] } } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ]),
    ]);

    const completionRate =
      totalParcels > 0 ? Math.round((totalDelivered / totalParcels) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          clients: totalClients,
          livreurs: totalLivreurs,
        },
        parcels: {
          total: totalParcels,
          delivered: totalDelivered,
          pending: totalPending,
        },
        completionRate,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/analytics/revenue
// @desc    Revenus par jour sur les 30 derniers jours
// @access  Privé (admin uniquement)
// ================================
const getRevenue = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenue = await Payment.aggregate([
      {
        $match: {
          status: { $in: ["pending", "captured", "transferred"] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
          totalCommission: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/analytics/deliveries
// @desc    Livraisons par jour sur les 30 derniers jours
// @access  Privé (admin uniquement)
// ================================
const getDeliveriesStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Parcel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/analytics/top-deliverers
// @desc    Top 5 livreurs les plus actifs
// @access  Privé (admin uniquement)
// ================================
const getTopDeliverers = async (req, res) => {
  try {
    const topDeliverers = await Delivery.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$delivererId",
          totalDeliveries: { $sum: 1 },
        },
      },
      { $sort: { totalDeliveries: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "deliverer",
        },
      },
      { $unwind: "$deliverer" },
      {
        $project: {
          totalDeliveries: 1,
          name: {
            $concat: ["$deliverer.firstName", " ", "$deliverer.lastName"],
          },
          email: "$deliverer.email",
        },
      },
    ]);

    res.status(200).json({ success: true, data: topDeliverers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/analytics/parcels-by-size
// @desc    Répartition des colis par taille
// @access  Privé (admin uniquement)
// ================================
const getParcelsBySize = async (req, res) => {
  try {
    const data = await Parcel.aggregate([
      {
        $group: {
          _id: "$size",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// @route   GET /api/analytics/distances
// @desc    Analyse des distances de livraison
// @access  Privé (admin uniquement)
// ================================
const getDistanceStats = async (req, res) => {
  try {
    const [overview, byRange] = await Promise.all([
      // Statistiques générales
      Parcel.aggregate([
        { $match: { distanceKm: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgDistance: { $avg: "$distanceKm" },
            maxDistance: { $max: "$distanceKm" },
            minDistance: { $min: "$distanceKm" },
            totalDistance: { $sum: "$distanceKm" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Répartition par tranche de distance
      Parcel.aggregate([
        { $match: { distanceKm: { $exists: true } } },
        {
          $bucket: {
            groupBy: "$distanceKm",
            boundaries: [0, 10, 30, 100, 300, 99999],
            default: "Autre",
            output: {
              count: { $sum: 1 },
              avgPrice: { $avg: "$price" },
            },
          },
        },
      ]),
    ]);

    // Formater les tranches
    const rangeLabels = {
      0: "0 — 10 km",
      10: "10 — 30 km",
      30: "30 — 100 km",
      100: "100 — 300 km",
      300: "300 km+",
      Autre: "Autre",
    };

    const formattedRanges = byRange.map((r) => ({
      range: rangeLabels[r._id] || r._id,
      count: r.count,
      avgPrice: Math.round(r.avgPrice * 100) / 100,
    }));

    const stats = overview[0] || {};

    res.status(200).json({
      success: true,
      data: {
        avgDistance: Math.round((stats.avgDistance || 0) * 10) / 10,
        maxDistance: Math.round((stats.maxDistance || 0) * 10) / 10,
        minDistance: Math.round((stats.minDistance || 0) * 10) / 10,
        totalDistance: Math.round((stats.totalDistance || 0) * 10) / 10,
        totalParcels: stats.count || 0,
        byRange: formattedRanges,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getRevenue,
  getDeliveriesStats,
  getTopDeliverers,
  getParcelsBySize,
  getDistanceStats,
};
