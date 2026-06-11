import { Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reparation: any | null;
}

export default function MaintenanceDetailModal({ isOpen, onClose, reparation }: MaintenanceDetailModalProps) {
  if (!reparation) return null;

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "planifiee":
        return <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md text-xs font-bold uppercase">Planifiée</span>;
      case "en_cours":
        return <span className="bg-fleet-blue/10 text-fleet-blue border border-fleet-blue/20 px-2 py-0.5 rounded-md text-xs font-bold uppercase">En Cours</span>;
      case "terminee":
        return <span className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md text-xs font-bold uppercase">Terminée</span>;
      case "annulee":
        return <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-md text-xs font-bold uppercase">Annulée</span>;
      default:
        return <span className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-xs font-bold uppercase">{statut}</span>;
    }
  };

  const getSourceLabel = (source: string) => {
    if (source === "budget_vehicule") return "Budget Véhicule";
    if (source === "carte_carburant") return "Carte Carburant";
    if (source === "especes") return "Espèces";
    return source || "Non spécifiée";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de l'intervention" size="lg">
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {reparation.reference || `REP-${reparation.id.toString().padStart(4, "0")}`}
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1">
              Camion: <span className="text-fleet-blue">{reparation.camion?.immatriculation}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(reparation.statut)}
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 capitalize">{reparation.type}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Date de début</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{formatDate(reparation.date)}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Date de fin</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{reparation.dateFin ? formatDate(reparation.dateFin) : "-"}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Kilométrage</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{reparation.kilometrage?.toLocaleString()} km</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Garage</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate" title={reparation.garage}>{reparation.garage}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Description / Détails</h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm whitespace-pre-wrap">
            {reparation.description}
          </div>
        </div>

        {/* Coûts et Pièces */}
        <div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Détail des Coûts & Pièces</h3>
          <div className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-300 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold">Désignation</th>
                  <th className="px-4 py-3 font-bold text-right">Qté</th>
                  <th className="px-4 py-3 font-bold text-right">P.U.</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3 font-bold">Source Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {/* Main d'œuvre */}
                {reparation.mainOeuvreCout > 0 && (
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Main d'Œuvre</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300">-</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300">-</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{reparation.mainOeuvreCout.toLocaleString()} F</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {getSourceLabel(reparation.mainOeuvreSource)}
                      </span>
                    </td>
                  </tr>
                )}
                {/* Pièces */}
                {reparation.piecesChangees?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{p.nom}</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300">{p.quantite}</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300">{p.prixUnitaire.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{(p.quantite * p.prixUnitaire).toLocaleString()} F</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {getSourceLabel(p.sourcePaiement)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <th colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700 dark:text-slate-200">COÛT TOTAL GLOBAL</th>
                  <th className="px-4 py-4 text-right font-black text-fleet-blue text-lg whitespace-nowrap">
                    {reparation.cout.toLocaleString()} F
                  </th>
                  <th></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </Modal>
  );
}
