import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculBudgetConsomme,
  calculerAlerteBudget,
  getYearDateRange,
} from "@/lib/budget";

// GET /api/camions - Liste tous les camions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (statut && statut !== "tous") {
      where.statut = statut;
    }

    if (search) {
      where.immatriculation = { contains: search };
    }

    const dateFilter = getYearDateRange();

    const camions = await prisma.camion.findMany({
      where,
      include: {
        chauffeur: true,
        carburants: {
          where: { date: dateFilter },
        },
        reparations: {
          where: { date: dateFilter },
          include: { piecesChangees: true },
        },
        _count: {
          select: {
            reparations: true,
            carburants: true,
            maintenancesPlanifiees: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedCamions = camions.map((camion) => {
      const budgetConsomme = calculBudgetConsomme(
        camion.carburants,
        camion.reparations
      );

      let alerteVisite = false;
      if (camion.prochaineVisite) {
        const timeDiff =
          new Date(camion.prochaineVisite).getTime() - new Date().getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 30) alerteVisite = true;
      }

      let alerteVidange = false;
      if (camion.frequenceVidange && camion.kilometrageActuel) {
        if (
          camion.kilometrageActuel - camion.dernierKilometrageVidange >=
          camion.frequenceVidange
        ) {
          alerteVidange = true;
        }
      }

      let alerteAssurance = false;
      if (camion.echeanceAssurance) {
        const timeDiff =
          new Date(camion.echeanceAssurance).getTime() - new Date().getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 30) alerteAssurance = true;
      }

      const alerteBudget = calculerAlerteBudget(
        budgetConsomme,
        camion.dotationAnnuelle
      );

      return {
        ...camion,
        budgetConsomme,
        alerteVisite,
        alerteVidange,
        alerteAssurance,
        alerteBudget,
        carburants: undefined,
        reparations: undefined,
      };
    });

    return NextResponse.json(enrichedCamions);
  } catch (error) {
    console.error("Erreur GET /api/camions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des camions" },
      { status: 500 }
    );
  }
}

// POST /api/camions - Créer un camion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.immatriculation || !body.marque || !body.capaciteTonnes || !body.dateMiseService) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : immatriculation, marque, capaciteTonnes, dateMiseService" },
        { status: 400 }
      );
    }

    const initialKm = body.kilometrageActuel ? parseInt(body.kilometrageActuel) : 0;
    const cid = body.chauffeurId ? parseInt(body.chauffeurId) : null;

    // Si un chauffeur est sélectionné, on vérifie s'il est déjà lié à un autre camion pour le libérer
    if (cid) {
      await prisma.camion.updateMany({
        where: { chauffeurId: cid },
        data: { chauffeurId: null },
      });
    }

    const camion = await prisma.camion.create({
      data: {
        immatriculation: body.immatriculation,
        marque: body.marque,
        modele: body.modele || null,
        capaciteTonnes: parseFloat(body.capaciteTonnes),
        statut: body.statut || "en_service",
        kilometrageActuel: initialKm,
        dateMiseService: new Date(body.dateMiseService),
        prochaineVisite: body.prochaineVisite ? new Date(body.prochaineVisite) : null,
        annee: body.annee ? parseInt(body.annee) : null,
        numeroChassis: body.numeroChassis || null,
        couleur: body.couleur || null,
        carburant: body.carburant || "Diesel",
        capaciteReservoir: body.capaciteReservoir ? parseInt(body.capaciteReservoir) : null,
        transmission: body.transmission || "Manuelle",
        dotationAnnuelle: body.dotationAnnuelle ? parseFloat(body.dotationAnnuelle) : null,
        frequenceVidange: body.frequenceVidange ? parseInt(body.frequenceVidange) : null,
        echeanceAssurance: body.echeanceAssurance ? new Date(body.echeanceAssurance) : null,
        numeroPoliceAssurance: body.numeroPoliceAssurance || null,
        compagnieAssurance: body.compagnieAssurance || null,
        notes: body.notes || null,
        chauffeurId: cid,
      },
    });

    return NextResponse.json(camion, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/camions:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Cette immatriculation existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du camion" },
      { status: 500 }
    );
  }
}
