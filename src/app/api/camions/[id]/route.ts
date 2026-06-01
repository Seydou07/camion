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
        carburants: { orderBy: { date: "desc" } },
        reparations: { orderBy: { date: "desc" } },
        ventes: {
          include: {
            client: true,
            produit: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!camion) {
      return NextResponse.json(
        { error: "Camion non trouvé" },
        { status: 404 }
      );
    }

    // Calcul des résumés financiers du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Ventes du mois
    const ventesMonth = camion.ventes.filter(
      (v) => new Date(v.date) >= startOfMonth
    );
    const totalVentesMois = ventesMonth.reduce((sum, v) => sum + v.montantTotal, 0);

    // Achats matériaux (basé sur le prix d'achat des produits vendus)
    const achatsMois = await prisma.vente.findMany({
      where: {
        camionId: camionId,
        date: { gte: startOfMonth },
      },
      include: { produit: true },
    });
    const totalAchatsMois = achatsMois.reduce(
      (sum, v) => sum + v.quantite * v.produit.prixAchat,
      0
    );

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

    // Bénéfice net du mois
    const beneficeNet =
      totalVentesMois - totalAchatsMois - totalCarburantMois - totalReparationsMois;

    // Calcul L/100km pour chaque plein (comparaison avec le plein précédent)
    const carburantsAvecConsommation = camion.carburants
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((c, index, arr) => {
        let consommation: number | null = null;
        if (index > 0) {
          const kmParcourus = c.kilometrage - arr[index - 1].kilometrage;
          if (kmParcourus > 0) {
            consommation = (c.litres / kmParcourus) * 100;
          }
        }
        return { ...c, consommation };
      })
      .reverse(); // Retour en ordre décroissant

    // Consommation moyenne
    const consommations = carburantsAvecConsommation.filter(
      (c) => c.consommation !== null
    );
    const consommationMoyenne =
      consommations.length > 0
        ? consommations.reduce((sum, c) => sum + (c.consommation || 0), 0) /
          consommations.length
        : null;

    // Km parcourus dans le mois
    const carburantsMoisTriés = carburantMois.sort(
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
          ventesTotal: totalVentesMois,
          achatsTotal: totalAchatsMois,
          carburantTotal: totalCarburantMois,
          litresTotal: totalLitresMois,
          reparationsTotal: totalReparationsMois,
          beneficeNet,
          kmParcourus,
          consommationMoyenne,
          quantiteLivree: ventesMonth.reduce((sum, v) => sum + v.quantite, 0),
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

    const camion = await prisma.camion.update({
      where: { id: camionId },
      data: {
        immatriculation: body.immatriculation,
        marque: body.marque,
        modele: body.modele || null,
        capaciteTonnes: parseFloat(body.capaciteTonnes),
        statut: body.statut,
        chauffeurNom: body.chauffeurNom || null,
        dateMiseService: new Date(body.dateMiseService),
        prochaineVisite: body.prochaineVisite
          ? new Date(body.prochaineVisite)
          : null,
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
