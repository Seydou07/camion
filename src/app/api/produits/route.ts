import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/produits - Récupère tous les produits
export async function GET() {
  try {
    const produits = await prisma.produit.findMany({
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(produits);
  } catch (error) {
    console.error("Erreur GET /api/produits:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}

// POST /api/produits - Créer un produit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nom || body.prixVente === undefined || body.prixAchat === undefined) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : nom, prixVente, prixAchat" },
        { status: 400 }
      );
    }

    const produit = await prisma.produit.create({
      data: {
        nom: body.nom,
        unite: body.unite || "tonne",
        prixVente: parseFloat(body.prixVente),
        prixAchat: parseFloat(body.prixAchat),
      },
    });

    return NextResponse.json(produit, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/produits:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ce produit existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du produit" },
      { status: 500 }
    );
  }
}
