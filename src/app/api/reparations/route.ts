import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculCoutTotalReparation,
  calculImpactBudgetReparation,
  calculImpactCarteCarburant,
} from "@/lib/budget";
import {
  appliquerVidangeSiNecessaire,
  debiterCarteCarburant,
  finaliserMaintenancePlanifiee,
  validateBudgetCamion,
} from "@/lib/budget-server";

// GET /api/reparations - Liste les réparations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");

    const where: Record<string, unknown> = {};
    if (camionId && camionId !== "tous") {
      where.camionId = parseInt(camionId);
    }
    const statut = searchParams.get("statut");
    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    const reparations = await prisma.reparation.findMany({
      where,
      include: {
        camion: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
        piecesChangees: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(reparations);
  } catch (error) {
    console.error("Erreur GET /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réparations" },
      { status: 500 }
    );
  }
}

// POST /api/reparations - Ajouter une réparation avec pièces changées
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.camionId ||
      !body.type ||
      !body.garage ||
      !body.description ||
      body.cout === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Champs obligatoires manquants : camionId, type, garage, description, cout",
        },
        { status: 400 }
      );
    }

    const camionId = parseInt(body.camionId);
    const km = body.kilometrage ? parseInt(body.kilometrage) : 0;
    const mainOeuvreCout = body.mainOeuvreCout
      ? parseFloat(body.mainOeuvreCout)
      : 0;
    const mainOeuvreSource = body.mainOeuvreSource || null;
    const statut = body.statut || "terminee";
    const pieces: {
      nom: string;
      quantite: number;
      prixUnitaire: number;
      sourcePaiement: string | null;
    }[] = (body.piecesChangees || []).map((p: {
      nom: string;
      quantite: number;
      prixUnitaire: number;
      sourcePaiement?: string;
    }) => ({
      nom: p.nom,
      quantite: parseInt(String(p.quantite)),
      prixUnitaire: parseFloat(String(p.prixUnitaire)),
      sourcePaiement: p.sourcePaiement || null,
    }));

    const cout = calculCoutTotalReparation(mainOeuvreCout, pieces);
    const impactBudget = calculImpactBudgetReparation({
      mainOeuvreCout,
      mainOeuvreSource,
      piecesChangees: pieces,
    });
    const impactCarte = calculImpactCarteCarburant(
      mainOeuvreCout,
      mainOeuvreSource,
      pieces
    );

    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      select: { kilometrageActuel: true },
    });

    if (!camion) {
      return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });
    }

    if (impactBudget > 0) {
      const budgetCheck = await validateBudgetCamion(camionId, impactBudget);
      if (!budgetCheck.ok) {
        return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
      }
    }

    const carteCarburantId = body.carteCarburantId
      ? parseInt(body.carteCarburantId)
      : null;

    if (impactCarte > 0) {
      if (!carteCarburantId) {
        return NextResponse.json(
          {
            error:
              "Une carte carburant est requise lorsque la main d'œuvre ou des pièces sont payées par carte.",
          },
          { status: 400 }
        );
      }
      try {
        await debiterCarteCarburant(carteCarburantId, impactCarte);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur carte carburant";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const reparation = await prisma.reparation.create({
      data: {
        camionId,
        date: body.date ? new Date(body.date) : new Date(),
        type: body.type,
        garage: body.garage,
        description: body.description,
        cout,
        kilometrage: km,
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        reference: body.reference || null,
        statut,
        mainOeuvreCout,
        mainOeuvreSource,
        carteCarburantId,
        piecesChangees: {
          create: pieces.map((p) => ({
            nom: p.nom,
            quantite: p.quantite,
            prixUnitaire: p.prixUnitaire,
            sourcePaiement: p.sourcePaiement,
          })),
        },
      },
      include: {
        piecesChangees: true,
      },
    });

    if (km > camion.kilometrageActuel) {
      await prisma.camion.update({
        where: { id: camionId },
        data: { kilometrageActuel: km },
      });

      await prisma.maintenancePlanifiee.updateMany({
        where: {
          camionId,
          statut: "planifie",
          kilometrageCible: { lte: km },
        },
        data: { statut: "en_retard" },
      });
    }

    if (statut === "terminee") {
      await appliquerVidangeSiNecessaire(
        camionId,
        body.type,
        statut,
        km
      );
      await finaliserMaintenancePlanifiee(
        camionId,
        body.type,
        reparation.id,
        km
      );
    }

    return NextResponse.json(reparation, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de la réparation" },
      { status: 500 }
    );
  }
}

// DELETE /api/reparations - Supprimer une réparation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    await prisma.reparation.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réparation" },
      { status: 500 }
    );
  }
}
