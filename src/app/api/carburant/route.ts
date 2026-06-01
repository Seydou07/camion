import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/carburant?camionId=X - Liste les pleins d'un camion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");

    if (!camionId) {
      return NextResponse.json(
        { error: "camionId requis" },
        { status: 400 }
      );
    }

    const carburants = await prisma.carburant.findMany({
      where: { camionId: parseInt(camionId) },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(carburants);
  } catch (error) {
    console.error("Erreur GET /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pleins" },
      { status: 500 }
    );
  }
}

// POST /api/carburant - Ajouter un plein
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.camionId || !body.kilometrage || !body.litres || !body.prixLitre) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Vérifier que le kilométrage est supérieur au dernier enregistré
    const dernierPlein = await prisma.carburant.findFirst({
      where: { camionId: parseInt(body.camionId) },
      orderBy: { date: "desc" },
    });

    if (dernierPlein && body.kilometrage <= dernierPlein.kilometrage) {
      return NextResponse.json(
        { error: `Le kilométrage doit être supérieur au dernier enregistré (${dernierPlein.kilometrage} km)` },
        { status: 400 }
      );
    }

    const litres = parseFloat(body.litres);
    const prixLitre = parseFloat(body.prixLitre);
    const coutTotal = body.coutTotal ? parseFloat(body.coutTotal) : litres * prixLitre;

    const carburant = await prisma.carburant.create({
      data: {
        camionId: parseInt(body.camionId),
        date: body.date ? new Date(body.date) : new Date(),
        kilometrage: parseInt(body.kilometrage),
        litres,
        prixLitre,
        coutTotal,
      },
    });

    return NextResponse.json(carburant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du plein" },
      { status: 500 }
    );
  }
}

// DELETE /api/carburant?id=X - Supprimer un plein
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
      { error: "Erreur lors de la suppression du plein" },
      { status: 500 }
    );
  }
}
