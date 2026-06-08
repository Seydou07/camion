import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/maintenances-planifiees - Liste les tâches de maintenance planifiées
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");
    const statut = searchParams.get("statut");

    const where: any = {};

    if (camionId && camionId !== "tous") {
      where.camionId = parseInt(camionId);
    }

    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    const maintenances = await prisma.maintenancePlanifiee.findMany({
      where,
      include: {
        camion: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
            kilometrageActuel: true,
          },
        },
      },
      orderBy: [
        { statut: "desc" }, // Met en_retard d'abord
        { kilometrageCible: "asc" },
      ],
    });

    // Optionnel : Mettre à jour les statuts en fonction du kilométrage actuel en temps réel
    const updatedMaintenances = maintenances.map((m) => {
      let currentStatut = m.statut;
      if (currentStatut === "planifie" && m.camion.kilometrageActuel >= m.kilometrageCible) {
        currentStatut = "en_retard";
        // Mettre à jour de manière asynchrone en base
        prisma.maintenancePlanifiee.update({
          where: { id: m.id },
          data: { statut: "en_retard" },
        }).catch(err => console.error("Erreur mise à jour statut maintenance:", err));
      }
      return { ...m, statut: currentStatut };
    });

    return NextResponse.json(updatedMaintenances);
  } catch (error) {
    console.error("Erreur GET /api/maintenances-planifiees:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des planifications" },
      { status: 500 }
    );
  }
}

// POST /api/maintenances-planifiees - Créer une planification de maintenance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.camionId || !body.type || body.kilometrageCible === undefined) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : camionId, type, kilometrageCible" },
        { status: 400 }
      );
    }

    const camionId = parseInt(body.camionId);
    const targetKm = parseInt(body.kilometrageCible);

    // Récupérer le kilométrage actuel du camion
    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      select: { kilometrageActuel: true },
    });

    if (!camion) {
      return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });
    }

    const kmDernier = body.kilometrageDernier ? parseInt(body.kilometrageDernier) : camion.kilometrageActuel;
    const statut = camion.kilometrageActuel >= targetKm ? "en_retard" : "planifie";

    const maintenance = await prisma.maintenancePlanifiee.create({
      data: {
        camionId,
        type: body.type,
        description: body.description || null,
        frequenceKilometrage: body.frequenceKilometrage ? parseInt(body.frequenceKilometrage) : null,
        kilometrageDernier: kmDernier,
        kilometrageCible: targetKm,
        dateLimite: body.dateLimite ? new Date(body.dateLimite) : null,
        statut,
      },
    });

    return NextResponse.json(maintenance, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/maintenances-planifiees:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la planification" },
      { status: 500 }
    );
  }
}
