import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mois = searchParams.get("mois"); // optionnel ex: "6" (juin)
    const anneeStr = searchParams.get("annee") || String(new Date().getFullYear());
    const annee = parseInt(anneeStr);
    const camionId = searchParams.get("camionId");

    // ========================================================
    // 1. FILTRE TEMPOREL ET CAMION
    // ========================================================
    const dateFilter: any = {};
    if (mois) {
      const m = parseInt(mois);
      dateFilter.gte = new Date(annee, m - 1, 1);
      dateFilter.lt = new Date(annee, m, 1);
    } else {
      dateFilter.gte = new Date(annee, 0, 1);
      dateFilter.lt = new Date(annee + 1, 0, 1);
    }

    const whereVente: any = { date: dateFilter };
    const whereCarburant: any = { date: dateFilter };
    const whereReparation: any = { date: dateFilter };

    if (camionId && camionId !== "tous") {
      const cid = parseInt(camionId);
      whereVente.camionId = cid;
      whereCarburant.camionId = cid;
      whereReparation.camionId = cid;
    }

    // ========================================================
    // 2. RÉCUPÉRATION DES DONNÉES FINANCIÈRES
    // ========================================================
    const ventes = await prisma.vente.findMany({
      where: whereVente,
      include: { produit: true, camion: true },
    });

    const carburants = await prisma.carburant.findMany({
      where: whereCarburant,
    });

    const reparations = await prisma.reparation.findMany({
      where: whereReparation,
    });

    // CA = somme des ventes
    const chiffreAffaires = ventes.reduce((sum, v) => sum + v.montantTotal, 0);

    // Coût des matériaux achetés
    const coutMateriaux = ventes.reduce((sum, v) => sum + v.quantite * v.produit.prixAchat, 0);

    // Coût carburant
    const coutCarburant = carburants.reduce((sum, c) => sum + c.coutTotal, 0);

    // Coût réparations
    const coutReparations = reparations.reduce((sum, r) => sum + r.cout, 0);

    // Bénéfice Net
    const beneficeNet = chiffreAffaires - coutMateriaux - coutCarburant - coutReparations;

    // Factures impayées (toute période, ou période sélectionnée)
    const facturesImpayeesData = await prisma.vente.findMany({
      where: {
        statutPaiement: "en_attente",
        ...(camionId && camionId !== "tous" ? { camionId: parseInt(camionId) } : {}),
      },
    });
    const nbFacturesImpayees = facturesImpayeesData.length;
    const montantFacturesImpayees = facturesImpayeesData.reduce((sum, v) => sum + v.montantTotal, 0);

    // Camions en service
    const totalCamions = await prisma.camion.count();
    const camionsEnService = await prisma.camion.count({
      where: { statut: "en_service" },
    });

    // ========================================================
    // 3. ÉVOLUTION MENSUELLE SUR 12 MOIS (CA vs Bénéfice)
    // ========================================================
    const evolutionMensuelle = [];
    const moisLabels = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
    ];

    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const vMois = await prisma.vente.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionId && camionId !== "tous" ? { camionId: parseInt(camionId) } : {}),
        },
        include: { produit: true },
      });

      const cMois = await prisma.carburant.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionId && camionId !== "tous" ? { camionId: parseInt(camionId) } : {}),
        },
      });

      const rMois = await prisma.reparation.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionId && camionId !== "tous" ? { camionId: parseInt(camionId) } : {}),
        },
      });

      const caMois = vMois.reduce((sum, v) => sum + v.montantTotal, 0);
      const matMois = vMois.reduce((sum, v) => sum + v.quantite * v.produit.prixAchat, 0);
      const carbMois = cMois.reduce((sum, c) => sum + c.coutTotal, 0);
      const repMois = rMois.reduce((sum, r) => sum + r.cout, 0);
      const benMois = caMois - matMois - carbMois - repMois;

      evolutionMensuelle.push({
        name: moisLabels[i],
        "Chiffre d'Affaires": caMois,
        "Bénéfice": benMois,
      });
    }

    // ========================================================
    // 4. COMPARATIF PAR CAMION
    // ========================================================
    const camions = await prisma.camion.findMany();
    const comparatifCamions = [];

    for (const camion of camions) {
      const vCamion = await prisma.vente.findMany({
        where: {
          camionId: camion.id,
          date: dateFilter,
        },
        include: { produit: true },
      });

      const cCamion = await prisma.carburant.findMany({
        where: {
          camionId: camion.id,
          date: dateFilter,
        },
      });

      const rCamion = await prisma.reparation.findMany({
        where: {
          camionId: camion.id,
          date: dateFilter,
        },
      });

      const caC = vCamion.reduce((sum, v) => sum + v.montantTotal, 0);
      const matC = vCamion.reduce((sum, v) => sum + v.quantite * v.produit.prixAchat, 0);
      const carbC = cCamion.reduce((sum, c) => sum + c.coutTotal, 0);
      const repC = rCamion.reduce((sum, r) => sum + r.cout, 0);
      const benC = caC - matC - carbC - repC;
      const margeC = caC > 0 ? (benC / caC) * 100 : 0;

      comparatifCamions.push({
        id: camion.id,
        immatriculation: camion.immatriculation,
        marque: camion.marque,
        statut: camion.statut,
        capacite: camion.capaciteTonnes,
        chiffreAffaires: caC,
        carburant: carbC,
        reparation: repC,
        benefice: benC,
        marge: margeC,
      });
    }

    // ========================================================
    // 5. RÉPARTITION DES CHARGES (PieChart)
    // ========================================================
    const repartitionCharges = [
      { name: "Achats Matériaux", value: coutMateriaux },
      { name: "Carburant", value: coutCarburant },
      { name: "Réparations", value: coutReparations },
    ].filter(c => c.value > 0);

    return NextResponse.json({
      chiffreAffaires,
      beneficeNet,
      camionsEnService,
      totalCamions,
      nbFacturesImpayees,
      montantFacturesImpayees,
      evolutionMensuelle,
      comparatifCamions,
      repartitionCharges,
    });
  } catch (error) {
    console.error("Erreur GET /api/rapports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du rapport" },
      { status: 500 }
    );
  }
}
