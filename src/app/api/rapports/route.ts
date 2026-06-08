import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculBudgetConsomme } from "@/lib/budget";

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

    const whereCarburant: any = { date: dateFilter };
    const whereReparation: any = { date: dateFilter };

    if (camionId && camionId !== "tous") {
      const cid = parseInt(camionId);
      whereCarburant.camionId = cid;
      whereReparation.camionId = cid;
    }

    // ========================================================
    // 2. RÉCUPÉRATION DES COÛTS ET DONNÉES
    // ========================================================
    const carburants = await prisma.carburant.findMany({
      where: whereCarburant,
    });

    const reparations = await prisma.reparation.findMany({
      where: whereReparation,
    });

    // Coût carburant
    const coutCarburant = carburants.reduce((sum, c) => sum + c.coutTotal, 0);

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
        ...(camionId && camionId !== "tous" ? { camionId: parseInt(camionId) } : {}),
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

      const carbMois = cMois.reduce((sum, c) => sum + c.coutTotal, 0);
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
        carburants: true,
      },
    });
    const comparatifCamions = [];

    for (const camion of camions) {
      // Filtrage carburants et réparations sur la période spécifiée
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
        include: { piecesChangees: true },
      });

      const carbC = cCamion.reduce((sum, c) => sum + c.coutTotal, 0);
      const repC = rCamion.reduce((sum, r) => sum + r.cout, 0);
      const budgetConsomme = calculBudgetConsomme(cCamion, rCamion);
      const coutTotalC = carbC + repC;
      const litresC = cCamion.reduce((sum, c) => sum + c.litres, 0);

      // Calcul consommation moyenne sur l'historique complet de ce camion
      const carburantsTriés = [...camion.carburants].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const consommations = [];
      for (let idx = 1; idx < carburantsTriés.length; idx++) {
        const kmParcourus = carburantsTriés[idx].kilometrage - carburantsTriés[idx - 1].kilometrage;
        if (kmParcourus > 0) {
          consommations.push((carburantsTriés[idx].litres / kmParcourus) * 100);
        }
      }
      const consoMoyenne =
        consommations.length > 0
          ? consommations.reduce((sum, val) => sum + val, 0) / consommations.length
          : null;

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
        litres: litresC,
        reparation: repC,
        coutTotal: coutTotalC,
        consoMoyenne: consoMoyenne ? Math.round(consoMoyenne * 10) / 10 : 0,
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
    // 6. FRÉQUENCE CARBURANT (nombre de pleins + litres / mois)
    // ========================================================
    const frequenceCarburant = [];
    for (let i = 0; i < 12; i++) {
      const debutMois = new Date(annee, i, 1);
      const finMois = new Date(annee, i + 1, 1);

      const cMois = await prisma.carburant.findMany({
        where: {
          date: { gte: debutMois, lt: finMois },
          ...(camionId && camionId !== "tous"
            ? { camionId: parseInt(camionId) }
            : {}),
        },
      });

      frequenceCarburant.push({
        name: moisLabels[i],
        pleins: cMois.length,
        litres: Math.round(cMois.reduce((s, c) => s + c.litres, 0)),
        montant: cMois.reduce((s, c) => s + c.coutTotal, 0),
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
          ...(camionId && camionId !== "tous"
            ? { camionId: parseInt(camionId) }
            : {}),
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
