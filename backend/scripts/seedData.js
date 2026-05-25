require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User.model");
const Parcel = require("../src/models/Parcel.model");
const Delivery = require("../src/models/Delivery.model");

// ════ DONNÉES CLIENTS ════
const CLIENTS_DATA = [
  {
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@gmail.com",
    phone: "0612345678",
  },
  {
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@gmail.com",
    phone: "0623456789",
  },
  {
    firstName: "Pierre",
    lastName: "Bernard",
    email: "pierre.bernard@gmail.com",
    phone: "0634567890",
  },
  {
    firstName: "Sophie",
    lastName: "Leblanc",
    email: "sophie.leblanc@gmail.com",
    phone: "0645678901",
  },
  {
    firstName: "Thomas",
    lastName: "Robert",
    email: "thomas.robert@gmail.com",
    phone: "0656789012",
  },
  {
    firstName: "Camille",
    lastName: "Richard",
    email: "camille.richard@gmail.com",
    phone: "0667890123",
  },
  {
    firstName: "Nicolas",
    lastName: "Petit",
    email: "nicolas.petit@gmail.com",
    phone: "0678901234",
  },
  {
    firstName: "Julie",
    lastName: "Moreau",
    email: "julie.moreau@gmail.com",
    phone: "0689012345",
  },
  {
    firstName: "Antoine",
    lastName: "Simon",
    email: "antoine.simon@gmail.com",
    phone: "0690123456",
  },
  {
    firstName: "Léa",
    lastName: "Laurent",
    email: "lea.laurent@gmail.com",
    phone: "0601234567",
  },
];

// ════ DONNÉES LIVREURS ════
const LIVREURS_DATA = [
  {
    firstName: "Marc",
    lastName: "Durand",
    email: "marc.durand@gmail.com",
    phone: "0611111111",
    siret: "12345678901234",
    iban: "FR7630006000011234567890189",
  },
  {
    firstName: "Lucas",
    lastName: "Fontaine",
    email: "lucas.fontaine@gmail.com",
    phone: "0622222222",
    siret: "23456789012345",
    iban: "FR7630006000012345678901234",
  },
  {
    firstName: "Emma",
    lastName: "Garnier",
    email: "emma.garnier@gmail.com",
    phone: "0633333333",
    siret: "34567890123456",
    iban: "FR7630006000013456789012345",
  },
  {
    firstName: "Hugo",
    lastName: "Chevalier",
    email: "hugo.chevalier@gmail.com",
    phone: "0644444444",
    siret: "45678901234567",
    iban: "FR7630006000014567890123456",
  },
  {
    firstName: "Inès",
    lastName: "Robin",
    email: "ines.robin@gmail.com",
    phone: "0655555555",
    siret: "56789012345678",
    iban: "FR7630006000015678901234567",
  },
  {
    firstName: "Maxime",
    lastName: "Morel",
    email: "maxime.morel@gmail.com",
    phone: "0666666666",
    siret: "67890123456789",
    iban: "FR7630006000016789012345678",
  },
  {
    firstName: "Chloé",
    lastName: "Rousseau",
    email: "chloe.rousseau@gmail.com",
    phone: "0677777777",
    siret: "78901234567890",
    iban: "FR7630006000017890123456789",
  },
  {
    firstName: "Alexandre",
    lastName: "Blanc",
    email: "alexandre.blanc@gmail.com",
    phone: "0688888888",
    siret: "89012345678901",
    iban: "FR7630006000018901234567890",
  },
  {
    firstName: "Manon",
    lastName: "Guerin",
    email: "manon.guerin@gmail.com",
    phone: "0699999999",
    siret: "90123456789012",
    iban: "FR7630006000019012345678901",
  },
  {
    firstName: "Romain",
    lastName: "Muller",
    email: "romain.muller@gmail.com",
    phone: "0600000001",
    siret: "01234567890123",
    iban: "FR7630006000010123456789012",
  },
];

