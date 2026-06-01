import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reparations?camionId=X - Liste les réparations d'un camion
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

    const reparations = await prisma.reparation.findMany({
      where: { camionId: parseInt(camionId) },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(reparations);
  } catch (error) {
    console.error("Erreur GET /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réparations" },
      { status: 500 }
    );
  }
}

// POST /api/reparations - Ajouter une réparation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.camionId || !body.type || !body.garage || !body.description || body.cout === undefined) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const reparation = await prisma.reparation.create({
      data: {
        camionId: parseInt(body.camionId),
        date: body.date ? new Date(body.date) : new Date(),
        type: body.type,
        garage: body.garage,
        description: body.description,
        cout: parseFloat(body.cout),
      },
    });

    return NextResponse.json(reparation, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de la réparation" },
      { status: 500 }
    );
  }
}

// DELETE /api/reparations?id=X - Supprimer une réparation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    await prisma.reparation.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/reparations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réparation" },
      { status: 500 }
    );
  }
}
