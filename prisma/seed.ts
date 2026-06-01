import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Début du seeding...");

  // Nettoyage des anciennes données
  await prisma.vente.deleteMany();
  await prisma.reparation.deleteMany();
  await prisma.carburant.deleteMany();
  await prisma.camion.deleteMany();
  await prisma.client.deleteMany();
  await prisma.produit.deleteMany();
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

  // 2. Création des Produits (Matériaux)
  const produits = await Promise.all([
    prisma.produit.create({
      data: { nom: "Sable 0/2", prixVente: 12000, prixAchat: 6000, unite: "tonne" },
    }),
    prisma.produit.create({
      data: { nom: "Gravier 8/12", prixVente: 15000, prixAchat: 8000, unite: "tonne" },
    }),
    prisma.produit.create({
      data: { nom: "Terre Végétale", prixVente: 18000, prixAchat: 9000, unite: "m3" },
    }),
    prisma.produit.create({
      data: { nom: "Tout Venant 0/31.5", prixVente: 10000, prixAchat: 5000, unite: "tonne" },
    }),
  ]);
  console.log(`${produits.length} produits créés.`);

  // 3. Création des Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: { nom: "SOGEA TP", contact: "Michel Martin", adresse: "Zone Industrielle, Dakar", email: "contact@sogeatp.sn", typePrix: "preferentiel" },
    }),
    prisma.client.create({
      data: { nom: "Eiffage Sénégal", contact: "Awa Ndiaye", adresse: "Route de Rufisque, Dakar", email: "awa.ndiaye@eiffage.com", typePrix: "preferentiel" },
    }),
    prisma.client.create({
      data: { nom: "Entreprise Fall & Fils", contact: "Amadou Fall", adresse: "Mbour", email: "info@fallfils.sn", typePrix: "standard" },
    }),
    prisma.client.create({
      data: { nom: "BTP Horizon", contact: "Pierre Gomez", adresse: "Thiès", email: "p.gomez@btphorizon.sn", typePrix: "standard" },
    }),
  ]);
  console.log(`${clients.length} clients créés.`);

  // 4. Création des Camions
  const dateMiseService = new Date("2024-01-15");
  const prochaineVisite = new Date("2026-08-15");

  const camions = await Promise.all([
    prisma.camion.create({
      data: { immatriculation: "AA-123-BB", marque: "Volvo", modele: "FMX 420", capaciteTonnes: 20, statut: "en_service", chauffeurNom: "Moussa Diallo", dateMiseService, prochaineVisite },
    }),
    prisma.camion.create({
      data: { immatriculation: "CC-456-DD", marque: "Mercedes-Benz", modele: "Arocs 3240", capaciteTonnes: 26, statut: "en_service", chauffeurNom: "Ibrahima Sow", dateMiseService, prochaineVisite },
    }),
    prisma.camion.create({
      data: { immatriculation: "EE-789-FF", marque: "MAN", modele: "TGS 33.400", capaciteTonnes: 32, statut: "en_panne", chauffeurNom: "Sékou Touré", dateMiseService, prochaineVisite },
    }),
    prisma.camion.create({
      data: { immatriculation: "GG-012-HH", marque: "Renault", modele: "Kerax", capaciteTonnes: 18, statut: "en_attente", chauffeurNom: "Ousmane Cissé", dateMiseService, prochaineVisite },
    }),
    prisma.camion.create({
      data: { immatriculation: "II-345-JJ", marque: "Scania", modele: "G410", capaciteTonnes: 24, statut: "en_service", chauffeurNom: "Abdoulaye Ndiaye", dateMiseService, prochaineVisite },
    }),
  ]);
  console.log(`${camions.length} camions créés.`);

  // 5. Ajout de l'historique de Carburant
  console.log("Génération de l'historique carburant...");
  const carburants: any[] = [];
  const baseDates = [
    new Date("2026-05-02"),
    new Date("2026-05-10"),
    new Date("2026-05-18"),
    new Date("2026-05-25"),
    new Date("2026-05-30"),
  ];

  for (const camion of camions) {
    let km = 120000;
    for (let i = 0; i < baseDates.length; i++) {
      km += Math.floor(Math.random() * 400) + 250; // incrément km
      const litres = Math.floor(Math.random() * 80) + 120; // 120 à 200L
      const prixLitre = 750; // Prix moyen du gasoil en FCFA
      const coutTotal = litres * prixLitre;

      carburants.push(
        prisma.carburant.create({
          data: {
            camionId: camion.id,
            date: baseDates[i],
            kilometrage: km,
            litres,
            prixLitre,
            coutTotal,
          },
        })
      );
    }
  }
  await Promise.all(carburants);

  // 6. Ajout des Réparations
  console.log("Génération des réparations...");
  await Promise.all([
    prisma.reparation.create({
      data: { camionId: camions[2].id, date: new Date("2026-05-12"), type: "mecanique", garage: "Garage BTP Pro", description: "Changement kit d'embrayage et volant moteur", cout: 450000 },
    }),
    prisma.reparation.create({
      data: { camionId: camions[0].id, date: new Date("2026-05-05"), type: "pneus", garage: "Pneumatiques Dakar", description: "Remplacement de 2 pneus arrières d'origine usés", cout: 240000 },
    }),
    prisma.reparation.create({
      data: { camionId: camions[1].id, date: new Date("2026-05-20"), type: "vidange", garage: "Volvo Service", description: "Vidange moteur + remplacement de tous les filtres", cout: 85000 },
    }),
  ]);

  // 7. Ajout des Ventes (et facturation)
  console.log("Génération des ventes...");
  const ventesData = [
    { camionId: camions[0].id, clientId: clients[0].id, produitId: produits[0].id, quantite: 20, prixUnitaire: 11000, statutPaiement: "paye", date: new Date("2026-05-02"), numeroFacture: "FACT-202605-0001" },
    { camionId: camions[1].id, clientId: clients[1].id, produitId: produits[1].id, quantite: 26, prixUnitaire: 14000, statutPaiement: "paye", date: new Date("2026-05-04"), numeroFacture: "FACT-202605-0002" },
    { camionId: camions[4].id, clientId: clients[2].id, produitId: produits[2].id, quantite: 24, prixUnitaire: 18000, statutPaiement: "en_attente", date: new Date("2026-05-15"), numeroFacture: "FACT-202605-0003" },
    { camionId: camions[0].id, clientId: clients[3].id, produitId: produits[3].id, quantite: 20, prixUnitaire: 10000, statutPaiement: "en_attente", date: new Date("2026-05-18"), numeroFacture: "FACT-202605-0004" },
    { camionId: camions[1].id, clientId: clients[0].id, produitId: produits[0].id, quantite: 25, prixUnitaire: 11000, statutPaiement: "paye", date: new Date("2026-05-22"), numeroFacture: "FACT-202605-0005" },
    { camionId: camions[4].id, clientId: clients[1].id, produitId: produits[1].id, quantite: 24, prixUnitaire: 14000, statutPaiement: "paye", date: new Date("2026-05-28"), numeroFacture: "FACT-202605-0006" },
  ];

  await Promise.all(
    ventesData.map((v) =>
      prisma.vente.create({
        data: {
          camionId: v.camionId,
          clientId: v.clientId,
          produitId: v.produitId,
          quantite: v.quantite,
          prixUnitaire: v.prixUnitaire,
          montantTotal: v.quantite * v.prixUnitaire,
          statutPaiement: v.statutPaiement,
          numeroFacture: v.numeroFacture,
          date: v.date,
        },
      })
    )
  );

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
