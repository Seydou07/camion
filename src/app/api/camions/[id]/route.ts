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
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const startOfYear = new Date(currentYear, 0, 1);

    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      include: {
        chauffeur: true,
        reparations: { 
          orderBy: { date: "desc" },
          take: 3,
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

    const [
      recentCarburants,
      carburantCount,
      carburantAnneeAgg,
      reparationsMoisAgg,
      reparationsMoisCount,
      reparationsAnneeAgg,
      reparationsAnneeCount,
      maintenanceFrequency,
    ] = await Promise.all([
      prisma.carburant.findMany({
        where: { camionId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          chauffeur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      }),
      prisma.carburant.count({
        where: { camionId },
      }),
      prisma.carburant.aggregate({
        where: {
          camionId,
          createdAt: { gte: startOfYear },
        },
        _sum: {
          totalDepenses: true,
        },
      }),
      prisma.reparation.aggregate({
        where: {
          camionId,
          date: { gte: startOfMonth },
        },
        _sum: {
          cout: true,
        },
      }),
      prisma.reparation.count({
        where: {
          camionId,
          date: { gte: startOfMonth },
        },
      }),
      prisma.reparation.aggregate({
        where: {
          camionId,
          date: { gte: startOfYear },
        },
        _sum: {
          cout: true,
        },
      }),
      prisma.reparation.count({
        where: {
          camionId,
          date: { gte: startOfYear },
        },
      }),
      Promise.all(
        Array.from({ length: 12 }, async (_, monthIndex) => {
          const monthStart = new Date(currentYear, monthIndex, 1);
          const nextMonthStart = new Date(currentYear, monthIndex + 1, 1);
          const interventions = await prisma.reparation.count({
            where: {
              camionId,
              date: {
                gte: monthStart,
                lt: nextMonthStart,
              },
            },
          });

          return {
            label: monthStart
              .toLocaleDateString("fr-FR", { month: "short" })
              .replace(".", ""),
            interventions,
          };
        })
      ),
    ]);

    const totalCarburantAnnee = carburantAnneeAgg._sum.totalDepenses || 0;
    const totalReparationsMois = reparationsMoisAgg._sum.cout || 0;
    const totalReparationsAnnee = reparationsAnneeAgg._sum.cout || 0;

    return NextResponse.json({
      ...camion,
      recentCarburants,
      recentReparations: camion.reparations,
      counts: {
        carburants: carburantCount,
        reparations: reparationsAnneeCount,
        reparationsMois: reparationsMoisCount,
      },
      maintenanceFrequency,
      stats: {
        budgetCarburantConsomme: totalCarburantAnnee,
        budgetMaintenanceConsomme: totalReparationsAnnee,
      },
      resume: {
        mois: {
          reparationsTotal: totalReparationsMois,
        },
        annee: {
          reparationsTotal: totalReparationsAnnee,
          nbInterventions: reparationsAnneeCount,
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
