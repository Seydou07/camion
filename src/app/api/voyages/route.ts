import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");
    const statut = searchParams.get("statut");

    const where: any = {};
    if (camionId && camionId !== "tous") where.camionId = parseInt(camionId);
    if (statut && statut !== "tous") where.statut = statut;

    const voyages = await prisma.voyage.findMany({
      where,
      include: {
        camion: { select: { id: true, immatriculation: true, marque: true } },
        chauffeur: { select: { id: true, nom: true, prenom: true } },
        carburants: true, // Pour voir s'il y a eu des pleins en route
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

    const camion = await prisma.camion.findUnique({
      where: { id: parseInt(body.camionId) },
    });

    if (!camion) return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });

    // Création du voyage
    const voyage = await prisma.voyage.create({
      data: {
        camionId: parseInt(body.camionId),
        chauffeurId: body.chauffeurId ? parseInt(body.chauffeurId) : camion.chauffeurId,
        destination: body.destination,
        kilometrageDepart: parseInt(body.kilometrageDepart),
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : new Date(),
        statut: "en_cours",
      },
    });

    // Mettre à jour le statut du camion si nécessaire (ex: "en_voyage")
    // Pour l'instant on laisse "en_service"

    return NextResponse.json(voyage, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/voyages:", error);
    return NextResponse.json({ error: "Erreur lors de la création du voyage" }, { status: 500 });
  }
}
