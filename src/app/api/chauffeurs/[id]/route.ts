import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/chauffeurs/[id] - Récupérer un chauffeur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chauffeurId = parseInt(id);

    const chauffeur = await prisma.chauffeur.findUnique({
      where: { id: chauffeurId },
      include: {
        camion: true,
        carburants: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!chauffeur) {
      return NextResponse.json(
        { error: "Chauffeur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(chauffeur);
  } catch (error) {
    console.error("Erreur GET /api/chauffeurs/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du chauffeur" },
      { status: 500 }
    );
  }
}

// PUT /api/chauffeurs/[id] - Mettre à jour un chauffeur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chauffeurId = parseInt(id);
    const body = await request.json();

    if (!body.nom) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Mise à jour de base
    const chauffeur = await prisma.chauffeur.update({
      where: { id: chauffeurId },
      data: {
        nom: body.nom,
        prenom: body.prenom || null,
        telephone: body.telephone || null,
        numeroPermis: body.numeroPermis || null,
        statut: body.statut || "actif",
      },
    });

    // Gestion de l'affectation du camion
    if (body.camionId !== undefined) {
      // 1. Dissocier le camion actuel de ce chauffeur
      await prisma.camion.updateMany({
        where: { chauffeurId: chauffeurId },
        data: { chauffeurId: null },
      });

      if (body.camionId && body.camionId !== "aucun") {
        const cid = parseInt(body.camionId);
        
        // 2. Dissocier le chauffeur éventuellement lié à ce camion
        await prisma.camion.updateMany({
          where: { chauffeurId: { not: null }, id: cid },
          data: { chauffeurId: null },
        });

        // 3. Associer le chauffeur au nouveau camion
        await prisma.camion.update({
          where: { id: cid },
          data: { chauffeurId: chauffeurId },
        });
      }
    }

    return NextResponse.json(chauffeur);
  } catch (error) {
    console.error("Erreur PUT /api/chauffeurs/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du chauffeur" },
      { status: 500 }
    );
  }
}

// DELETE /api/chauffeurs/[id] - Supprimer un chauffeur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chauffeurId = parseInt(id);

    // Supprimer le lien dans la table camions avant de supprimer le chauffeur
    await prisma.camion.updateMany({
      where: { chauffeurId: chauffeurId },
      data: { chauffeurId: null },
    });

    await prisma.chauffeur.delete({
      where: { id: chauffeurId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/chauffeurs/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du chauffeur" },
      { status: 500 }
    );
  }
}
