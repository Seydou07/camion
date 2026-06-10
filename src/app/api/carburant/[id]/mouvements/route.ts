import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateBudgetCamion, recalculerBudgetCamion } from "@/lib/budget-server";

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type ReceiptPayload = {
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  montantRecu?: number | null;
  commentaire?: string | null;
};

// POST /api/carburant/[id]/mouvements - Ajouter un mouvement à un dossier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  try {
    const carburantId = parseInt(idParam);
    if (isNaN(carburantId)) {
      return NextResponse.json({ error: "ID de dossier invalide" }, { status: 400 });
    }

    const body = await request.json();
    const {
      typeOperation,
      montant,
      commentaire,
      recuUrl,
      recuUrls,
      stationService,
      numeroTicket,
      dateOperation,
      kilometrage,
      litres,
      prixLitre,
      receipts,
    } = body;

    if (!typeOperation || montant === undefined) {
      return NextResponse.json(
        { error: "typeOperation et montant sont requis" },
        { status: 400 }
      );
    }

    const montantFloat = parseFloat(montant);
    const hasReceipts = Array.isArray(receipts) && receipts.length > 0;
    if (isNaN(montantFloat) || (montantFloat <= 0 && !hasReceipts)) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Récupérer le dossier
    const dossier = await prisma.carburant.findUnique({
      where: { id: carburantId },
      include: { camion: true },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    // Vérifier le budget
    const budgetCheck = await validateBudgetCamion(dossier.camionId, montantFloat);
    if (!budgetCheck.ok) {
      return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
    }

    // Créer le mouvement avec transaction
    const normalizedReceipts =
      Array.isArray(receipts) && receipts.length > 0
        ? (receipts as ReceiptPayload[])
            .filter((receipt) => typeof receipt?.url === "string" && receipt.url.trim() !== "")
            .map((receipt) => ({
              cheminImage: receipt.url,
              nomFichier: receipt.fileName || null,
              mimeType: receipt.mimeType || null,
              tailleOctets: toNumber(receipt.size),
              montantRecu: toNumber(receipt.montantRecu) ?? montantFloat,
              commentaire: receipt.commentaire || "Reçu ajouté à la création du mouvement",
            }))
        : [
            ...(
              typeof recuUrl === "string" && recuUrl.trim() !== ""
                ? [
                    {
                      cheminImage: recuUrl,
                      nomFichier: body.recuName || null,
                      mimeType: body.recuMimeType || null,
                      tailleOctets: toNumber(body.recuSize),
                      montantRecu: montantFloat,
                      commentaire: "Reçu ajouté à la création du mouvement",
                    },
                  ]
                : []
            ),
            ...(
              Array.isArray(recuUrls)
                ? recuUrls
                    .filter((url) => typeof url === "string" && url.trim() !== "")
                    .map((url) => ({
                      cheminImage: url,
                      nomFichier: null,
                      mimeType: null,
                      tailleOctets: null,
                      montantRecu: montantFloat,
                      commentaire: "Reçu ajouté à la création du mouvement",
                    }))
                : []
            ),
          ];

    const resultat = await prisma.$transaction(async (tx) => {
      // 1. Créer le mouvement
      const mouvement = await tx.mouvementCarburant.create({
        data: {
          carburantId,
          typeOperation,
          montant: montantFloat,
          stationService: stationService || null,
          numeroTicket: numeroTicket || null,
          kilometrage: toNumber(kilometrage),
          litres: toNumber(litres),
          prixLitre: toNumber(prixLitre),
          commentaire: commentaire || null,
          dateOperation: dateOperation ? new Date(dateOperation) : new Date(),
        },
        include: {
          recus: true,
        },
      });

      // 2. Ajouter les reçus si fournis
      if (normalizedReceipts.length > 0) {
        await Promise.all(
          normalizedReceipts.map((receipt) =>
            tx.recuCarburant.create({
              data: {
                mouvementId: mouvement.id,
                cheminImage: receipt.cheminImage,
                nomFichier: receipt.nomFichier,
                mimeType: receipt.mimeType,
                tailleOctets: receipt.tailleOctets,
                montantRecu: receipt.montantRecu,
                commentaire: receipt.commentaire,
              },
            })
          )
        );
      }

      // 3. Mettre à jour les totaux du dossier
      const updateData: Prisma.CarburantUpdateInput = {};
      if (typeOperation === "COMPLEMENT") {
        updateData.totalComplements = { increment: montantFloat };
      } else if (typeOperation === "DEPENSE") {
        updateData.totalDepenses = { increment: montantFloat };
      }
      if (normalizedReceipts.length > 0) {
        updateData.totalRecuValide = {
          increment: normalizedReceipts.reduce((sum, receipt) => sum + receipt.montantRecu, 0),
        };
      }

      await tx.carburant.update({
        where: { id: carburantId },
        data: updateData,
      });

      return tx.mouvementCarburant.findUnique({
        where: { id: mouvement.id },
        include: { recus: true },
      });
    });

    // 4. Recalculer le budget du camion (hors transaction pour éviter les verrous longs)
    await recalculerBudgetCamion(dossier.camionId);

    return NextResponse.json(resultat, { status: 201 });
  } catch (error) {
    console.error(`Erreur POST /api/carburant/${idParam}/mouvements:`, error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du mouvement" },
      { status: 500 }
    );
  }
}
