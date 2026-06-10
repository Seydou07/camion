import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Activer le caching pour les alertes (30 secondes)
export const revalidate = 30;

export async function GET() {
  try {
    const camions = await prisma.camion.findMany({
      select: {
        id: true,
        immatriculation: true,
        kilometrageActuel: true,
        dernierKilometrageVidange: true,
        frequenceVidange: true,
        echeanceAssurance: true,
        prochaineVisite: true,
      },
    });

    const now = new Date();
    const alerts: {
      camionId: number;
      immatriculation: string;
      type: "vidange" | "assurance" | "visite";
      severity: "critique" | "haute" | "moyenne";
      message: string;
    }[] = [];

    for (const c of camions) {
      if (c.frequenceVidange && c.frequenceVidange > 0) {
        const nextKm = c.dernierKilometrageVidange + c.frequenceVidange;
        const kmLeft = nextKm - c.kilometrageActuel;

        if (kmLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "critique", message: `Vidange dépassée de ${Math.abs(kmLeft)} km` });
        } else if (kmLeft <= Math.ceil(c.frequenceVidange * 0.1)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "haute", message: `Vidange dans ${kmLeft} km` });
        } else if (kmLeft <= Math.ceil(c.frequenceVidange * 0.2)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "moyenne", message: `Vidange dans ${kmLeft} km` });
        }
      }

      if (c.echeanceAssurance) {
        const daysLeft = Math.ceil((c.echeanceAssurance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "critique", message: `Assurance expirée depuis ${Math.abs(daysLeft)} j` });
        } else if (daysLeft <= 15) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "haute", message: `Assurance expire dans ${daysLeft} j` });
        } else if (daysLeft <= 30) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "moyenne", message: `Assurance expire dans ${daysLeft} j` });
        }
      }

      if (c.prochaineVisite) {
        const daysLeft = Math.ceil((c.prochaineVisite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "visite", severity: "critique", message: `Visite technique expirée depuis ${Math.abs(daysLeft)} j` });
        } else if (daysLeft <= 15) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "visite", severity: "haute", message: `Visite technique dans ${daysLeft} j` });
        } else if (daysLeft <= 30) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "visite", severity: "moyenne", message: `Visite technique dans ${daysLeft} j` });
        }
      }
    }

    const severityOrder = { critique: 0, haute: 1, moyenne: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      alerts,
      totalCritique: alerts.filter((a) => a.severity === "critique").length,
      totalHaute: alerts.filter((a) => a.severity === "haute").length,
      total: alerts.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/alertes:", error);
    return NextResponse.json({ alerts: [], totalCritique: 0, totalHaute: 0, total: 0 });
  }
}
