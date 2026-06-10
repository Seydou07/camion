import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBudgetCamion, recalculerBudgetCamion } from "@/lib/budget-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    const where: any = {};
    if (camionId && camionId !== "tous") where.camionId = parseInt(camionId);
    if (statut && statut !== "tous") where.statut = statut;

    if (search) {
      where.OR = [
        { numeroVoyage: { contains: search } },
        { destination: { contains: search } },
        { camion: { immatriculation: { contains: search } } },
        { chauffeur: { nom: { contains: search } } },
        { chauffeur: { prenom: { contains: search } } },
      ];
    }

    const voyages = await prisma.voyage.findMany({
      where,
      include: {
        camion: { select: { id: true, immatriculation: true, marque: true, budgetConsomme: true, budgetRestant: true, dotationAnnuelle: true } },
        chauffeur: { select: { id: true, nom: true, prenom: true } },
        carburant: {
          include: {
            mouvements: {
              orderBy: { dateOperation: "desc" },
              include: {
                recus: true
              }
            }
          }
        },
      },
      orderBy: { dateDebut: "desc" },
    });

    return NextResponse.json(voyages);
  } catch (error) {
    console.error("Erreur GET /api/voyages:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des voyages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.camionId || !body.destination || !body.kilometrageDepart) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const camionId = parseInt(body.camionId);
    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
    });

    if (!camion) return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });

    const montantPrevision = body.montantPrevisionCarburant ? parseFloat(body.montantPrevisionCarburant) : 0;
    
    // Valider le budget du véhicule
    if (montantPrevision > 0) {
      const budgetCheck = await validateBudgetCamion(camionId, montantPrevision);
      if (!budgetCheck.ok) {
        return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
      }
    }

    // Générer le numéro de voyage unique
    const count = await prisma.voyage.count();
    const numeroVoyage = `VOY-${(count + 1).toString().padStart(4, "0")}`;

    const chauffeurId = body.chauffeurId ? parseInt(body.chauffeurId) : camion.chauffeurId;

    // Création du voyage, du dossier carburant et du mouvement initial (PREVISION) en une transaction
    const voyage = await prisma.$transaction(async (tx) => {
      const v = await tx.voyage.create({
        data: {
          numeroVoyage,
          camionId,
          chauffeurId,
          destination: body.destination,
          kilometrageDepart: parseInt(body.kilometrageDepart),
          dateDebut: body.dateDebut ? new Date(body.dateDebut) : new Date(),
          montantPrevisionCarburant: montantPrevision,
          observations: body.observations || null,
          statut: "EN_COURS",
        },
      });

      const carb = await tx.carburant.create({
        data: {
          voyageId: v.id,
          camionId,
          chauffeurId,
          montantPrevision,
          totalComplements: 0,
          totalDepenses: montantPrevision,
          totalRecuValide: 0,
          statut: "EN_COURS",
        },
      });

      if (montantPrevision > 0) {
        await tx.mouvementCarburant.create({
          data: {
            carburantId: carb.id,
            dateOperation: v.dateDebut,
            typeOperation: "PREVISION",
            montant: montantPrevision,
            commentaire: "Plein initial de départ (prévision)",
          },
        });
      }

      return v;
    });

    // Recalculer et mettre à jour le budget persistant du camion
    await recalculerBudgetCamion(camionId);

    return NextResponse.json(voyage, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/voyages:", error);
    return NextResponse.json({ error: "Erreur lors de la création du voyage" }, { status: 500 });
  }
}
