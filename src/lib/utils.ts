import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine les classes Tailwind CSS de manière sûre */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en francs CFA avec séparateur de milliers */
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + " F";
}

/** Formate une date en français (JJ/MM/AAAA) */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formate une date en français avec le mois en texte */
export function formatDateLong(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Génère un numéro de facture unique */
export function generateNumeroFacture(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `FACT-${year}${month}-${random}`;
}

/** Labels pour les statuts de camion */
export const statutCamionLabels: Record<string, string> = {
  en_service: "Service",
  en_panne: "Panne",
  en_attente: "Attente",
  hors_service: "Hors service",
};

/** Labels pour les statuts de paiement */
export const statutPaiementLabels: Record<string, string> = {
  paye: "Payé",
  en_attente: "En attente",
  annule: "Annulé",
};

/** Labels pour les types de réparation */
export const typeReparationLabels: Record<string, string> = {
  mecanique: "Mécanique",
  pneus: "Pneus",
  vidange: "Vidange",
  carrosserie: "Carrosserie",
  electricite: "Électricité",
  autre: "Autre",
};

/** Couleurs pour les statuts de camion */
export const statutCamionColors: Record<string, string> = {
  en_service: "bg-green-50 text-green-700 border-green-200",
  en_panne: "bg-red-50 text-red-700 border-red-200",
  en_attente: "bg-orange-50 text-orange-700 border-orange-200",
  hors_service: "bg-gray-50 text-gray-700 border-gray-200",
};

/** Couleurs pour les statuts de paiement */
export const statutPaiementColors: Record<string, string> = {
  paye: "bg-green-50 text-green-700 border-green-200",
  en_attente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  annule: "bg-red-50 text-red-700 border-red-200",
};

/** Couleurs pour les types de réparation */
export const typeReparationColors: Record<string, string> = {
  mecanique: "bg-blue-50 text-blue-700",
  pneus: "bg-gray-50 text-gray-700",
  vidange: "bg-purple-50 text-purple-700",
  carrosserie: "bg-orange-50 text-orange-700",
  electricite: "bg-yellow-50 text-yellow-700",
  autre: "bg-slate-50 text-slate-700",
};

/** Mois en français */
export const moisFrancais = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
