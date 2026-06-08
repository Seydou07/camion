"use client";

import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { formatMontant, formatDate } from "@/lib/utils";

export default function HistoriquePage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const [resCarb, resRep, resMaint] = await Promise.all([
          fetch("/api/carburant").then((r) => r.json()),
          fetch("/api/reparations").then((r) => r.json()),
          fetch("/api/maintenances-planifiees").then((r) => r.json()),
        ]);

        const formatted: any[] = [];

        // Map carburant
        (resCarb || []).forEach((c: any) => {
          formatted.push({
            id: `fuel-${c.id}`,
            type: "carburant",
            title: `Plein carburant - ${c.camion?.immatriculation || "Véhicule"}`,
            description: `${c.litres} Litres de gasoil ajoutés à la station "${c.stationService || "inconnue"}" au kilométrage ${c.kilometrage.toLocaleString()} km par ${c.chauffeur ? `${c.chauffeur.prenom || ""} ${c.chauffeur.nom}` : "le chauffeur"}. Coût : ${formatMontant(c.coutTotal)}.`,
            dateObj: new Date(c.date),
            icon: (
              <svg className="w-5 h-5 text-fleet-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            ),
            bgColor: "bg-fleet-blue/10",
          });
        });

        // Map reparations
        (resRep || []).forEach((r: any) => {
          const partsInfo = r.piecesChangees && r.piecesChangees.length > 0
            ? ` (${r.piecesChangees.length} pièces de rechange installées)`
            : "";
          formatted.push({
            id: `rep-${r.id}`,
            type: "reparation",
            title: `Intervention mécanique - ${r.camion?.immatriculation || "Véhicule"}`,
            description: `${r.description}${partsInfo} effectuée au garage "${r.garage}" à ${r.kilometrage.toLocaleString()} km. Coût total : ${formatMontant(r.cout)}.`,
            dateObj: new Date(r.date),
            icon: (
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5" />
              </svg>
            ),
            bgColor: "bg-rose-50",
          });
        });

        // Map maintenances-planifiees
        (resMaint || []).forEach((m: any) => {
          const statusLabel = m.statut === "en_retard" ? "En retard ⚠️" : m.statut === "realise" ? "Réalisé" : "Planifié";
          formatted.push({
            id: `maint-${m.id}`,
            type: "maintenance",
            title: `Planification Maintenance - ${m.camion?.immatriculation || "Véhicule"}`,
            description: `Tâche de type "${m.type.toUpperCase()}" planifiée au kilométrage cible ${m.kilometrageCible.toLocaleString()} km. Statut : ${statusLabel}.`,
            dateObj: new Date(m.createdAt),
            icon: (
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
            bgColor: "bg-amber-50",
          });
        });

        // Sort by dateObj descending
        formatted.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

        setActivities(formatted);
        setLoading(false);
      } catch (error) {
        console.error("Erreur de chargement de l'historique:", error);
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
           <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           Historique des Activités
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
           Trace d'audit et journal des événements d'exploitation de la flotte.
        </p>
      </div>

      {/* Timeline */}
      <div className="card-modern p-8">
         {loading ? (
            <div className="space-y-6 pl-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
         ) : activities.length > 0 ? (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
               {activities.map((activity) => (
                  <div key={activity.id} className="relative pl-8">
                     {/* Timeline Dot */}
                     <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white ${activity.bgColor} flex items-center justify-center shadow-sm`}>
                        {activity.icon}
                     </div>
                     
                     {/* Content */}
                     <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                           <h3 className="text-sm font-bold text-slate-800">{activity.title}</h3>
                           <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                              {formatDate(activity.dateObj)}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                           {activity.description}
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-12 text-slate-400 italic text-sm">
               Aucun événement enregistré dans l'historique d'exploitation.
            </div>
         )}
      </div>
    </div>
  );
}

