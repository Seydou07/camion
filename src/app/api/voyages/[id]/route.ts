import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (body.action === "terminer") {
      if (!body.kilometrageArrivee || !body.dateFin) {
        return NextResponse.json(
          {
            error:
              "Le kilométrage d'arrivée et la date de fin sont requis pour terminer le voyage.",
          },
          { status: 400 }
        );
      }

      const kmArrivee = parseInt(body.kilometrageArrivee);

      const voyageExistant = await prisma.voyage.findUnique({
        where: { id },
        include: { carburants: true },
      });

      if (!voyageExistant) {
        return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
      }

      if (kmArrivee <= voyageExistant.kilometrageDepart) {
        return NextResponse.json(
          {
            error: `Le kilométrage d'arrivée doit être supérieur au départ (${voyageExistant.kilometrageDepart} km).`,
          },
          { status: 400 }
        );
      }

      const voyage = await prisma.voyage.update({
        where: { id },
        data: {
          statut: "termine",
          kilometrageArrivee: kmArrivee,
          dateFin: new Date(body.dateFin),
        },
        include: { carburants: true, camion: true, chauffeur: true },
      });

      await prisma.camion.update({
        where: { id: voyage.camionId },
        data: { kilometrageActuel: kmArrivee },
      });

      await prisma.maintenancePlanifiee.updateMany({
        where: {
          camionId: voyage.camionId,
          statut: "planifie",
          kilometrageCible: { lte: kmArrivee },
        },
        data: { statut: "en_retard" },
      });

      const distanceParcourue = kmArrivee - voyage.kilometrageDepart;
      const totalLitres = voyage.carburants.reduce(
        (sum, c) => sum + c.litres,
        0
      );
      const coutCarburant = voyage.carburants.reduce(
        (sum, c) => sum + c.coutTotal,
        0
      );
      const consommationMoyenne =
        distanceParcourue > 0 && totalLitres > 0
          ? Math.round((totalLitres / distanceParcourue) * 1000) / 10
          : null;

      return NextResponse.json({
        ...voyage,
        synthese: {
          distanceParcourue,
          totalLitres: Math.round(totalLitres * 10) / 10,
          coutCarburant,
          consommationMoyenne,
          nbPleins: voyage.carburants.length,
        },
      });
    }

    const voyage = await prisma.voyage.update({
      where: { id },
      data: {
        destination: body.destination,
        kilometrageDepart: body.kilometrageDepart
          ? parseInt(body.kilometrageDepart)
          : undefined,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
        chauffeurId: body.chauffeurId ? parseInt(body.chauffeurId) : undefined,
      },
    });

    return NextResponse.json(voyage);
  } catch (error) {
    console.error("Erreur PUT /api/voyages/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du voyage" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    await prisma.voyage.delete({
      where: { id: parseInt(idParam) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/voyages/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
