import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logHistory, checkRole } from "@/lib/history";

// GET /api/chauffeurs - Liste tous les chauffeurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const statut = searchParams.get("statut");

    const where: any = {};

    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { prenom: { contains: search } },
      ];
    }

    const chauffeurs = await prisma.chauffeur.findMany({
      where,
      include: {
        camion: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(chauffeurs);
  } catch (error) {
    console.error("Erreur GET /api/chauffeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des chauffeurs" },
      { status: 500 }
    );
  }
}

// POST /api/chauffeurs - Créer un chauffeur
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await checkRole();
    if (!authorized) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.nom) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    const chauffeur = await prisma.chauffeur.create({
      data: {
        nom: body.nom,
        prenom: body.prenom || null,
        telephone: body.telephone || null,
        numeroPermis: body.numeroPermis || null,
        statut: body.statut || "actif",
      },
    });

    // Si un camionId est fourni, lier ce camion au nouveau chauffeur
    if (body.camionId) {
      const cid = parseInt(body.camionId);
      
      // Retirer l'ancien chauffeur de ce camion s'il y en avait un
      await prisma.camion.update({
        where: { id: cid },
        data: { chauffeurId: chauffeur.id },
      });
    }

    await logHistory("create", "chauffeur", chauffeur.id, `Création du chauffeur ${body.prenom || ''} ${body.nom}`);

    return NextResponse.json(chauffeur, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/chauffeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du chauffeur" },
      { status: 500 }
    );
  }
}
