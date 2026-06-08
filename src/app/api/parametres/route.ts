import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cle = searchParams.get("cle");

    if (cle) {
      const parametre = await prisma.parametreGlobal.findUnique({
        where: { cle },
      });
      return NextResponse.json(parametre || { cle, valeur: null });
    }

    const parametres = await prisma.parametreGlobal.findMany();
    return NextResponse.json(parametres);
  } catch (error) {
    console.error("Erreur GET /api/parametres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.cle || body.valeur === undefined) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : cle, valeur" },
        { status: 400 }
      );
    }

    const parametre = await prisma.parametreGlobal.upsert({
      where: { cle: body.cle },
      update: {
        valeur: String(body.valeur),
        description: body.description || null,
      },
      create: {
        cle: body.cle,
        valeur: String(body.valeur),
        description: body.description || null,
      },
    });

    return NextResponse.json(parametre, { status: 200 });
  } catch (error) {
    console.error("Erreur POST /api/parametres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du paramètre" },
      { status: 500 }
    );
  }
}
