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
  getBudgetConsommeCamion,
  validateBudgetCamion,
} from "@/lib/budget-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    const existingReparation = await prisma.reparation.findUnique({
      where: { id },
      include: { piecesChangees: true },
    });

    if (!existingReparation) {
      return NextResponse.json(
        { error: "Réparation introuvable" },
        { status: 404 }
      );
    }

    const pieces: {
      nom: string;
      quantite: number;
      prixUnitaire: number;
      sourcePaiement: string | null;
    }[] = (body.piecesChangees || existingReparation.piecesChangees).map(
      (p: {
        nom: string;
        quantite: number;
        prixUnitaire: number;
        sourcePaiement?: string | null;
      }) => ({
        nom: p.nom,
        quantite: parseInt(String(p.quantite)),
        prixUnitaire: parseFloat(String(p.prixUnitaire)),
        sourcePaiement: p.sourcePaiement || null,
      })
    );

    const mainOeuvreCout =
      body.mainOeuvreCout !== undefined
        ? parseFloat(body.mainOeuvreCout)
        : existingReparation.mainOeuvreCout;
    const mainOeuvreSource =
      body.mainOeuvreSource !== undefined
        ? body.mainOeuvreSource
        : existingReparation.mainOeuvreSource;
    const statut = body.statut || existingReparation.statut;
    const type = body.type || existingReparation.type;
    const km =
      body.kilometrage !== undefined
        ? parseInt(body.kilometrage)
        : existingReparation.kilometrage;

    const nouveauImpactBudget = calculImpactBudgetReparation({
      mainOeuvreCout,
      mainOeuvreSource,
      piecesChangees: pieces,
    });
    const ancienImpactBudget = calculImpactBudgetReparation(existingReparation);
    const deltaBudget = nouveauImpactBudget - ancienImpactBudget;

    if (deltaBudget > 0) {
      const budgetCheck = await validateBudgetCamion(
        existingReparation.camionId,
        deltaBudget
      );
      if (!budgetCheck.ok) {
        return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
      }
    }

    const nouveauImpactCarte = calculImpactCarteCarburant(
      mainOeuvreCout,
      mainOeuvreSource,
      pieces
    );
    const ancienImpactCarte = calculImpactCarteCarburant(
      existingReparation.mainOeuvreCout,
      existingReparation.mainOeuvreSource,
      existingReparation.piecesChangees
    );
    const deltaCarte = nouveauImpactCarte - ancienImpactCarte;
    const carteCarburantId = body.carteCarburantId
      ? parseInt(body.carteCarburantId)
      : existingReparation.carteCarburantId;

    if (deltaCarte > 0) {
      if (!carteCarburantId) {
        return NextResponse.json(
          { error: "Carte carburant requise pour ce mode de paiement." },
          { status: 400 }
        );
      }
      try {
        await debiterCarteCarburant(carteCarburantId, deltaCarte);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur carte carburant";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const cout = calculCoutTotalReparation(mainOeuvreCout, pieces);

    if (body.piecesChangees) {
      await prisma.pieceChangee.deleteMany({
        where: { reparationId: id },
      });
    }

    const dataToUpdate: Record<string, unknown> = {
      type,
      garage: body.garage ?? existingReparation.garage,
      description: body.description ?? existingReparation.description,
      cout,
      kilometrage: km,
      statut,
      mainOeuvreCout,
      mainOeuvreSource,
      carteCarburantId,
      reference: body.reference ?? existingReparation.reference,
    };

    if (body.date) dataToUpdate.date = new Date(body.date);
    if (body.dateFin) dataToUpdate.dateFin = new Date(body.dateFin);

    if (body.piecesChangees) {
      dataToUpdate.piecesChangees = {
        create: pieces.map((p) => ({
          nom: p.nom,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
          sourcePaiement: p.sourcePaiement,
        })),
      };
    }

    const updated = await prisma.reparation.update({
      where: { id },
      data: dataToUpdate,
      include: { piecesChangees: true },
    });

    if (km > 0) {
      const camion = await prisma.camion.findUnique({
        where: { id: updated.camionId },
        select: { kilometrageActuel: true },
      });
      if (camion && km > camion.kilometrageActuel) {
        await prisma.camion.update({
          where: { id: updated.camionId },
          data: { kilometrageActuel: km },
        });
      }
    }

    if (statut === "terminee" && existingReparation.statut !== "terminee") {
      await appliquerVidangeSiNecessaire(
        updated.camionId,
        type,
        statut,
        km
      );
      await finaliserMaintenancePlanifiee(
        updated.camionId,
        type,
        updated.id,
        km
      );
    }

    const budgetConsomme = await getBudgetConsommeCamion(updated.camionId);

    return NextResponse.json({ ...updated, budgetConsomme });
  } catch (error) {
    console.error("Erreur PUT /api/reparations/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la réparation" },
      { status: 500 }
    );
  }
}
