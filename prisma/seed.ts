import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Début du seeding de la flotte...");

  // Nettoyage des anciennes données
  await prisma.maintenancePlanifiee.deleteMany();
  await prisma.pieceChangee.deleteMany();
  await prisma.reparation.deleteMany();
  await prisma.carburant.deleteMany();
  await prisma.camion.deleteMany();
  await prisma.chauffeur.deleteMany();
  await prisma.user.deleteMany();

  // 1. Création de l'utilisateur Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: hashedPassword,
      name: "Admin TruckManager",
      role: "admin",
    },
  });
  console.log("Utilisateur admin créé:", admin.email);

  // 2. Création des Chauffeurs
  console.log("Création des chauffeurs...");
  const chauffeurs = await Promise.all([
    prisma.chauffeur.create({
      data: { nom: "Diallo", prenom: "Moussa", telephone: "+221 77 123 45 67", numeroPermis: "DK-2022-876", statut: "actif" },
    }),
    prisma.chauffeur.create({
      data: { nom: "Sow", prenom: "Ibrahima", telephone: "+221 78 543 21 09", numeroPermis: "DK-2021-342", statut: "actif" },
    }),
    prisma.chauffeur.create({
      data: { nom: "Touré", prenom: "Sékou", telephone: "+221 76 999 88 77", numeroPermis: "DK-2020-009", statut: "actif" },
    }),
    prisma.chauffeur.create({
      data: { nom: "Cissé", prenom: "Ousmane", telephone: "+221 70 444 33 22", numeroPermis: "DK-2023-111", statut: "actif" },
    }),
    prisma.chauffeur.create({
      data: { nom: "Ndiaye", prenom: "Abdoulaye", telephone: "+221 77 888 99 00", numeroPermis: "DK-2019-998", statut: "actif" },
    }),
  ]);
  console.log(`${chauffeurs.length} chauffeurs créés.`);

  // 3. Création des Camions
  console.log("Création des camions...");
  const dateMiseService = new Date("2024-01-15");
  const prochaineVisite = new Date("2026-08-15");

  const camions = await Promise.all([
    prisma.camion.create({
      data: {
        immatriculation: "AA-123-BB",
        marque: "Volvo",
        modele: "FMX 420",
        capaciteTonnes: 20,
        statut: "en_service",
        kilometrageActuel: 125400,
        dateMiseService,
        prochaineVisite,
        chauffeurId: chauffeurs[0].id,
      },
    }),
    prisma.camion.create({
      data: {
        immatriculation: "CC-456-DD",
        marque: "Mercedes-Benz",
        modele: "Arocs 3240",
        capaciteTonnes: 26,
        statut: "en_service",
        kilometrageActuel: 84300,
        dateMiseService,
        prochaineVisite,
        chauffeurId: chauffeurs[1].id,
      },
    }),
    prisma.camion.create({
      data: {
        immatriculation: "EE-789-FF",
        marque: "MAN",
        modele: "TGS 33.400",
        capaciteTonnes: 32,
        statut: "en_panne",
        kilometrageActuel: 165000,
        dateMiseService,
        prochaineVisite,
        chauffeurId: chauffeurs[2].id,
      },
    }),
    prisma.camion.create({
      data: {
        immatriculation: "GG-012-HH",
        marque: "Renault",
        modele: "Kerax",
        capaciteTonnes: 18,
        statut: "en_attente",
        kilometrageActuel: 98000,
        dateMiseService,
        prochaineVisite,
        chauffeurId: chauffeurs[3].id,
      },
    }),
    prisma.camion.create({
      data: {
        immatriculation: "II-345-JJ",
        marque: "Scania",
        modele: "G410",
        capaciteTonnes: 24,
        statut: "en_service",
        kilometrageActuel: 112000,
        dateMiseService,
        prochaineVisite,
        chauffeurId: chauffeurs[4].id,
      },
    }),
  ]);
  console.log(`${camions.length} camions créés.`);

  // 4. Ajout de l'historique de Carburant (Tickets)
  console.log("Génération de l'historique carburant (tickets)...");
  const fuelStations = ["Shell Patte d'Oie", "Total Yoff", "Oilibya VDN", "Ola Energy Rufisque"];
  const carburants: any[] = [];
  const baseDates = [
    new Date("2026-05-02"),
    new Date("2026-05-10"),
    new Date("2026-05-18"),
    new Date("2026-05-25"),
    new Date("2026-05-30"),
  ];

  const initialKms = [123500, 82500, 163000, 96000, 110000];

  for (let cIdx = 0; cIdx < camions.length; cIdx++) {
    const camion = camions[cIdx];
    let km = initialKms[cIdx];
    const chauffeur = chauffeurs[cIdx];

    for (let i = 0; i < baseDates.length; i++) {
      km += Math.floor(Math.random() * 300) + 300; // incrément km (300 à 600 km)
      const litres = Math.floor(Math.random() * 60) + 100; // 100 à 160L
      const prixLitre = 750; // Prix moyen du gasoil en FCFA
      const coutTotal = litres * prixLitre;
      const numeroTicket = `TKT-202605-${camion.immatriculation.replace(/-/g, "")}-${i}`;

      carburants.push(
        prisma.carburant.create({
          data: {
            camionId: camion.id,
            date: baseDates[i],
            kilometrage: km,
            litres,
            prixLitre,
            coutTotal,
            numeroTicket,
            stationService: fuelStations[i % fuelStations.length],
            recuUrl: `/receipts/fuel-${camion.id}-${i}.jpg`,
            chauffeurId: chauffeur.id,
          },
        })
      );
    }
  }
  await Promise.all(carburants);
  console.log("Tickets carburant insérés.");

  // 5. Ajout des Réparations et Pièces Changées
  console.log("Génération des réparations et pièces changées...");
  
  // Réparation 1
  const rep1 = await prisma.reparation.create({
    data: {
      camionId: camions[2].id, // MAN (en panne)
      date: new Date("2026-05-12"),
      type: "mecanique",
      garage: "Garage BTP Pro",
      description: "Changement kit d'embrayage complet et main d'œuvre",
      cout: 450000,
      kilometrage: 164000,
    },
  });
  await prisma.pieceChangee.createMany({
    data: [
      { reparationId: rep1.id, nom: "Kit Embrayage MAN TGS", quantite: 1, prixUnitaire: 350000 },
      { reparationId: rep1.id, nom: "Main d'œuvre mécanique", quantite: 1, prixUnitaire: 100000 },
    ],
  });

  // Réparation 2
  const rep2 = await prisma.reparation.create({
    data: {
      camionId: camions[0].id, // Volvo
      date: new Date("2026-05-05"),
      type: "pneus",
      garage: "Pneumatiques Dakar",
      description: "Remplacement de deux pneus arrière usés",
      cout: 240000,
      kilometrage: 124200,
    },
  });
  await prisma.pieceChangee.createMany({
    data: [
      { reparationId: rep2.id, nom: "Pneu Michelin 13R22.5", quantite: 2, prixUnitaire: 120000 },
    ],
  });

  // Réparation 3
  const rep3 = await prisma.reparation.create({
    data: {
      camionId: camions[1].id, // Mercedes
      date: new Date("2026-05-20"),
      type: "vidange",
      garage: "Volvo Service",
      description: "Vidange moteur standard avec changement des filtres principaux",
      cout: 85000,
      kilometrage: 83800,
    },
  });
  await prisma.pieceChangee.createMany({
    data: [
      { reparationId: rep3.id, nom: "Filtre à Huile Arocs", quantite: 1, prixUnitaire: 15000 },
      { reparationId: rep3.id, nom: "Filtre à Carburant", quantite: 1, prixUnitaire: 20000 },
      { reparationId: rep3.id, nom: "Huile moteur 15W40 (20L)", quantite: 1, prixUnitaire: 50000 },
    ],
  });
  console.log("Réparations et pièces de rechange insérées.");

  // 6. Ajout des Maintenances Planifiées (Echéances)
  console.log("Planification des maintenances prédictives...");
  await Promise.all([
    // Volvo (125,400 km) - Prochaine vidange planifiée à 130k
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[0].id,
        type: "vidange",
        description: "Vidange standard d'huile moteur et filtres",
        frequenceKilometrage: 10000,
        kilometrageDernier: 120000,
        kilometrageCible: 130000,
        statut: "planifie",
      },
    }),
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[0].id,
        type: "freins",
        description: "Changement des plaquettes et disques de frein",
        frequenceKilometrage: 30000,
        kilometrageDernier: 120000,
        kilometrageCible: 150000,
        statut: "planifie",
      },
    }),

    // Mercedes (84,300 km) - Vidange planifiée à 90k
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[1].id,
        type: "vidange",
        description: "Vidange huile moteur Mercedes Arocs",
        frequenceKilometrage: 10000,
        kilometrageDernier: 80000,
        kilometrageCible: 90000,
        statut: "planifie",
      },
    }),

    // MAN (165,000 km) - Vidange EN RETARD (Cible 160,000 km)
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[2].id,
        type: "vidange",
        description: "Vidange huile moteur MAN TGS",
        frequenceKilometrage: 10000,
        kilometrageDernier: 150000,
        kilometrageCible: 160000,
        statut: "en_retard",
      },
    }),

    // Renault Kerax (98,000 km) - Remplacement pneus bientôt requis (Cible 100k)
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[3].id,
        type: "pneus",
        description: "Contrôle et remplacement pneus train avant",
        frequenceKilometrage: 50000,
        kilometrageDernier: 50000,
        kilometrageCible: 100000,
        statut: "planifie",
      },
    }),

    // Scania (112,000 km) - Visite technique planifiée à 120k
    prisma.maintenancePlanifiee.create({
      data: {
        camionId: camions[4].id,
        type: "visite_technique",
        description: "Contrôle technique annuel obligatoire",
        frequenceKilometrage: 20000,
        kilometrageDernier: 100000,
        kilometrageCible: 120000,
        statut: "planifie",
      },
    }),
  ]);
  console.log("Planifications de maintenance créées.");

  console.log("Seeding de gestion de flotte terminé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
