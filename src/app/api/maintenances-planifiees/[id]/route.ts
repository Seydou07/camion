import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/maintenances-planifiees/[id] - Modifier ou réaliser une planification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const maintenanceId = parseInt(id);
    const body = await request.json();

    // Récupérer l'entretien actuel
    const current = await prisma.maintenancePlanifiee.findUnique({
      where: { id: maintenanceId },
      include: { camion: true },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Planification introuvable" },
        { status: 404 }
      );
    }

    const { statut, type, description, frequenceKilometrage, kilometrageDernier, kilometrageCible, dateLimite } = body;

    // Mise à jour de l'entretien
    const updated = await prisma.maintenancePlanifiee.update({
      where: { id: maintenanceId },
      data: {
        type: type !== undefined ? type : current.type,
        description: description !== undefined ? description : current.description,
        frequenceKilometrage: frequenceKilometrage !== undefined ? (frequenceKilometrage ? parseInt(frequenceKilometrage) : null) : current.frequenceKilometrage,
        kilometrageDernier: kilometrageDernier !== undefined ? parseInt(kilometrageDernier) : current.kilometrageDernier,
        kilometrageCible: kilometrageCible !== undefined ? parseInt(kilometrageCible) : current.kilometrageCible,
        dateLimite: dateLimite !== undefined ? (dateLimite ? new Date(dateLimite) : null) : current.dateLimite,
        statut: statut !== undefined ? statut : current.statut,
      },
    });

    // Si on marque comme "realise" et que l'entretien est récurrent (a une fréquence)
    if (statut === "realise" && current.statut !== "realise" && updated.frequenceKilometrage) {
      const nouveauDernier = updated.kilometrageCible; // Le kilométrage auquel c'était censé être fait
      const nouveauCible = nouveauDernier + updated.frequenceKilometrage;
      
      // Auto-créer la planification du cycle suivant
      await prisma.maintenancePlanifiee.create({
        data: {
          camionId: current.camionId,
          type: updated.type,
          description: `Cycle suivant auto-planifié (fréquence : ${updated.frequenceKilometrage} km)`,
          frequenceKilometrage: updated.frequenceKilometrage,
          kilometrageDernier: nouveauDernier,
          kilometrageCible: nouveauCible,
          statut: current.camion.kilometrageActuel >= nouveauCible ? "en_retard" : "planifie",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PUT /api/maintenances-planifiees/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la planification" },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenances-planifiees/[id] - Supprimer une planification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const maintenanceId = parseInt(id);

    await prisma.maintenancePlanifiee.delete({
      where: { id: maintenanceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/maintenances-planifiees/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la planification" },
      { status: 500 }
    );
  }
}
