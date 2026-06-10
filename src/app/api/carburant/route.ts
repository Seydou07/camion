import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recalculerBudgetCamion, validateBudgetCamion } from "@/lib/budget-server";

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// GET /api/carburant - Liste les dossiers carburant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    const where: Prisma.CarburantWhereInput = {};
    if (camionId && camionId !== "tous") {
      where.camionId = parseInt(camionId);
    }
    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { voyage: { numeroVoyage: { contains: search } } },
        { voyage: { destination: { contains: search } } },
        { camion: { immatriculation: { contains: search } } },
        { chauffeur: { nom: { contains: search } } },
        { chauffeur: { prenom: { contains: search } } },
      ];
    }

    const carburants = await prisma.carburant.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(carburants);
  } catch (error) {
    console.error("Erreur GET /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dossiers carburant" },
      { status: 500 }
    );
  }
}

// POST /api/carburant - Crée un dossier carburant hors voyage avec un premier ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const camionId = toNumber(body.camionId);
    const chauffeurId = toNumber(body.chauffeurId);
    const kilometrage = toNumber(body.kilometrage);
    const litres = toNumber(body.litres);
    const prixLitre = toNumber(body.prixLitre);
    const montant = toNumber(body.montant) ?? (
      litres !== null && prixLitre !== null ? litres * prixLitre : null
    );

    if (!camionId || !kilometrage || montant === null || montant <= 0) {
      return NextResponse.json(
        { error: "camionId, kilometrage et montant valide sont requis" },
        { status: 400 }
      );
    }

    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      select: { id: true, kilometrageActuel: true },
    });

    if (!camion) {
      return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });
    }

    const budgetCheck = await validateBudgetCamion(camionId, montant);
    if (!budgetCheck.ok) {
      return NextResponse.json({ error: budgetCheck.error }, { status: 400 });
    }

    const receipts: {
      cheminImage: string;
      nomFichier: string | null;
      mimeType: string | null;
      tailleOctets: number | null;
      montantRecu: number;
      commentaire: string;
    }[] = body.recuUrl
      ? [
          {
            cheminImage: body.recuUrl,
            nomFichier: body.recuName || null,
            mimeType: body.recuMimeType || null,
            tailleOctets: toNumber(body.recuSize),
            montantRecu: montant,
            commentaire: body.commentaire || "Ticket ajouté depuis la fiche camion",
          },
        ]
      : [];

    const dossier = await prisma.$transaction(async (tx) => {
      const createdDossier = await tx.carburant.create({
        data: {
          camionId,
          chauffeurId,
          montantPrevision: 0,
          totalComplements: 0,
          totalDepenses: montant,
          totalRecuValide: receipts.length > 0 ? montant : 0,
          statut: "CLOTURE",
        },
      });

      const mouvement = await tx.mouvementCarburant.create({
        data: {
          carburantId: createdDossier.id,
          dateOperation: body.date ? new Date(body.date) : new Date(),
          typeOperation: "DEPENSE",
          montant,
          stationService: body.stationService || null,
          numeroTicket: body.numeroTicket || null,
          kilometrage,
          litres,
          prixLitre,
          commentaire: body.commentaire || null,
        },
      });

      if (receipts.length > 0) {
        await Promise.all(
          receipts.map((receipt) =>
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

      if (kilometrage > camion.kilometrageActuel) {
        await tx.camion.update({
          where: { id: camionId },
          data: { kilometrageActuel: kilometrage },
        });
      }

      await tx.maintenancePlanifiee.updateMany({
        where: {
          camionId,
          statut: "planifie",
          kilometrageCible: { lte: kilometrage },
        },
        data: { statut: "en_retard" },
      });

      return createdDossier;
    });

    await recalculerBudgetCamion(camionId);

    const dossierComplet = await prisma.carburant.findUnique({
      where: { id: dossier.id },
      include: {
        voyage: true,
        camion: true,
        chauffeur: true,
        mouvements: {
          orderBy: { dateOperation: "desc" },
          include: { recus: true },
        },
      },
    });

    return NextResponse.json(dossierComplet, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/carburant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du ticket carburant" },
      { status: 500 }
    );
  }
}
