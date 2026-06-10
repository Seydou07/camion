import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// POST /api/carburant/[id]/mouvements/[mouvementId]/recus - Ajouter un reçu à un mouvement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mouvementId: string }> }
) {
  const { id: idParam, mouvementId: mouvementIdParam } = await params;
  try {
    const carburantId = parseInt(idParam);
    const mouvementId = parseInt(mouvementIdParam);

    if (isNaN(carburantId) || isNaN(mouvementId)) {
      return NextResponse.json({ error: "IDs invalides" }, { status: 400 });
    }

    const body = await request.json();
    const { cheminImage, montantRecu, commentaire, nomFichier, mimeType, tailleOctets } = body;

    if (!cheminImage || montantRecu === undefined) {
      return NextResponse.json(
        { error: "cheminImage et montantRecu sont requis" },
        { status: 400 }
      );
    }

    const montantFloat = parseFloat(montantRecu);
    if (isNaN(montantFloat) || montantFloat < 0) {
      return NextResponse.json(
        { error: "Le montant du reçu doit être un nombre valide" },
        { status: 400 }
      );
    }

    // Vérifier que le mouvement existe et appartient au dossier
    const mouvement = await prisma.mouvementCarburant.findFirst({
      where: {
        id: mouvementId,
        carburantId: carburantId,
      },
    });

    if (!mouvement) {
      return NextResponse.json(
        { error: "Mouvement introuvable dans ce dossier" },
        { status: 404 }
      );
    }

    const recu = await prisma.$transaction(async (tx) => {
      // 1. Créer le reçu
      const nouveauRecu = await tx.recuCarburant.create({
        data: {
          mouvementId,
          cheminImage,
          nomFichier: nomFichier || null,
          mimeType: mimeType || null,
          tailleOctets: toNumber(tailleOctets),
          montantRecu: montantFloat,
          commentaire: commentaire || null,
        },
      });

      // 2. Mettre à jour totalRecuValide sur le dossier
      await tx.carburant.update({
        where: { id: carburantId },
        data: {
          totalRecuValide: { increment: montantFloat },
        },
      });

      return nouveauRecu;
    });

    return NextResponse.json(recu, { status: 201 });
  } catch (error) {
    console.error(
      `Erreur POST /api/carburant/${idParam}/mouvements/${mouvementIdParam}/recus:`,
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du reçu" },
      { status: 500 }
    );
  }
}
