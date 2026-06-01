import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/camions - Liste tous les camions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    if (search) {
      where.immatriculation = { contains: search };
    }

    const camions = await prisma.camion.findMany({
      where,
      include: {
        _count: {
          select: {
            ventes: true,
            reparations: true,
            carburants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(camions);
  } catch (error) {
    console.error("Erreur GET /api/camions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des camions" },
      { status: 500 }
    );
  }
}

// POST /api/camions - Créer un camion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.immatriculation || !body.marque || !body.capaciteTonnes || !body.dateMiseService) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : immatriculation, marque, capaciteTonnes, dateMiseService" },
        { status: 400 }
      );
    }

    const camion = await prisma.camion.create({
      data: {
        immatriculation: body.immatriculation,
        marque: body.marque,
        modele: body.modele || null,
        capaciteTonnes: parseFloat(body.capaciteTonnes),
        statut: body.statut || "en_service",
        chauffeurNom: body.chauffeurNom || null,
        dateMiseService: new Date(body.dateMiseService),
        prochaineVisite: body.prochaineVisite ? new Date(body.prochaineVisite) : null,
      },
    });

    return NextResponse.json(camion, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur POST /api/camions:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cette immatriculation existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du camion" },
      { status: 500 }
    );
  }
}
