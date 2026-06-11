import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
// Activer le caching pour les alertes (30 secondes)
export const revalidate = 30;

async function getParametres() {
  const rows = await prisma.parametreGlobal.findMany({
    where: { cle: { in: ["alerts_vidange_km", "alerts_assurance_jours", "alerts_visite_jours"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.cle] = r.valeur;
  return map;
}

export async function GET() {
  try {
    const [camions, params] = await Promise.all([
      prisma.camion.findMany({
        select: {
          id: true,
          immatriculation: true,
          kilometrageActuel: true,
          dernierKilometrageVidange: true,
          frequenceVidange: true,
          echeanceAssurance: true,
          prochaineVisite: true,
        },
      }),
      getParametres(),
    ]);

    const defaultVidangeKm = parseInt(params["alerts_vidange_km"] || "1000");
    const assuranceSeuil = parseInt(params["alerts_assurance_jours"] || "30");
    const visiteSeuil = parseInt(params["alerts_visite_jours"] || "30");

    const now = new Date();
    const alerts: {
      camionId: number;
      immatriculation: string;
      type: "vidange" | "assurance" | "visite";
      severity: "critique" | "haute" | "moyenne";
      message: string;
    }[] = [];

    for (const c of camions) {
      const intervalKm = c.frequenceVidange || defaultVidangeKm;
      if (intervalKm > 0) {
        const nextKm = c.dernierKilometrageVidange + intervalKm;
        const kmLeft = nextKm - c.kilometrageActuel;

        if (kmLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "critique", message: `Vidange dépassée de ${Math.abs(kmLeft)} km` });
        } else if (kmLeft <= Math.ceil(intervalKm * 0.1)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "haute", message: `Vidange dans ${kmLeft} km` });
        } else if (kmLeft <= Math.ceil(intervalKm * 0.2)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "vidange", severity: "moyenne", message: `Vidange dans ${kmLeft} km` });
        }
      }

      if (c.echeanceAssurance) {
        const daysLeft = Math.ceil((c.echeanceAssurance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "critique", message: `Assurance expirée depuis ${Math.abs(daysLeft)} j` });
        } else if (daysLeft <= Math.ceil(assuranceSeuil / 2)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "haute", message: `Assurance expire dans ${daysLeft} j` });
        } else if (daysLeft <= assuranceSeuil) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "assurance", severity: "moyenne", message: `Assurance expire dans ${daysLeft} j` });
        }
      }

      if (c.prochaineVisite) {
        const daysLeft = Math.ceil((c.prochaineVisite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "visite", severity: "critique", message: `Visite technique expirée depuis ${Math.abs(daysLeft)} j` });
        } else if (daysLeft <= Math.ceil(visiteSeuil / 2)) {
          alerts.push({ camionId: c.id, immatriculation: c.immatriculation, type: "visite", severity: "haute", message: `Visite technique dans ${daysLeft} j` });
        } else if (daysLeft <= visiteSeuil) {
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
