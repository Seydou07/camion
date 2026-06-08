import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");

    const where: any = {};
    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    const cartes = await prisma.carteCarburant.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cartes);
  } catch (error) {
    console.error("Erreur GET /api/cartes-carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des cartes carburant" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.numeroCarte) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : numeroCarte" },
        { status: 400 }
      );
    }

    const carte = await prisma.carteCarburant.create({
      data: {
        numeroCarte: body.numeroCarte,
        solde: body.solde ? parseFloat(body.solde) : 0,
        statut: body.statut || "actif",
      },
    });

    return NextResponse.json(carte, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/cartes-carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la carte carburant" },
      { status: 500 }
    );
  }
}
