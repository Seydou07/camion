import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBudgetCamion } from "@/lib/budget-server";

// GET /api/carburant - Liste les tickets carburant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");

    const where: Record<string, unknown> = {};
    if (camionId && camionId !== "tous") {
      where.camionId = parseInt(camionId);
    }

    const carburantsRaw = await prisma.carburant.findMany({
      where,
      orderBy: { date: "desc" },
      include: { receipts: true },
    });

    const camionIds = [...new Set(carburantsRaw.map((c) => c.camionId))];
    const chauffeurIds = [
      ...new Set(
        carburantsRaw.map((c) => c.chauffeurId).filter((id): id is number => id != null)
      ),
    ];

    const [camionsList, chauffeursList] = await Promise.all([
      camionIds.length
        ? prisma.camion.findMany({
            where: { id: { in: camionIds } },
            select: {
              id: true,
              immatriculation: true,
              marque: true,
              modele: true,
            },
          })
        : Promise.resolve([]),
      chauffeurIds.length
        ? prisma.chauffeur.findMany({
            where: { id: { in: chauffeurIds } },
            select: { id: true, nom: true, prenom: true },
          })
        : Promise.resolve([]),
    ]);

    const camionMap = new Map(camionsList.map((c) => [c.id, c]));
    const chauffeurMap = new Map(chauffeursList.map((ch) => [ch.id, ch]));

    const carburants = carburantsRaw.map((c) => ({
      ...c,
      camion: camionMap.get(c.camionId) || null,
      chauffeur: c.chauffeurId
        ? chauffeurMap.get(c.chauffeurId) || null
        : null,
    }));

    return NextResponse.json(carburants);
  } catch (error) {
    console.error("Erreur GET /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tickets carburant" },
      { status: 500 }
    );
  }
}

// POST /api/carburant - Ajouter un ticket carburant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.camionId || !body.kilometrage || !body.litres || !body.prixLitre) {
      return NextResponse.json(
        {
          error:
            "Champs obligatoires manquants : camionId, kilometrage, litres, prixLitre",
        },
        { status: 400 }
      );
    }

    const camionId = parseInt(body.camionId);
    const nouveauKm = parseInt(body.kilometrage);
    const litres = parseFloat(body.litres);
    const prixLitre = parseFloat(body.prixLitre);
    const coutTotal = body.coutTotal
      ? parseFloat(body.coutTotal)
      : litres * prixLitre;
    const estPlein = body.estPlein !== undefined ? Boolean(body.estPlein) : true;
    const typeOperation = body.typeOperation || "plein_depot";
    const voyageId = body.voyageId ? parseInt(body.voyageId) : null;

    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      select: {
        kilometrageActuel: true,
        chauffeurId: true,
        dotationAnnuelle: true,
      },
    });

    if (!camion) {
      return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });
    }

    if (nouveauKm <= 0) {
      return NextResponse.json(
        { error: "Le kilométrage doit être supérieur à 0" },
        { status: 400 }
      );
    }

    const budgetCheck = await validateBudgetCamion(camionId, coutTotal);
    if (!budgetCheck.ok) {
      return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
    }

    if (voyageId) {
      const voyage = await prisma.voyage.findFirst({
        where: { id: voyageId, camionId, statut: "en_cours" },
      });
      if (!voyage) {
        return NextResponse.json(
          { error: "Voyage en cours introuvable pour ce véhicule" },
          { status: 400 }
        );
      }
    }

    const receiptData = body.recuUrl
      ? {
          create: {
            url: body.recuUrl,
            fileName: body.recuName || "recu",
            mimeType: body.recuMimeType || "application/octet-stream",
            size: body.recuSize ? parseInt(body.recuSize) : 0,
          },
        }
      : undefined;

    const carburant = await prisma.carburant.create({
      data: {
        camionId,
        date: body.date ? new Date(body.date) : new Date(),
        kilometrage: nouveauKm,
        litres,
        prixLitre,
        coutTotal,
        numeroTicket: body.numeroTicket || null,
        stationService: body.stationService || null,
        recuUrl: body.recuUrl || null,
        chauffeurId: body.chauffeurId
          ? parseInt(body.chauffeurId)
          : camion.chauffeurId,
        estPlein,
        typeOperation,
        voyageId,
        receipts: receiptData,
      },
    });

    if (nouveauKm > camion.kilometrageActuel) {
      await prisma.camion.update({
        where: { id: camionId },
        data: { kilometrageActuel: nouveauKm },
      });

      await prisma.maintenancePlanifiee.updateMany({
        where: {
          camionId,
          statut: "planifie",
          kilometrageCible: { lte: nouveauKm },
        },
        data: { statut: "en_retard" },
      });
    }

    return NextResponse.json(carburant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du ticket carburant" },
      { status: 500 }
    );
  }
}

// DELETE /api/carburant - Supprimer un ticket carburant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    await prisma.carburant.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du ticket" },
      { status: 500 }
    );
  }
}
