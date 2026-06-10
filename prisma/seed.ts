import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Nettoyage complet de la base de données...");

  await prisma.recuCarburant.deleteMany();
  await prisma.mouvementCarburant.deleteMany();
  await prisma.carburant.deleteMany();
  await prisma.voyage.deleteMany();
  await prisma.pieceChangee.deleteMany();
  await prisma.reparation.deleteMany();
  await prisma.maintenancePlanifiee.deleteMany();
  await prisma.carteCarburant.deleteMany();
  await prisma.camion.deleteMany();
  await prisma.chauffeur.deleteMany();
  await prisma.parametreGlobal.deleteMany();
  await prisma.user.deleteMany();

  console.log("Base de données nettoyée.");

  // 1. Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { email: "admin@gmail.com", password: hashedPassword, name: "Admin TruckManager", role: "admin" },
  });
  console.log("Utilisateur admin créé.");

  // 2. 10 Chauffeurs
  const chauffeursData = [
    { nom: "Sow", prenom: "Moussa", telephone: "771234567", numeroPermis: "DK-12345", statut: "actif" },
    { nom: "Diallo", prenom: "Abdoulaye", telephone: "781234567", numeroPermis: "DK-23456", statut: "actif" },
    { nom: "Ndiaye", prenom: "Fatou", telephone: "701234567", numeroPermis: "DK-34567", statut: "actif" },
    { nom: "Gaye", prenom: "Ibrahima", telephone: "761234567", numeroPermis: "DK-45678", statut: "actif" },
    { nom: "Kane", prenom: "Ousmane", telephone: "779876543", numeroPermis: "DK-56789", statut: "actif" },
    { nom: "Ba", prenom: "Amadou", telephone: "789876543", numeroPermis: "DK-67890", statut: "actif" },
    { nom: "Fall", prenom: "Cheikh", telephone: "709876543", numeroPermis: "DK-78901", statut: "actif" },
    { nom: "Diop", prenom: "Modou", telephone: "769876543", numeroPermis: "DK-89012", statut: "actif" },
    { nom: "Sarr", prenom: "Pape", telephone: "775554433", numeroPermis: "DK-90123", statut: "actif" },
    { nom: "Cisse", prenom: "Aliou", telephone: "785554433", numeroPermis: "DK-01234", statut: "actif" },
  ];

  const chauffeurs = [];
  for (const c of chauffeursData) {
    const ch = await prisma.chauffeur.create({ data: c });
    chauffeurs.push(ch);
  }
  console.log(`${chauffeurs.length} chauffeurs créés.`);

  // 3. Budget global 35 000 000
  await prisma.parametreGlobal.upsert({
    where: { cle: "budget_annuel_global" },
    update: { valeur: "35000000" },
    create: { cle: "budget_annuel_global", valeur: "35000000", description: "Budget annuel total pour la flotte" },
  });
  console.log("Budget global de 35 000 000 F CFA inséré.");

  // 4. 10 Camions — neufs (0 km), dotation 1 500 000 chacun
  const camionsData = [
    {
      immatriculation: "AA-123-BB", marque: "Mercedes-Benz", modele: "Actros",
      annee: 2023, couleur: "Blanc", numeroChassis: "WDB9630011L123456",
      dateMiseService: new Date("2023-05-01"), prochaineVisite: new Date("2026-05-01"),
      echeanceAssurance: new Date("2026-12-31"), compagnieAssurance: "AXA Assurance",
      numeroPoliceAssurance: "POL-998877", capaciteReservoir: 400, capaciteTonnes: 20,
    },
    {
      immatriculation: "CC-456-DD", marque: "Volvo", modele: "FH16",
      annee: 2022, couleur: "Bleu Nuit", numeroChassis: "YV2RT40A1LA654321",
      dateMiseService: new Date("2022-10-15"), prochaineVisite: new Date("2025-10-15"),
      echeanceAssurance: new Date("2026-10-15"), compagnieAssurance: "NSIA Assurance",
      numeroPoliceAssurance: "POL-112233", capaciteReservoir: 600, capaciteTonnes: 25,
    },
    {
      immatriculation: "EE-789-FF", marque: "Scania", modele: "R500",
      annee: 2024, couleur: "Rouge", numeroChassis: "XLE12345678901234",
      dateMiseService: new Date("2024-01-20"), prochaineVisite: new Date("2027-01-20"),
      echeanceAssurance: new Date("2027-01-20"), compagnieAssurance: "Allianz",
      numeroPoliceAssurance: "POL-445566", capaciteReservoir: 500, capaciteTonnes: 18,
    },
    {
      immatriculation: "GG-012-HH", marque: "MAN", modele: "TGX",
      annee: 2021, couleur: "Gris Métallisé", numeroChassis: "WMA12345678901234",
      dateMiseService: new Date("2021-03-12"), prochaineVisite: new Date("2026-03-12"),
      echeanceAssurance: new Date("2026-03-12"), compagnieAssurance: "SAHAM",
      numeroPoliceAssurance: "POL-778899", capaciteReservoir: 450, capaciteTonnes: 22,
    },
    {
      immatriculation: "II-345-JJ", marque: "DAF", modele: "XF",
      annee: 2023, couleur: "Jaune", numeroChassis: "XLR12345678901234",
      dateMiseService: new Date("2023-08-05"), prochaineVisite: new Date("2026-08-05"),
      echeanceAssurance: new Date("2026-08-05"), compagnieAssurance: "SUNU Assurance",
      numeroPoliceAssurance: "POL-334455", capaciteReservoir: 550, capaciteTonnes: 20,
    },
    {
      immatriculation: "KK-678-LL", marque: "Renault", modele: "Range T",
      annee: 2022, couleur: "Blanc Arctique", numeroChassis: "VF612345678901234",
      dateMiseService: new Date("2022-11-30"), prochaineVisite: new Date("2025-11-30"),
      echeanceAssurance: new Date("2026-11-30"), compagnieAssurance: "AXA",
      numeroPoliceAssurance: "POL-223344", capaciteReservoir: 480, capaciteTonnes: 19,
    },
    {
      immatriculation: "MM-901-NN", marque: "Iveco", modele: "S-Way",
      annee: 2023, couleur: "Bleu Azur", numeroChassis: "WJM12345678901234",
      dateMiseService: new Date("2023-04-18"), prochaineVisite: new Date("2026-04-18"),
      echeanceAssurance: new Date("2026-04-18"), compagnieAssurance: "CNART",
      numeroPoliceAssurance: "POL-556677", capaciteReservoir: 520, capaciteTonnes: 21,
    },
    {
      immatriculation: "OO-234-PP", marque: "Mercedes-Benz", modele: "Arocs",
      annee: 2020, couleur: "Orange", numeroChassis: "WDB9630011L998877",
      dateMiseService: new Date("2020-09-22"), prochaineVisite: new Date("2026-09-22"),
      echeanceAssurance: new Date("2026-09-22"), compagnieAssurance: "ASKIA",
      numeroPoliceAssurance: "POL-667788", capaciteReservoir: 380, capaciteTonnes: 26,
    },
    {
      immatriculation: "QQ-567-RR", marque: "Volvo", modele: "FMX",
      annee: 2021, couleur: "Noir", numeroChassis: "YV2RT40A1LA001122",
      dateMiseService: new Date("2021-12-05"), prochaineVisite: new Date("2026-12-05"),
      echeanceAssurance: new Date("2026-12-05"), compagnieAssurance: "AXA",
      numeroPoliceAssurance: "POL-889900", capaciteReservoir: 580, capaciteTonnes: 24,
    },
    {
      immatriculation: "SS-890-TT", marque: "Scania", modele: "G450",
      annee: 2022, couleur: "Vert Forêt", numeroChassis: "XLE12345678909988",
      dateMiseService: new Date("2022-02-14"), prochaineVisite: new Date("2027-02-14"),
      echeanceAssurance: new Date("2027-02-14"), compagnieAssurance: "SUNU",
      numeroPoliceAssurance: "POL-443322", capaciteReservoir: 490, capaciteTonnes: 20,
    },
  ];

  const camions = [];
  for (let i = 0; i < camionsData.length; i++) {
    const c = camionsData[i];
    const camion = await prisma.camion.create({
      data: {
        immatriculation: c.immatriculation,
        marque: c.marque,
        modele: c.modele,
        annee: c.annee,
        couleur: c.couleur,
        numeroChassis: c.numeroChassis,
        dateMiseService: c.dateMiseService,
        prochaineVisite: c.prochaineVisite,
        echeanceAssurance: c.echeanceAssurance,
        compagnieAssurance: c.compagnieAssurance,
        numeroPoliceAssurance: c.numeroPoliceAssurance,
        capaciteReservoir: c.capaciteReservoir,
        capaciteTonnes: c.capaciteTonnes,
        frequenceVidange: 1000,
        kilometrageActuel: 0,
        dotationAnnuelle: 1500000,
        budgetConsomme: 0,
        budgetRestant: 1500000,
        carburant: "Diesel",
        transmission: i % 2 === 0 ? "Manuelle" : "Automatique",
        statut: "en_service",
        chauffeurId: chauffeurs[i].id,
      },
    });
    camions.push(camion);
  }
  console.log(`${camions.length} camions créés (neufs, 0 km, 1 500 000 F CFA chacun).`);

  // 5. Maintenance planifiée — 1000 km pour chaque camion
  for (const camion of camions) {
    await prisma.maintenancePlanifiee.create({
      data: {
        camionId: camion.id,
        type: "vidange",
        description: "Première vidange moteur après mise en service",
        frequenceKilometrage: 1000,
        kilometrageDernier: 0,
        kilometrageCible: 1000,
        statut: "planifie",
      },
    });
  }
  console.log("Maintenances planifiées créées (intervalle 1000 km).");

  console.log("Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
