import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients - Liste tous les clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.nom = { contains: search };
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        ventes: {
          select: {
            montantTotal: true,
            statutPaiement: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculer les totaux pour chaque client
    const clientsAvecTotaux = clients.map((client) => {
      const totalAchats = client.ventes.reduce(
        (sum, v) => sum + v.montantTotal,
        0
      );
      const soldeDu = client.ventes
        .filter((v) => v.statutPaiement === "en_attente")
        .reduce((sum, v) => sum + v.montantTotal, 0);

      return {
        ...client,
        totalAchats,
        soldeDu,
      };
    });

    return NextResponse.json(clientsAvecTotaux);
  } catch (error) {
    console.error("Erreur GET /api/clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Créer un client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nom) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        nom: body.nom,
        contact: body.contact || null,
        adresse: body.adresse || null,
        email: body.email || null,
        typePrix: body.typePrix || "standard",
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}
