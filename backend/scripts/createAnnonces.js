require("dotenv").config();
const mongoose = require("mongoose");
const Parcel = require("../src/models/Parcel.model");

const CLIENT_ID = "69ed4dbb86528b5499f5af0c";

const annonces = [
  {
    sender: {
      firstName: "Oualid",
      lastName: "BENSAIDoualid",
      phone: "0656685080",
      address: {
        street: "3 Place du 11 Novembre",
        city: "Argenteuil",
        postalCode: "95100",
        lat: 48.935599,
        lng: 2.238459,
      },
    },
    recipient: {
      firstName: "Marie",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "10 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.855,
        lng: 2.352,
      },
    },
    size: "m",
    weight: 2,
    fragile: false,
    urgent: false,
    distanceKm: 18,
    price: 18.5,
    commission: 3.7,
    delivererAmount: 14.8,
  },
  {
    sender: {
      firstName: "Oualid",
      lastName: "BENSAID",
      phone: "0656685080",
      address: {
        street: "3 Place du 11 Novembre",
        city: "Argenteuil",
        postalCode: "95100",
        lat: 48.935599,
        lng: 2.238459,
      },
    },
    recipient: {
      firstName: "Jean",
      lastName: "Martin",
      phone: "0698765432",
      address: {
        street: "25 Rue du Faubourg Saint-Antoine",
        city: "Paris",
        postalCode: "75011",
        lat: 48.853,
        lng: 2.374,
      },
    },
    size: "l",
    weight: 5,
    fragile: true,
    urgent: false,
    distanceKm: 20,
    price: 26.45,
    commission: 5.29,
    delivererAmount: 21.16,
  },
  {
    sender: {
      firstName: "Oualid",
      lastName: "BENSAID",
      phone: "0656685080",
      address: {
        street: "3 Place du 11 Novembre",
        city: "Argenteuil",
        postalCode: "95100",
        lat: 48.935599,
        lng: 2.238459,
      },
    },
    recipient: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "5 Avenue des Champs-Élysées",
        city: "Paris",
        postalCode: "75008",
        lat: 48.8698,
        lng: 2.3078,
      },
    },
    size: "s",
    weight: 1,
    fragile: false,
    urgent: true,
    distanceKm: 16,
    price: 13.75,
    commission: 2.75,
    delivererAmount: 11.0,
  },
  {
    sender: {
      firstName: "Oualid",
      lastName: "BENSAID",
      phone: "0656685080",
      address: {
        street: "3 Place du 11 Novembre",
        city: "Argenteuil",
        postalCode: "95100",
        lat: 48.935599,
        lng: 2.238459,
      },
    },
    recipient: {
      firstName: "Pierre",
      lastName: "Moreau",
      phone: "0678901234",
      address: {
        street: "15 Rue de la Paix",
        city: "Versailles",
        postalCode: "78000",
        lat: 48.8044,
        lng: 2.1333,
      },
    },
    size: "xl",
    weight: 8,
    fragile: false,
    urgent: false,
    distanceKm: 35,
    price: 34.2,
    commission: 6.84,
    delivererAmount: 27.36,
  },
  {
    sender: {
      firstName: "Oualid",
      lastName: "BENSAID",
      phone: "0656685080",
      address: {
        street: "3 Place du 11 Novembre",
        city: "Argenteuil",
        postalCode: "95100",
        lat: 48.935599,
        lng: 2.238459,
      },
    },
    recipient: {
      firstName: "Laura",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "8 Rue du Général de Gaulle",
        city: "Saint-Denis",
        postalCode: "93200",
        lat: 48.9362,
        lng: 2.3574,
      },
    },
    size: "m",
    weight: 3,
    fragile: true,
    urgent: true,
    distanceKm: 12,
    price: 22.75,
    commission: 4.55,
    delivererAmount: 18.2,
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connecté");

  for (const annonce of annonces) {
    await Parcel.create({
      ...annonce,
      clientId: CLIENT_ID,
      status: "pending",
    });
    console.log(
      `📦 Annonce créée : ${annonce.sender.address.city} → ${annonce.recipient.address.city}`,
    );
  }

  console.log(`\n🎉 ${annonces.length} annonces créées avec succès !`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
