import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/carburant/[id] - Récupère un dossier carburant spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  try {
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const carburant = await prisma.carburant.findUnique({
      where: { id },
      include: {
        voyage: true,
        camion: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
            budgetConsomme: true,
            dotationAnnuelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        mouvements: {
          orderBy: { dateOperation: "desc" },
          include: {
            recus: true,
          },
        },
      },
    });

    if (!carburant) {
      return NextResponse.json(
        { error: "Dossier carburant introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(carburant);
  } catch (error) {
    console.error(`Erreur GET /api/carburant/${idParam}:`, error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du dossier carburant" },
      { status: 500 }
    );
  }
}