// ════ 50 ANNONCES DIFFÉRENTES ════
const PARCELS_DATA = [
  // ── CLIENT 1 — Jean Dupont ──
  {
    sender: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "15 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.8602,
        lng: 2.3477,
      },
    },
    recipient: {
      firstName: "Alice",
      lastName: "Morin",
      phone: "0698765432",
      address: {
        street: "8 Place Bellecour",
        city: "Lyon",
        postalCode: "69002",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    size: "m",
    weight: 2.5,
    fragile: false,
    urgent: false,
    distanceKm: 465,
    price: 45.0,
    commission: 9.0,
    delivererAmount: 36.0,
  },
  {
    sender: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "15 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.8602,
        lng: 2.3477,
      },
    },
    recipient: {
      firstName: "Bernard",
      lastName: "Leroy",
      phone: "0687654321",
      address: {
        street: "3 Cours Mirabeau",
        city: "Aix-en-Provence",
        postalCode: "13100",
        lat: 43.5297,
        lng: 5.4474,
      },
    },
    size: "s",
    weight: 1.0,
    fragile: true,
    urgent: false,
    distanceKm: 750,
    price: 38.5,
    commission: 7.7,
    delivererAmount: 30.8,
  },
  {
    sender: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "15 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.8602,
        lng: 2.3477,
      },
    },
    recipient: {
      firstName: "Céline",
      lastName: "Petit",
      phone: "0676543210",
      address: {
        street: "12 Allée des Roses",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    size: "l",
    weight: 6.0,
    fragile: false,
    urgent: true,
    distanceKm: 580,
    price: 72.0,
    commission: 14.4,
    delivererAmount: 57.6,
  },
  // delivered
  {
    sender: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "15 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.8602,
        lng: 2.3477,
      },
    },
    recipient: {
      firstName: "Daniel",
      lastName: "Faure",
      phone: "0665432109",
      address: {
        street: "5 Rue Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    size: "xl",
    weight: 8.0,
    fragile: false,
    urgent: false,
    distanceKm: 385,
    price: 55.0,
    commission: 11.0,
    delivererAmount: 44.0,
  },
  {
    sender: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      address: {
        street: "15 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        lat: 48.8602,
        lng: 2.3477,
      },
    },
    recipient: {
      firstName: "Élise",
      lastName: "Girard",
      phone: "0654321098",
      address: {
        street: "22 Boulevard Gambetta",
        city: "Lille",
        postalCode: "59000",
        lat: 50.6292,
        lng: 3.0573,
      },
    },
    size: "m",
    weight: 3.0,
    fragile: true,
    urgent: true,
    distanceKm: 225,
    price: 48.0,
    commission: 9.6,
    delivererAmount: 38.4,
  },

  // ── CLIENT 2 — Marie Martin ──
  {
    sender: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      address: {
        street: "7 Avenue des Fleurs",
        city: "Marseille",
        postalCode: "13008",
        lat: 43.2965,
        lng: 5.3698,
      },
    },
    recipient: {
      firstName: "François",
      lastName: "Bonnet",
      phone: "0643210987",
      address: {
        street: "18 Rue Saint-Jean",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    size: "s",
    weight: 0.8,
    fragile: false,
    urgent: false,
    distanceKm: 320,
    price: 28.0,
    commission: 5.6,
    delivererAmount: 22.4,
  },
  {
    sender: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      address: {
        street: "7 Avenue des Fleurs",
        city: "Marseille",
        postalCode: "13008",
        lat: 43.2965,
        lng: 5.3698,
      },
    },
    recipient: {
      firstName: "Gilles",
      lastName: "Renard",
      phone: "0632109876",
      address: {
        street: "9 Rue de la Paix",
        city: "Nice",
        postalCode: "06000",
        lat: 43.7102,
        lng: 7.262,
      },
    },
    size: "m",
    weight: 4.0,
    fragile: true,
    urgent: false,
    distanceKm: 200,
    price: 38.0,
    commission: 7.6,
    delivererAmount: 30.4,
  },
  {
    sender: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      address: {
        street: "7 Avenue des Fleurs",
        city: "Marseille",
        postalCode: "13008",
        lat: 43.2965,
        lng: 5.3698,
      },
    },
    recipient: {
      firstName: "Hélène",
      lastName: "Lambert",
      phone: "0621098765",
      address: {
        street: "14 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    size: "xxl",
    weight: 15.0,
    fragile: false,
    urgent: false,
    distanceKm: 400,
    price: 85.0,
    commission: 17.0,
    delivererAmount: 68.0,
  },
  // delivered
  {
    sender: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      address: {
        street: "7 Avenue des Fleurs",
        city: "Marseille",
        postalCode: "13008",
        lat: 43.2965,
        lng: 5.3698,
      },
    },
    recipient: {
      firstName: "Isabelle",
      lastName: "Mercier",
      phone: "0610987654",
      address: {
        street: "6 Rue des Lilas",
        city: "Lyon",
        postalCode: "69003",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    size: "l",
    weight: 5.0,
    fragile: false,
    urgent: true,
    distanceKm: 310,
    price: 62.0,
    commission: 12.4,
    delivererAmount: 49.6,
  },
  {
    sender: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      address: {
        street: "7 Avenue des Fleurs",
        city: "Marseille",
        postalCode: "13008",
        lat: 43.2965,
        lng: 5.3698,
      },
    },
    recipient: {
      firstName: "Jacques",
      lastName: "Dupuis",
      phone: "0609876543",
      address: {
        street: "33 Avenue de la Gare",
        city: "Montpellier",
        postalCode: "34000",
        lat: 43.6108,
        lng: 3.8767,
      },
    },
    size: "s",
    weight: 1.5,
    fragile: true,
    urgent: true,
    distanceKm: 170,
    price: 32.0,
    commission: 6.4,
    delivererAmount: 25.6,
  },

  // ── CLIENT 3 — Pierre Bernard ──
  {
    sender: {
      firstName: "Pierre",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "25 Rue du Commerce",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    recipient: {
      firstName: "Karine",
      lastName: "Lemaire",
      phone: "0698765431",
      address: {
        street: "11 Rue des Capucines",
        city: "Paris",
        postalCode: "75002",
        lat: 48.8698,
        lng: 2.3415,
      },
    },
    size: "m",
    weight: 3.5,
    fragile: false,
    urgent: false,
    distanceKm: 580,
    price: 50.0,
    commission: 10.0,
    delivererAmount: 40.0,
  },
  {
    sender: {
      firstName: "Pierre",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "25 Rue du Commerce",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    recipient: {
      firstName: "Laurent",
      lastName: "Caron",
      phone: "0687654320",
      address: {
        street: "4 Quai des Chartrons",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.85,
        lng: -0.57,
      },
    },
    size: "xl",
    weight: 10.0,
    fragile: true,
    urgent: false,
    distanceKm: 5,
    price: 35.0,
    commission: 7.0,
    delivererAmount: 28.0,
  },
  {
    sender: {
      firstName: "Pierre",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "25 Rue du Commerce",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    recipient: {
      firstName: "Mathilde",
      lastName: "Roux",
      phone: "0676543209",
      address: {
        street: "16 Rue Nationale",
        city: "Lille",
        postalCode: "59000",
        lat: 50.6292,
        lng: 3.0573,
      },
    },
    size: "s",
    weight: 0.5,
    fragile: false,
    urgent: true,
    distanceKm: 850,
    price: 42.0,
    commission: 8.4,
    delivererAmount: 33.6,
  },
  // delivered
  {
    sender: {
      firstName: "Pierre",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "25 Rue du Commerce",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    recipient: {
      firstName: "Nicolas",
      lastName: "Perrin",
      phone: "0665432108",
      address: {
        street: "20 Avenue Jean Jaurès",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    size: "l",
    weight: 7.0,
    fragile: false,
    urgent: false,
    distanceKm: 340,
    price: 58.0,
    commission: 11.6,
    delivererAmount: 46.4,
  },
  {
    sender: {
      firstName: "Pierre",
      lastName: "Bernard",
      phone: "0634567890",
      address: {
        street: "25 Rue du Commerce",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    recipient: {
      firstName: "Olivia",
      lastName: "Giraud",
      phone: "0654321097",
      address: {
        street: "8 Rue Alsace Lorraine",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    size: "m",
    weight: 2.0,
    fragile: true,
    urgent: true,
    distanceKm: 245,
    price: 44.0,
    commission: 8.8,
    delivererAmount: 35.2,
  },

  // ── CLIENT 4 — Sophie Leblanc ──
  {
    sender: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "3 Rue de la République",
        city: "Lyon",
        postalCode: "69001",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    recipient: {
      firstName: "Paul",
      lastName: "Chevallier",
      phone: "0643210986",
      address: {
        street: "7 Rue Sainte-Catherine",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    size: "xxl",
    weight: 20.0,
    fragile: false,
    urgent: false,
    distanceKm: 550,
    price: 110.0,
    commission: 22.0,
    delivererAmount: 88.0,
  },
  {
    sender: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "3 Rue de la République",
        city: "Lyon",
        postalCode: "69001",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    recipient: {
      firstName: "Quentin",
      lastName: "Legrand",
      phone: "0632109875",
      address: {
        street: "15 Boulevard Magenta",
        city: "Paris",
        postalCode: "75010",
        lat: 48.8765,
        lng: 2.359,
      },
    },
    size: "s",
    weight: 1.2,
    fragile: true,
    urgent: false,
    distanceKm: 465,
    price: 36.0,
    commission: 7.2,
    delivererAmount: 28.8,
  },
  {
    sender: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "3 Rue de la République",
        city: "Lyon",
        postalCode: "69001",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    recipient: {
      firstName: "Rachel",
      lastName: "Bertrand",
      phone: "0621098764",
      address: {
        street: "29 Rue du Faubourg",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    size: "l",
    weight: 4.5,
    fragile: false,
    urgent: false,
    distanceKm: 490,
    price: 55.0,
    commission: 11.0,
    delivererAmount: 44.0,
  },
  // delivered
  {
    sender: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "3 Rue de la République",
        city: "Lyon",
        postalCode: "69001",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    recipient: {
      firstName: "Sébastien",
      lastName: "Collin",
      phone: "0610987653",
      address: {
        street: "5 Place Stanislas",
        city: "Nancy",
        postalCode: "54000",
        lat: 48.6937,
        lng: 6.1834,
      },
    },
    size: "m",
    weight: 3.0,
    fragile: false,
    urgent: true,
    distanceKm: 380,
    price: 52.0,
    commission: 10.4,
    delivererAmount: 41.6,
  },
  {
    sender: {
      firstName: "Sophie",
      lastName: "Leblanc",
      phone: "0645678901",
      address: {
        street: "3 Rue de la République",
        city: "Lyon",
        postalCode: "69001",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    recipient: {
      firstName: "Théo",
      lastName: "Blanchard",
      phone: "0609876542",
      address: {
        street: "18 Rue de la Monnaie",
        city: "Rouen",
        postalCode: "76000",
        lat: 49.4432,
        lng: 1.0993,
      },
    },
    size: "xl",
    weight: 9.0,
    fragile: true,
    urgent: false,
    distanceKm: 550,
    price: 78.0,
    commission: 15.6,
    delivererAmount: 62.4,
  },

  // ── CLIENT 5 — Thomas Robert ──
  {
    sender: {
      firstName: "Thomas",
      lastName: "Robert",
      phone: "0656789012",
      address: {
        street: "10 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    recipient: {
      firstName: "Ursula",
      lastName: "Roussel",
      phone: "0698765430",
      address: {
        street: "3 Rue de la Liberté",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    size: "m",
    weight: 2.8,
    fragile: false,
    urgent: false,
    distanceKm: 620,
    price: 58.0,
    commission: 11.6,
    delivererAmount: 46.4,
  },
  {
    sender: {
      firstName: "Thomas",
      lastName: "Robert",
      phone: "0656789012",
      address: {
        street: "10 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    recipient: {
      firstName: "Victor",
      lastName: "Perrot",
      phone: "0687654319",
      address: {
        street: "8 Rue des Dominicains",
        city: "Metz",
        postalCode: "57000",
        lat: 49.1193,
        lng: 6.1757,
      },
    },
    size: "s",
    weight: 0.7,
    fragile: true,
    urgent: true,
    distanceKm: 850,
    price: 46.0,
    commission: 9.2,
    delivererAmount: 36.8,
  },
  {
    sender: {
      firstName: "Thomas",
      lastName: "Robert",
      phone: "0656789012",
      address: {
        street: "10 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    recipient: {
      firstName: "Wendy",
      lastName: "Clement",
      phone: "0676543208",
      address: {
        street: "12 Avenue du Maréchal Foch",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    size: "xxl",
    weight: 18.0,
    fragile: false,
    urgent: false,
    distanceKm: 750,
    price: 120.0,
    commission: 24.0,
    delivererAmount: 96.0,
  },
  // delivered
  {
    sender: {
      firstName: "Thomas",
      lastName: "Robert",
      phone: "0656789012",
      address: {
        street: "10 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    recipient: {
      firstName: "Xavier",
      lastName: "Marion",
      phone: "0665432107",
      address: {
        street: "25 Rue Jeanne d'Arc",
        city: "Orléans",
        postalCode: "45000",
        lat: 47.9029,
        lng: 1.9039,
      },
    },
    size: "l",
    weight: 5.5,
    fragile: false,
    urgent: false,
    distanceKm: 580,
    price: 65.0,
    commission: 13.0,
    delivererAmount: 52.0,
  },
  {
    sender: {
      firstName: "Thomas",
      lastName: "Robert",
      phone: "0656789012",
      address: {
        street: "10 Place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        lat: 43.6047,
        lng: 1.4442,
      },
    },
    recipient: {
      firstName: "Yannick",
      lastName: "Dupont",
      phone: "0654321096",
      address: {
        street: "4 Rue de la Bourse",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    size: "m",
    weight: 2.2,
    fragile: true,
    urgent: false,
    distanceKm: 245,
    price: 38.0,
    commission: 7.6,
    delivererAmount: 30.4,
  },

  // ── CLIENT 6 — Camille Richard ──
  {
    sender: {
      firstName: "Camille",
      lastName: "Richard",
      phone: "0667890123",
      address: {
        street: "6 Rue du Général de Gaulle",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    recipient: {
      firstName: "Zoé",
      lastName: "Fontaine",
      phone: "0643210985",
      address: {
        street: "15 Rue du Temple",
        city: "Paris",
        postalCode: "75003",
        lat: 48.8632,
        lng: 2.3547,
      },
    },
    size: "l",
    weight: 4.0,
    fragile: false,
    urgent: true,
    distanceKm: 490,
    price: 68.0,
    commission: 13.6,
    delivererAmount: 54.4,
  },
  {
    sender: {
      firstName: "Camille",
      lastName: "Richard",
      phone: "0667890123",
      address: {
        street: "6 Rue du Général de Gaulle",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    recipient: {
      firstName: "Adrien",
      lastName: "Masson",
      phone: "0632109874",
      address: {
        street: "8 Place de la Comédie",
        city: "Montpellier",
        postalCode: "34000",
        lat: 43.6108,
        lng: 3.8767,
      },
    },
    size: "s",
    weight: 0.9,
    fragile: false,
    urgent: false,
    distanceKm: 700,
    price: 38.0,
    commission: 7.6,
    delivererAmount: 30.4,
  },
  {
    sender: {
      firstName: "Camille",
      lastName: "Richard",
      phone: "0667890123",
      address: {
        street: "6 Rue du Général de Gaulle",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    recipient: {
      firstName: "Baptiste",
      lastName: "Georges",
      phone: "0621098763",
      address: {
        street: "19 Rue Nationale",
        city: "Metz",
        postalCode: "57000",
        lat: 49.1193,
        lng: 6.1757,
      },
    },
    size: "xl",
    weight: 11.0,
    fragile: true,
    urgent: false,
    distanceKm: 60,
    price: 42.0,
    commission: 8.4,
    delivererAmount: 33.6,
  },
  // delivered
  {
    sender: {
      firstName: "Camille",
      lastName: "Richard",
      phone: "0667890123",
      address: {
        street: "6 Rue du Général de Gaulle",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    recipient: {
      firstName: "Charlotte",
      lastName: "Renaud",
      phone: "0610987652",
      address: {
        street: "11 Quai Voltaire",
        city: "Paris",
        postalCode: "75007",
        lat: 48.8598,
        lng: 2.3319,
      },
    },
    size: "m",
    weight: 3.8,
    fragile: false,
    urgent: true,
    distanceKm: 490,
    price: 72.0,
    commission: 14.4,
    delivererAmount: 57.6,
  },
  {
    sender: {
      firstName: "Camille",
      lastName: "Richard",
      phone: "0667890123",
      address: {
        street: "6 Rue du Général de Gaulle",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    recipient: {
      firstName: "David",
      lastName: "Leclerc",
      phone: "0609876541",
      address: {
        street: "7 Avenue Foch",
        city: "Nancy",
        postalCode: "54000",
        lat: 48.6937,
        lng: 6.1834,
      },
    },
    size: "s",
    weight: 1.1,
    fragile: true,
    urgent: false,
    distanceKm: 55,
    price: 22.0,
    commission: 4.4,
    delivererAmount: 17.6,
  },

  // ── CLIENT 7 — Nicolas Petit ──
  {
    sender: {
      firstName: "Nicolas",
      lastName: "Petit",
      phone: "0678901234",
      address: {
        street: "14 Boulevard Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    recipient: {
      firstName: "Élodie",
      lastName: "Gauthier",
      phone: "0698765429",
      address: {
        street: "2 Rue de la Cathédrale",
        city: "Rouen",
        postalCode: "76000",
        lat: 49.4432,
        lng: 1.0993,
      },
    },
    size: "m",
    weight: 2.1,
    fragile: false,
    urgent: false,
    distanceKm: 340,
    price: 42.0,
    commission: 8.4,
    delivererAmount: 33.6,
  },
  {
    sender: {
      firstName: "Nicolas",
      lastName: "Petit",
      phone: "0678901234",
      address: {
        street: "14 Boulevard Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    recipient: {
      firstName: "Fabien",
      lastName: "Picard",
      phone: "0687654318",
      address: {
        street: "5 Rue des Halles",
        city: "Angers",
        postalCode: "49000",
        lat: 47.4784,
        lng: -0.5632,
      },
    },
    size: "xxl",
    weight: 22.0,
    fragile: false,
    urgent: true,
    distanceKm: 90,
    price: 88.0,
    commission: 17.6,
    delivererAmount: 70.4,
  },
  {
    sender: {
      firstName: "Nicolas",
      lastName: "Petit",
      phone: "0678901234",
      address: {
        street: "14 Boulevard Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    recipient: {
      firstName: "Gaëlle",
      lastName: "Bouchard",
      phone: "0676543207",
      address: {
        street: "22 Rue Saint-Gilles",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    size: "l",
    weight: 6.5,
    fragile: true,
    urgent: false,
    distanceKm: 110,
    price: 48.0,
    commission: 9.6,
    delivererAmount: 38.4,
  },
  // delivered
  {
    sender: {
      firstName: "Nicolas",
      lastName: "Petit",
      phone: "0678901234",
      address: {
        street: "14 Boulevard Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    recipient: {
      firstName: "Henri",
      lastName: "Dumas",
      phone: "0665432106",
      address: {
        street: "18 Rue du Bac",
        city: "Paris",
        postalCode: "75007",
        lat: 48.8573,
        lng: 2.3261,
      },
    },
    size: "s",
    weight: 0.6,
    fragile: false,
    urgent: false,
    distanceKm: 385,
    price: 30.0,
    commission: 6.0,
    delivererAmount: 24.0,
  },
  {
    sender: {
      firstName: "Nicolas",
      lastName: "Petit",
      phone: "0678901234",
      address: {
        street: "14 Boulevard Victor Hugo",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    recipient: {
      firstName: "Irène",
      lastName: "Marchand",
      phone: "0654321095",
      address: {
        street: "9 Place du Marché",
        city: "Le Mans",
        postalCode: "72000",
        lat: 47.9956,
        lng: 0.1966,
      },
    },
    size: "xl",
    weight: 12.0,
    fragile: false,
    urgent: true,
    distanceKm: 120,
    price: 62.0,
    commission: 12.4,
    delivererAmount: 49.6,
  },

  // ── CLIENT 8 — Julie Moreau ──
  {
    sender: {
      firstName: "Julie",
      lastName: "Moreau",
      phone: "0689012345",
      address: {
        street: "8 Avenue de la Liberté",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    recipient: {
      firstName: "Julien",
      lastName: "Barbier",
      phone: "0643210984",
      address: {
        street: "14 Rue Saint-Nicolas",
        city: "Caen",
        postalCode: "14000",
        lat: 49.1829,
        lng: -0.3707,
      },
    },
    size: "s",
    weight: 1.3,
    fragile: true,
    urgent: false,
    distanceKm: 200,
    price: 28.0,
    commission: 5.6,
    delivererAmount: 22.4,
  },
  {
    sender: {
      firstName: "Julie",
      lastName: "Moreau",
      phone: "0689012345",
      address: {
        street: "8 Avenue de la Liberté",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    recipient: {
      firstName: "Kevin",
      lastName: "Roy",
      phone: "0632109873",
      address: {
        street: "6 Rue de la Monnaie",
        city: "Tours",
        postalCode: "37000",
        lat: 47.3941,
        lng: 0.6848,
      },
    },
    size: "m",
    weight: 4.2,
    fragile: false,
    urgent: true,
    distanceKm: 280,
    price: 52.0,
    commission: 10.4,
    delivererAmount: 41.6,
  },
  {
    sender: {
      firstName: "Julie",
      lastName: "Moreau",
      phone: "0689012345",
      address: {
        street: "8 Avenue de la Liberté",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    recipient: {
      firstName: "Laura",
      lastName: "Arnaud",
      phone: "0621098762",
      address: {
        street: "3 Place de la Victoire",
        city: "Bordeaux",
        postalCode: "33000",
        lat: 44.8378,
        lng: -0.5792,
      },
    },
    size: "l",
    weight: 7.5,
    fragile: false,
    urgent: false,
    distanceKm: 540,
    price: 72.0,
    commission: 14.4,
    delivererAmount: 57.6,
  },
  // delivered
  {
    sender: {
      firstName: "Julie",
      lastName: "Moreau",
      phone: "0689012345",
      address: {
        street: "8 Avenue de la Liberté",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    recipient: {
      firstName: "Mickael",
      lastName: "Leclercq",
      phone: "0610987651",
      address: {
        street: "20 Rue de la Paix",
        city: "Paris",
        postalCode: "75002",
        lat: 48.8698,
        lng: 2.3303,
      },
    },
    size: "xl",
    weight: 9.5,
    fragile: true,
    urgent: false,
    distanceKm: 350,
    price: 75.0,
    commission: 15.0,
    delivererAmount: 60.0,
  },
  {
    sender: {
      firstName: "Julie",
      lastName: "Moreau",
      phone: "0689012345",
      address: {
        street: "8 Avenue de la Liberté",
        city: "Rennes",
        postalCode: "35000",
        lat: 48.1173,
        lng: -1.6778,
      },
    },
    recipient: {
      firstName: "Nathalie",
      lastName: "Aubert",
      phone: "0609876540",
      address: {
        street: "11 Rue du Moulin",
        city: "Brest",
        postalCode: "29200",
        lat: 48.3904,
        lng: -4.4861,
      },
    },
    size: "s",
    weight: 0.4,
    fragile: false,
    urgent: true,
    distanceKm: 250,
    price: 35.0,
    commission: 7.0,
    delivererAmount: 28.0,
  },

  // ── CLIENT 9 — Antoine Simon ──
  {
    sender: {
      firstName: "Antoine",
      lastName: "Simon",
      phone: "0690123456",
      address: {
        street: "5 Rue Carnot",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    recipient: {
      firstName: "Océane",
      lastName: "Jacquet",
      phone: "0698765428",
      address: {
        street: "16 Rue Centrale",
        city: "Grenoble",
        postalCode: "38000",
        lat: 45.1885,
        lng: 5.7245,
      },
    },
    size: "m",
    weight: 3.2,
    fragile: false,
    urgent: false,
    distanceKm: 150,
    price: 35.0,
    commission: 7.0,
    delivererAmount: 28.0,
  },
  {
    sender: {
      firstName: "Antoine",
      lastName: "Simon",
      phone: "0690123456",
      address: {
        street: "5 Rue Carnot",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    recipient: {
      firstName: "Patrick",
      lastName: "Vidal",
      phone: "0687654317",
      address: {
        street: "9 Cours de Verdun",
        city: "Lyon",
        postalCode: "69002",
        lat: 45.7578,
        lng: 4.832,
      },
    },
    size: "xxl",
    weight: 25.0,
    fragile: false,
    urgent: true,
    distanceKm: 190,
    price: 125.0,
    commission: 25.0,
    delivererAmount: 100.0,
  },
  {
    sender: {
      firstName: "Antoine",
      lastName: "Simon",
      phone: "0690123456",
      address: {
        street: "5 Rue Carnot",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    recipient: {
      firstName: "Quentin",
      lastName: "Millet",
      phone: "0676543206",
      address: {
        street: "4 Rue de Bourgogne",
        city: "Strasbourg",
        postalCode: "67000",
        lat: 48.5734,
        lng: 7.7521,
      },
    },
    size: "s",
    weight: 1.0,
    fragile: true,
    urgent: false,
    distanceKm: 220,
    price: 25.0,
    commission: 5.0,
    delivererAmount: 20.0,
  },
  // delivered
  {
    sender: {
      firstName: "Antoine",
      lastName: "Simon",
      phone: "0690123456",
      address: {
        street: "5 Rue Carnot",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    recipient: {
      firstName: "Raphaël",
      lastName: "Pons",
      phone: "0665432105",
      address: {
        street: "7 Rue de Brest",
        city: "Nantes",
        postalCode: "44000",
        lat: 47.2184,
        lng: -1.5536,
      },
    },
    size: "l",
    weight: 6.0,
    fragile: false,
    urgent: false,
    distanceKm: 650,
    price: 72.0,
    commission: 14.4,
    delivererAmount: 57.6,
  },
  {
    sender: {
      firstName: "Antoine",
      lastName: "Simon",
      phone: "0690123456",
      address: {
        street: "5 Rue Carnot",
        city: "Dijon",
        postalCode: "21000",
        lat: 47.322,
        lng: 5.0415,
      },
    },
    recipient: {
      firstName: "Sandra",
      lastName: "Gonçalves",
      phone: "0654321094",
      address: {
        street: "18 Avenue des Ternes",
        city: "Paris",
        postalCode: "75017",
        lat: 48.8789,
        lng: 2.2985,
      },
    },
    size: "m",
    weight: 2.5,
    fragile: true,
    urgent: true,
    distanceKm: 315,
    price: 52.0,
    commission: 10.4,
    delivererAmount: 41.6,
  },

  // ── CLIENT 10 — Léa Laurent ──
  {
    sender: {
      firstName: "Léa",
      lastName: "Laurent",
      phone: "0601234567",
      address: {
        street: "12 Rue des Grands Augustins",
        city: "Paris",
        postalCode: "75006",
        lat: 48.853,
        lng: 2.3424,
      },
    },
    recipient: {
      firstName: "Thibault",
      lastName: "Perrin",
      phone: "0643210983",
      address: {
        street: "3 Rue d'Alsace",
        city: "Reims",
        postalCode: "51100",
        lat: 49.2583,
        lng: 4.0317,
      },
    },
    size: "l",
    weight: 4.8,
    fragile: false,
    urgent: false,
    distanceKm: 145,
    price: 45.0,
    commission: 9.0,
    delivererAmount: 36.0,
  },
  {
    sender: {
      firstName: "Léa",
      lastName: "Laurent",
      phone: "0601234567",
      address: {
        street: "12 Rue des Grands Augustins",
        city: "Paris",
        postalCode: "75006",
        lat: 48.853,
        lng: 2.3424,
      },
    },
    recipient: {
      firstName: "Ugo",
      lastName: "Rivière",
      phone: "0632109872",
      address: {
        street: "6 Rue Victor Hugo",
        city: "Amiens",
        postalCode: "80000",
        lat: 49.8942,
        lng: 2.2958,
      },
    },
    size: "s",
    weight: 0.8,
    fragile: false,
    urgent: true,
    distanceKm: 130,
    price: 26.0,
    commission: 5.2,
    delivererAmount: 20.8,
  },
  {
    sender: {
      firstName: "Léa",
      lastName: "Laurent",
      phone: "0601234567",
      address: {
        street: "12 Rue des Grands Augustins",
        city: "Paris",
        postalCode: "75006",
        lat: 48.853,
        lng: 2.3424,
      },
    },
    recipient: {
      firstName: "Valentine",
      lastName: "Legros",
      phone: "0621098761",
      address: {
        street: "10 Place d'Armes",
        city: "Versailles",
        postalCode: "78000",
        lat: 48.8044,
        lng: 2.1333,
      },
    },
    size: "xl",
    weight: 13.0,
    fragile: true,
    urgent: false,
    distanceKm: 25,
    price: 48.0,
    commission: 9.6,
    delivererAmount: 38.4,
  },
  // delivered
  {
    sender: {
      firstName: "Léa",
      lastName: "Laurent",
      phone: "0601234567",
      address: {
        street: "12 Rue des Grands Augustins",
        city: "Paris",
        postalCode: "75006",
        lat: 48.853,
        lng: 2.3424,
      },
    },
    recipient: {
      firstName: "William",
      lastName: "Berger",
      phone: "0610987650",
      address: {
        street: "14 Rue du Bac",
        city: "Rouen",
        postalCode: "76000",
        lat: 49.4432,
        lng: 1.0993,
      },
    },
    size: "m",
    weight: 2.8,
    fragile: false,
    urgent: false,
    distanceKm: 135,
    price: 32.0,
    commission: 6.4,
    delivererAmount: 25.6,
  },
  {
    sender: {
      firstName: "Léa",
      lastName: "Laurent",
      phone: "0601234567",
      address: {
        street: "12 Rue des Grands Augustins",
        city: "Paris",
        postalCode: "75006",
        lat: 48.853,
        lng: 2.3424,
      },
    },
    recipient: {
      firstName: "Alexia",
      lastName: "Dumont",
      phone: "0609876539",
      address: {
        street: "5 Place du Général de Gaulle",
        city: "Lille",
        postalCode: "59000",
        lat: 50.6292,
        lng: 3.0573,
      },
    },
    size: "xxl",
    weight: 16.0,
    fragile: false,
    urgent: true,
    distanceKm: 225,
    price: 115.0,
    commission: 23.0,
    delivererAmount: 92.0,
  },
];

// Mapping livreur → annonces delivered (index dans PARCELS_DATA)
// Chaque livreur reçoit 2 livraisons
const DELIVERY_MAPPING = [
  { livreurIdx: 0, parcelIdx: 3 }, // Livreur 1 → Client 1 annonce 4
  { livreurIdx: 1, parcelIdx: 4 }, // Livreur 2 → Client 1 annonce 5
  { livreurIdx: 2, parcelIdx: 8 }, // Livreur 3 → Client 2 annonce 4
  { livreurIdx: 3, parcelIdx: 9 }, // Livreur 4 → Client 2 annonce 5
  { livreurIdx: 4, parcelIdx: 13 }, // Livreur 5 → Client 3 annonce 4
  { livreurIdx: 5, parcelIdx: 14 }, // Livreur 6 → Client 3 annonce 5
  { livreurIdx: 6, parcelIdx: 18 }, // Livreur 7 → Client 4 annonce 4
  { livreurIdx: 7, parcelIdx: 19 }, // Livreur 8 → Client 4 annonce 5
  { livreurIdx: 8, parcelIdx: 23 }, // Livreur 9 → Client 5 annonce 4
  { livreurIdx: 9, parcelIdx: 24 }, // Livreur 10 → Client 5 annonce 5
  { livreurIdx: 0, parcelIdx: 28 }, // Livreur 1 → Client 6 annonce 4
  { livreurIdx: 1, parcelIdx: 29 }, // Livreur 2 → Client 6 annonce 5
  { livreurIdx: 2, parcelIdx: 33 }, // Livreur 3 → Client 7 annonce 4
  { livreurIdx: 3, parcelIdx: 34 }, // Livreur 4 → Client 7 annonce 5
  { livreurIdx: 4, parcelIdx: 38 }, // Livreur 5 → Client 8 annonce 4
  { livreurIdx: 5, parcelIdx: 39 }, // Livreur 6 → Client 8 annonce 5
  { livreurIdx: 6, parcelIdx: 43 }, // Livreur 7 → Client 9 annonce 4
  { livreurIdx: 7, parcelIdx: 44 }, // Livreur 8 → Client 9 annonce 5
  { livreurIdx: 8, parcelIdx: 48 }, // Livreur 9 → Client 10 annonce 4
  { livreurIdx: 9, parcelIdx: 49 }, // Livreur 10 → Client 10 annonce 5
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connecté");
  console.log("📊 Base de données:", mongoose.connection.db.databaseName);
  console.log("📊 Host:", mongoose.connection.host);

  const password = await bcrypt.hash("password123", 10);

  // ── Créer les clients ──
  console.log("👥 Création des clients...");
  const clients = [];
  for (const c of CLIENTS_DATA) {
    const existing = await User.findOne({ email: c.email });
    if (existing) {
      clients.push(existing);
      continue;
    }
    const user = await User.create({
      ...c,
      password,
      role: "client",
      isActive: true,
      isVerified: true,
    });
    clients.push(user);
    console.log(`  ✅ Client : ${c.firstName} ${c.lastName}`);
  }

  // ── Créer les livreurs ──
  console.log("👷 Création des livreurs...");
  const livreurs = [];
  for (const l of LIVREURS_DATA) {
    const existing = await User.findOne({ email: l.email });
    if (existing) {
      livreurs.push(existing);
      continue;
    }
    const user = await User.create({
      ...l,
      password,
      role: "livreur",
      isActive: true,
      isVerified: true,
    });
    livreurs.push(user);
    console.log(`  ✅ Livreur : ${l.firstName} ${l.lastName}`);
  }

  // ── Créer les annonces ──
  console.log("📦 Création des annonces...");
  const createdParcels = [];
  for (let i = 0; i < PARCELS_DATA.length; i++) {
    const p = PARCELS_DATA[i];
    const clientIdx = Math.floor(i / 5);
    const client = clients[clientIdx];
    const parcel = await Parcel.create({
      ...p,
      clientId: client._id,
      status: "pending",
      description: "",
    });
    createdParcels.push(parcel);
    console.log(
      `  📦 Annonce ${i + 1}/50 : ${p.sender.address.city} → ${p.recipient.address.city}`,
    );
  }

  // ── Créer les livraisons delivered ──
  console.log("🚗 Création des livraisons...");
  for (const mapping of DELIVERY_MAPPING) {
    const livreur = livreurs[mapping.livreurIdx];
    const parcel = createdParcels[mapping.parcelIdx];

    // Mettre à jour le colis
    await Parcel.findByIdAndUpdate(parcel._id, {
      status: "delivered",
      delivererId: livreur._id,
    });

    // Créer la livraison
    const validationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const delivery = await Delivery.create({
      parcelId: parcel._id,
      delivererId: livreur._id,
      clientId: parcel.clientId,
      status: "delivered",
      validationCode,
      pickupAt: new Date(
        Date.now() - 86400000 * Math.floor(Math.random() * 7 + 1),
      ),
      deliveredAt: new Date(
        Date.now() - 86400000 * Math.floor(Math.random() * 3),
      ),
    });

    console.log(
      `  ✅ Livraison : ${livreur.firstName} → ${parcel.sender.address.city} → ${parcel.recipient.address.city}`,
    );
  }

  console.log("\n🎉 Seed terminé avec succès !");
  console.log("─────────────────────────────────");
  console.log(`👥 ${clients.length} clients créés`);
  console.log(`👷 ${livreurs.length} livreurs créés`);
  console.log(`📦 ${createdParcels.length} annonces créées`);
  console.log(`🚗 ${DELIVERY_MAPPING.length} livraisons créées`);
  console.log("─────────────────────────────────");
  console.log("🔑 Mot de passe pour tous les comptes : password123");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
