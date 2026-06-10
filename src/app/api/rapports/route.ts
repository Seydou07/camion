import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculBudgetConsomme } from "@/lib/budget";

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
    // 2. RÉCUPÉRATION DES COÛTS ET DONNÉES
    // ========================================================
    const mouvementsCarburant = await prisma.mouvementCarburant.findMany({
      where: whereCarburant,
    });

    const reparations = await prisma.reparation.findMany({
      where: whereReparation,
    });

    // Coût carburant
    const coutCarburant = mouvementsCarburant.reduce((sum, m) => sum + m.montant, 0);

    // Coût réparations
    const coutReparations = reparations.reduce((sum, r) => sum + r.cout, 0);

    // Coût Total Exploitation
    const coutTotalExploitation = coutCarburant + coutReparations;

    // Camions en service
    const totalCamions = await prisma.camion.count();
    const camionsEnService = await prisma.camion.count({
      where: { statut: "en_service" },
    });

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

    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const mMois = await prisma.mouvementCarburant.findMany({
        where: {
          dateOperation: { gte: debutMois, lt: finMois },
          ...(camionIds.length > 0 ? { carburant: { camionId: { in: camionIds } } } : {}),
        },
      });

      const rMois = await prisma.reparation.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionIds.length > 0 ? { camionId: { in: camionIds } } : {}),
        },
      });

      const carbMois = mMois.reduce((sum, m) => sum + m.montant, 0);
      const repMois = rMois.reduce((sum, r) => sum + r.cout, 0);

      evolutionMensuelle.push({
        name: moisLabels[i],
        "Carburant": carbMois,
        "Maintenance": repMois,
      });
    }

    // ========================================================
    // 4. COMPARATIF PAR CAMION
    // ========================================================
    const camions = await prisma.camion.findMany({
      include: {
        chauffeur: true,
      },
    });
    const comparatifCamions = [];

    for (const camion of camions) {
      // Filtrage carburants et réparations sur la période spécifiée
      const mMoisCamion = await prisma.mouvementCarburant.findMany({
        where: {
          carburant: { camionId: camion.id },
          dateOperation: dateFilter,
        },
      });

      const rCamion = await prisma.reparation.findMany({
        where: {
          camionId: camion.id,
          date: dateFilter,
        },
        include: { piecesChangees: true },
      });

      const carbC = mMoisCamion.reduce((sum, m) => sum + m.montant, 0);
      const repC = rCamion.reduce((sum, r) => sum + r.cout, 0);
      const coutTotalC = carbC + repC;
      
      // budgetConsomme based on the current calculation rules
      const budgetConsomme = calculBudgetConsomme(carbC, rCamion);

      comparatifCamions.push({
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
        litres: 0, // Obsolete
        reparation: repC,
        coutTotal: coutTotalC,
        consoMoyenne: 0, // Obsolete
      });
    }

    // ========================================================
    // 5. RÉPARTITION DES DÉPENSES
    // ========================================================
    const repartitionCharges = [
      { name: "Carburant", value: coutCarburant },
      { name: "Maintenance", value: coutReparations },
    ].filter((c) => c.value > 0);

    // ========================================================
    // 6. FRÉQUENCE CARBURANT (nombre de mouvements / mois)
    // ========================================================
    const frequenceCarburant = [];
    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const mMois = await prisma.mouvementCarburant.findMany({
        where: {
          dateOperation: { gte: debutMois, lt: finMois },
          ...(camionIds.length > 0 ? { carburant: { camionId: { in: camionIds } } } : {}),
        },
      });

      frequenceCarburant.push({
        name: moisLabels[i],
        pleins: mMois.length,
        litres: 0, // Obsolete
        montant: mMois.reduce((s, m) => s + m.montant, 0),
      });
    }

    // ========================================================
    // 7. FRÉQUENCE MAINTENANCE (interventions / mois)
    // ========================================================
    const frequenceMaintenance = [];
    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const rMois = await prisma.reparation.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionIds.length > 0 ? { camionId: { in: camionIds } } : {}),
        },
      });

      frequenceMaintenance.push({
        name: moisLabels[i],
        interventions: rMois.length,
        montant: rMois.reduce((s, r) => s + r.cout, 0),
      });
    }

    // ========================================================
    // 8. BUDGET PAR VÉHICULE (dotation vs consommé annuel)
    // ========================================================
    const budgetParVehicule = comparatifCamions
      .filter((c) => c.dotationAnnuelle > 0 || c.budgetConsomme > 0)
      .map((c) => ({
        immatriculation: c.immatriculation,
        dotation: c.dotationAnnuelle,
        consomme: c.budgetConsomme,
        carburant: c.carburant,
        maintenance: c.reparation,
      }));

    // Dotation totale flotte
    const dotationTotale = camions.reduce(
      (s, c) => s + (c.dotationAnnuelle || 0),
      0
    );

    return NextResponse.json({
      coutCarburant,
      coutReparations,
      coutTotalExploitation,
      camionsEnService,
      totalCamions,
      nbAlertesMaintenance,
      evolutionMensuelle,
      comparatifCamions,
      repartitionCharges,
      frequenceCarburant,
      frequenceMaintenance,
      budgetParVehicule,
      dotationTotale,
      annee,
    });
  } catch (error) {
    console.error("Erreur GET /api/rapports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du rapport" },
      { status: 500 }
    );
  }
}

