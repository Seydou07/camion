/** Plage de dates pour une année calendaire */
export function getYearDateRange(year?: number) {
  const y = year ?? new Date().getFullYear();
  return {
    gte: new Date(y, 0, 1),
    lt: new Date(y + 1, 0, 1),
  };
}

export type ReparationBudgetInput = {
  mainOeuvreCout: number;
  mainOeuvreSource: string | null;
  piecesChangees?: {
    quantite: number;
    prixUnitaire: number;
    sourcePaiement: string | null;
  }[];
};

/** Montant imputé au budget véhicule (hors carte carburant / espèces) */
export function calculImpactBudgetReparation(reparation: ReparationBudgetInput): number {
  let total = 0;

  if (reparation.mainOeuvreSource === "budget_vehicule") {
    total += reparation.mainOeuvreCout || 0;
  }

  for (const piece of reparation.piecesChangees || []) {
    if (piece.sourcePaiement === "budget_vehicule") {
      total += piece.quantite * piece.prixUnitaire;
    }
  }

  return total;
}

/** Coût total de l'intervention (toutes sources confondues) */
export function calculCoutTotalReparation(
  mainOeuvreCout: number,
  pieces: { quantite: number; prixUnitaire: number }[]
): number {
  const totalPieces = pieces.reduce(
    (sum, p) => sum + p.quantite * p.prixUnitaire,
    0
  );
  return totalPieces + (mainOeuvreCout || 0);
}

/** Montant imputé à une carte carburant */
export function calculImpactCarteCarburant(
  mainOeuvreCout: number,
  mainOeuvreSource: string | null,
  pieces: { quantite: number; prixUnitaire: number; sourcePaiement: string | null }[]
): number {
  let total = 0;

  if (mainOeuvreSource === "carte_carburant") {
    total += mainOeuvreCout || 0;
  }

  for (const piece of pieces) {
    if (piece.sourcePaiement === "carte_carburant") {
      total += piece.quantite * piece.prixUnitaire;
    }
  }

  return total;
}

export function calculBudgetConsomme(
  carburantTotal: number,
  reparations: ReparationBudgetInput[]
): number {
  const rep = reparations.reduce(
    (acc, r) => acc + calculImpactBudgetReparation(r),
    0
  );
  return carburantTotal + rep;
}

export function calculerAlerteBudget(
  consomme: number,
  dotation: number | null | undefined
): boolean {
  if (!dotation || dotation <= 0) return false;
  return consomme >= dotation * 0.8;
}

export function formatBudgetError(
  consomme: number,
  dotation: number,
  ajout: number
): string {
  const restant = Math.max(0, dotation - consomme);
  return `Budget véhicule insuffisant. Dotation annuelle : ${Math.round(dotation).toLocaleString("fr-FR")} F, consommé : ${Math.round(consomme).toLocaleString("fr-FR")} F, restant : ${Math.round(restant).toLocaleString("fr-FR")} F, opération : ${Math.round(ajout).toLocaleString("fr-FR")} F.`;
}
