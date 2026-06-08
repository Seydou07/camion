import { prisma } from "./prisma";
import {
  calculBudgetConsomme,
  formatBudgetError,
  getYearDateRange,
} from "./budget";

export async function getBudgetConsommeCamion(camionId: number, year?: number) {
  const dateFilter = getYearDateRange(year);

  const [carburants, reparations] = await Promise.all([
    prisma.carburant.findMany({
      where: { camionId, date: dateFilter },
    }),
    prisma.reparation.findMany({
      where: { camionId, date: dateFilter },
      include: { piecesChangees: true },
    }),
  ]);

  return calculBudgetConsomme(carburants, reparations);
}

export async function validateBudgetCamion(camionId: number, montantAjout: number) {
  const camion = await prisma.camion.findUnique({
    where: { id: camionId },
    select: { dotationAnnuelle: true },
  });

  if (!camion?.dotationAnnuelle) {
    return { ok: true as const };
  }

  const consomme = await getBudgetConsommeCamion(camionId);

  if (consomme + montantAjout > camion.dotationAnnuelle) {
    return {
      ok: false as const,
      error: formatBudgetError(consomme, camion.dotationAnnuelle, montantAjout),
    };
  }

  return { ok: true as const };
}

export async function appliquerVidangeSiNecessaire(
  camionId: number,
  type: string,
  statut: string,
  kilometrage: number
) {
  if (type !== "vidange" || statut !== "terminee") return;

  const km =
    kilometrage > 0
      ? kilometrage
      : (
          await prisma.camion.findUnique({
            where: { id: camionId },
            select: { kilometrageActuel: true },
          })
        )?.kilometrageActuel;

  if (km === undefined) return;

  await prisma.camion.update({
    where: { id: camionId },
    data: { dernierKilometrageVidange: km },
  });
}

export async function debiterCarteCarburant(
  carteCarburantId: number,
  montant: number
) {
  if (montant <= 0) return;

  const carte = await prisma.carteCarburant.findUnique({
    where: { id: carteCarburantId },
  });

  if (!carte) {
    throw new Error("Carte carburant introuvable");
  }

  if (carte.solde < montant) {
    throw new Error(
      `Solde carte insuffisant (${Math.round(carte.solde).toLocaleString("fr-FR")} F disponibles, ${Math.round(montant).toLocaleString("fr-FR")} F requis).`
    );
  }

  await prisma.carteCarburant.update({
    where: { id: carteCarburantId },
    data: { solde: carte.solde - montant },
  });
}

export async function finaliserMaintenancePlanifiee(
  camionId: number,
  type: string,
  reparationId: number,
  kilometrage: number
) {
  const maintenanceActive = await prisma.maintenancePlanifiee.findFirst({
    where: {
      camionId,
      type,
      statut: { in: ["planifie", "en_retard"] },
    },
    orderBy: { kilometrageCible: "asc" },
  });

  if (!maintenanceActive) return;

  await prisma.maintenancePlanifiee.update({
    where: { id: maintenanceActive.id },
    data: { statut: "realise" },
  });

  if (maintenanceActive.frequenceKilometrage) {
    const camion = await prisma.camion.findUnique({
      where: { id: camionId },
      select: { kilometrageActuel: true },
    });
    const kmActuel = camion?.kilometrageActuel || kilometrage;
    const nouveauDernier =
      kilometrage > 0 ? kilometrage : maintenanceActive.kilometrageCible;
    const nouveauCible =
      nouveauDernier + maintenanceActive.frequenceKilometrage;
    const nouveauStatut = kmActuel >= nouveauCible ? "en_retard" : "planifie";

    await prisma.maintenancePlanifiee.create({
      data: {
        camionId,
        type: maintenanceActive.type,
        description: `Cycle suivant auto-généré (réparation #${reparationId})`,
        frequenceKilometrage: maintenanceActive.frequenceKilometrage,
        kilometrageDernier: nouveauDernier,
        kilometrageCible: nouveauCible,
        statut: nouveauStatut,
      },
    });
  }
}
