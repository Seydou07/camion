import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/camions/[id] - Récupérer un camion avec tous ses détails
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const camionId = parseInt(id);

    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      include: {
        chauffeur: true,
        carburants: { 
          orderBy: { date: "desc" },
          include: { chauffeur: true }
        },
        reparations: { 
          orderBy: { date: "desc" },
          include: { piecesChangees: true }
        },
        maintenancesPlanifiees: {
          orderBy: { kilometrageCible: "asc" }
        }
      },
    });

    if (!camion) {
      return NextResponse.json(
        { error: "Camion non trouvé" },
        { status: 404 }
      );
    }

    // Calcul des résumés d'exploitation du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Carburant du mois
    const carburantMois = camion.carburants.filter(
      (c) => new Date(c.date) >= startOfMonth
    );
    const totalCarburantMois = carburantMois.reduce(
      (sum, c) => sum + c.coutTotal,
      0
    );
    const totalLitresMois = carburantMois.reduce(
      (sum, c) => sum + c.litres,
      0
    );

    // Réparations du mois et de l'année
    const reparationsMois = camion.reparations.filter(
      (r) => new Date(r.date) >= startOfMonth
    );
    const totalReparationsMois = reparationsMois.reduce(
      (sum, r) => sum + r.cout,
      0
    );

    const reparationsAnnee = camion.reparations.filter(
      (r) => new Date(r.date) >= startOfYear
    );
    const totalReparationsAnnee = reparationsAnnee.reduce(
      (sum, r) => sum + r.cout,
      0
    );

    // Calcul L/100km pour chaque plein (comparaison avec le plein précédent)
    const carburantsTriés = [...camion.carburants].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const carburantsAvecConsommation = camion.carburants.map((c) => {
      // Trouver le plein précédent chronologiquement pour ce véhicule
      const indexDansTri = carburantsTriés.findIndex((ct) => ct.id === c.id);
      let consommation: number | null = null;
      if (indexDansTri > 0) {
        const precedent = carburantsTriés[indexDansTri - 1];
        const kmParcourus = c.kilometrage - precedent.kilometrage;
        if (kmParcourus > 0) {
          consommation = (c.litres / kmParcourus) * 100;
        }
      }
      return { ...c, consommation };
    });

    // Consommation moyenne globale calculée sur tout l'historique
    const consommations = carburantsAvecConsommation.filter(
      (c) => c.consommation !== null
    );
    const consommationMoyenne =
      consommations.length > 0
        ? consommations.reduce((sum, c) => sum + (c.consommation || 0), 0) /
          consommations.length
        : null;

    // Km parcourus dans le mois
    const carburantsMoisTriés = [...carburantMois].sort(
      (a, b) => a.kilometrage - b.kilometrage
    );
    const kmParcourus =
      carburantsMoisTriés.length >= 2
        ? carburantsMoisTriés[carburantsMoisTriés.length - 1].kilometrage -
          carburantsMoisTriés[0].kilometrage
        : 0;

    return NextResponse.json({
      ...camion,
      carburants: carburantsAvecConsommation,
      resume: {
        mois: {
          carburantTotal: totalCarburantMois,
          litresTotal: totalLitresMois,
          reparationsTotal: totalReparationsMois,
          kmParcourus,
          consommationMoyenne,
        },
        annee: {
          reparationsTotal: totalReparationsAnnee,
          nbInterventions: reparationsAnnee.length,
        },
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/camions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du camion" },
      { status: 500 }
    );
  }
}

// PUT /api/camions/[id] - Modifier un camion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const camionId = parseInt(id);
    const body = await request.json();

    const cid = body.chauffeurId ? parseInt(body.chauffeurId) : null;

    // Si on change le chauffeur, on libère le chauffeur de son ancien camion éventuel
    if (cid) {
      await prisma.camion.updateMany({
        where: { chauffeurId: cid, id: { not: camionId } },
        data: { chauffeurId: null },
      });
    }

    const camion = await prisma.camion.update({
      where: { id: camionId },
      data: {
        immatriculation: body.immatriculation,
        marque: body.marque,
        modele: body.modele || null,
        capaciteTonnes: parseFloat(body.capaciteTonnes),
        statut: body.statut,
        kilometrageActuel: body.kilometrageActuel ? parseInt(body.kilometrageActuel) : undefined,
        dateMiseService: new Date(body.dateMiseService),
        prochaineVisite: body.prochaineVisite ? new Date(body.prochaineVisite) : null,
        annee: body.annee ? parseInt(body.annee) : null,
        numeroChassis: body.numeroChassis || null,
        couleur: body.couleur || null,
        carburant: body.carburant || "Diesel",
        capaciteReservoir: body.capaciteReservoir ? parseInt(body.capaciteReservoir) : null,
        transmission: body.transmission || "Manuelle",
        dotationAnnuelle: body.dotationAnnuelle ? parseFloat(body.dotationAnnuelle) : null,
        frequenceVidange: body.frequenceVidange ? parseInt(body.frequenceVidange) : null,
        echeanceAssurance: body.echeanceAssurance ? new Date(body.echeanceAssurance) : null,
        numeroPoliceAssurance: body.numeroPoliceAssurance || null,
        compagnieAssurance: body.compagnieAssurance || null,
        notes: body.notes || null,
        chauffeurId: cid,
      },
    });

    return NextResponse.json(camion);
  } catch (error) {
    console.error("Erreur PUT /api/camions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du camion" },
      { status: 500 }
    );
  }
}

// DELETE /api/camions/[id] - Supprimer un camion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const camionId = parseInt(id);

    await prisma.camion.delete({
      where: { id: camionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/camions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du camion" },
      { status: 500 }
    );
  }
}
