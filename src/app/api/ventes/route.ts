import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNumeroFacture } from "@/lib/utils";

// GET /api/ventes - Liste les ventes avec filtres (camion, client, statut)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get("camionId");
    const clientId = searchParams.get("clientId");
    const statutPaiement = searchParams.get("statutPaiement");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    const where: Record<string, any> = {};

    if (camionId) {
      where.camionId = parseInt(camionId);
    }
    if (clientId) {
      where.clientId = parseInt(clientId);
    }
    if (statutPaiement) {
      where.statutPaiement = statutPaiement;
    }
    if (dateDebut || dateFin) {
      where.date = {};
      if (dateDebut) {
        where.date.gte = new Date(dateDebut);
      }
      if (dateFin) {
        where.date.lte = new Date(dateFin);
      }
    }

    const ventes = await prisma.vente.findMany({
      where,
      include: {
        camion: true,
        client: true,
        produit: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(ventes);
  } catch (error) {
    console.error("Erreur GET /api/ventes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des ventes" },
      { status: 500 }
    );
  }
}

// POST /api/ventes - Ajouter une vente (et éventuellement un produit ou client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.camionId || !body.clientId || !body.produitId || !body.quantite || !body.prixUnitaire) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const quantite = parseFloat(body.quantite);
    const prixUnitaire = parseFloat(body.prixUnitaire);
    const montantTotal = quantite * prixUnitaire;
    const numeroFacture = generateNumeroFacture();

    // Créer la vente
    const vente = await prisma.vente.create({
      data: {
        camionId: parseInt(body.camionId),
        clientId: parseInt(body.clientId),
        produitId: parseInt(body.produitId),
        quantite,
        prixUnitaire,
        montantTotal,
        statutPaiement: body.statutPaiement || "en_attente",
        numeroFacture,
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: {
        camion: true,
        client: true,
        produit: true,
      },
    });

    return NextResponse.json(vente, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/ventes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la vente" },
      { status: 500 }
    );
  }
}
