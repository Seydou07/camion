import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculBudgetConsomme } from "@/lib/budget";

// Activer le caching Vercel pour que la réponse soit instantanée (60 secondes)
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mois = searchParams.get("mois");
    const anneeStr = searchParams.get("annee") || String(new Date().getFullYear());
    const annee = parseInt(anneeStr);
    const camionIdsRaw = searchParams.get("camionIds");
    const camionIds = camionIdsRaw ? camionIdsRaw.split(",").map(Number).filter((n) => !isNaN(n)) : [];

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

    const whereCarburant: any = { dateOperation: dateFilter };
    const whereReparation: any = { date: dateFilter };

    if (camionIds.length > 0) {
      whereCarburant.carburant = { camionId: { in: camionIds } };
      whereReparation.camionId = { in: camionIds };
    }

    // ========================================================
    // 2. RÉCUPÉRATION DE TOUTES LES DONNÉES EN 1 SEUL PASSAGE (OPTIMISATION)
    // ========================================================

    // Fetch TOUS les mouvements carburants en une requête
    const mouvementsCarburant = await prisma.mouvementCarburant.findMany({
      where: whereCarburant,
      include: { carburant: { select: { camionId: true } } },
    });

    // Fetch TOUTES les réparations en une requête
    const reparations = await prisma.reparation.findMany({
      where: whereReparation,
      include: { piecesChangees: true },
    });

    // Fetch TOUS les camions en une requête
    const camions = await prisma.camion.findMany({
      include: { chauffeur: true },
      where: camionIds.length > 0 ? { id: { in: camionIds } } : {},
    });

    // Coût carburant total
    const coutCarburant = mouvementsCarburant.reduce((sum, m) => sum + m.montant, 0);

    // Coût réparations total
    const coutReparations = reparations.reduce((sum, r) => sum + r.cout, 0);

    // Coût Total Exploitation
    const coutTotalExploitation = coutCarburant + coutReparations;

    // Camions en service
    const totalCamions = camions.length;
    const camionsEnService = camions.filter((c) => c.statut === "en_service").length;

    // Nombre d'alertes de maintenance (en retard)
    const nbAlertesMaintenance = await prisma.maintenancePlanifiee.count({
      where: {
        statut: "en_retard",
        ...(camionIds.length > 0 ? { camionId: { in: camionIds } } : {}),
      },
    });

    // ========================================================
    // 3. ÉVOLUTION MENSUELLE DES DÉPENSES (Carburant vs Maintenance)
    // ========================================================
    const evolutionMensuelle = [];
    const moisLabels = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
    ];

    // Créer un index pour grouper les mouvements et réparations par mois
    const mouvementsParMois: Record<number, number[]> = {};
    const reparationsParMois: Record<number, number[]> = {};

    for (let i = 0; i < 12; i++) {
      mouvementsParMois[i] = [];
      reparationsParMois[i] = [];
    }

    // Grouper les mouvements par mois
    mouvementsCarburant.forEach((m) => {
      const moisM = m.dateOperation.getMonth();
      if (m.dateOperation.getFullYear() === annee) {
        mouvementsParMois[moisM].push(m.montant);
      }
    });

    // Grouper les réparations par mois
    reparations.forEach((r) => {
      const moisR = r.date.getMonth();
      if (r.date.getFullYear() === annee) {
        reparationsParMois[moisR].push(r.cout);
      }
    });

    for (let i = 0; i < 12; i++) {
      const carbMois = mouvementsParMois[i].reduce((a, b) => a + b, 0);
      const repMois = reparationsParMois[i].reduce((a, b) => a + b, 0);

      evolutionMensuelle.push({
        name: moisLabels[i],
        "Carburant": carbMois,
        "Maintenance": repMois,
      });
    }

    // ========================================================
    // 4. COMPARATIF PAR CAMION (TRÈS OPTIMISÉ : NO MORE N+1)
    // ========================================================

    // Créer des index par camionId pour grouper les données rapidement
    const mouvementsParCamionId: Record<number, typeof mouvementsCarburant> = {};
    const reparationsParCamionId: Record<number, typeof reparations> = {};

    camions.forEach((c) => {
      mouvementsParCamionId[c.id] = [];
      reparationsParCamionId[c.id] = [];
    });

    mouvementsCarburant.forEach((m) => {
      const camionId = m.carburant.camionId;
      if (mouvementsParCamionId[camionId]) {
        mouvementsParCamionId[camionId].push(m);
      }
    });

    reparations.forEach((r) => {
      if (reparationsParCamionId[r.camionId]) {
        reparationsParCamionId[r.camionId].push(r);
      }
    });

    const comparatifCamions = camions.map((camion) => {
      const mMoisCamion = mouvementsParCamionId[camion.id] || [];
      const rCamion = reparationsParCamionId[camion.id] || [];

      const carbC = mMoisCamion.reduce((sum, m) => sum + m.montant, 0);
      const repC = rCamion.reduce((sum, r) => sum + r.cout, 0);
      const coutTotalC = carbC + repC;

      const budgetConsomme = calculBudgetConsomme(carbC, rCamion);

      return {
        id: camion.id,
        immatriculation: camion.immatriculation,
        marque: camion.marque,
        statut: camion.statut,
        capacite: camion.capaciteTonnes,
        dotationAnnuelle: camion.dotationAnnuelle || 0,
        budgetConsomme,
        chauffeurNom: camion.chauffeur
          ? `${camion.chauffeur.prenom || ""} ${camion.chauffeur.nom}`
          : "Non assigné",
        kilometrage: camion.kilometrageActuel,
        carburant: carbC,
        litres: 0,
        reparation: repC,
        coutTotal: coutTotalC,
        consoMoyenne: 0,
      };
    });

    // ========================================================
    // 5. RÉPARTITION DES DÉPENSES
    // ========================================================
    const repartitionCharges = [
      { name: "Carburant", value: coutCarburant },
      { name: "Maintenance", value: coutReparations },
    ].filter((c) => c.value > 0);

    // ========================================================
    // 6. FRÉQUENCE CARBURANT ET MAINTENANCE (OPTIMISÉ)
    // ========================================================
    const frequenceCarburant = [];
    const frequenceMaintenance = [];

    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const nMois = mouvementsParMois[i].length;
      const montantMois = mouvementsParMois[i].reduce((a, b) => a + b, 0);
      frequenceCarburant.push({
        name: moisLabels[i],
        pleins: nMois,
        litres: 0,
        montant: montantMois,
      });

      const nRMois = reparationsParMois[i].length;
      frequenceMaintenance.push({
        name: moisLabels[i],
        interventions: nRMois,
      });
    }

    // ========================================================
    // 7. BUDGET GLOBAL
    // ========================================================
    let budgetGlobal = 0;
    try {
      const budgetParam = await prisma.parametreGlobal.findUnique({
        where: { cle: "budget_annuel_global" },
      });
      if (budgetParam) {
        budgetGlobal = parseFloat(budgetParam.valeur);
      }
    } catch (e) {
      console.error("Erreur budget:", e);
    }

    const budgetConsommeGlobal = coutCarburant + coutReparations;
    const budgetRestantGlobal = budgetGlobal - budgetConsommeGlobal;

    return NextResponse.json({
      coutCarburant,
      coutReparations,
      coutTotalExploitation,
      totalCamions,
      camionsEnService,
      nbAlertesMaintenance,
      evolutionMensuelle,
      comparatifCamions,
      repartitionCharges,
      frequenceCarburant,
      frequenceMaintenance,
      budgetGlobal,
      budgetConsommeGlobal,
      budgetRestantGlobal,
    });
  } catch (error) {
    console.error("Erreur GET /api/rapports:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des rapports" },
      { status: 500 }
    );
  }
}
