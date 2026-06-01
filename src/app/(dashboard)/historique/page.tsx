"use client";

import { Card } from "@/components/ui";

const activities = [
  {
    id: 1,
    type: "vente",
    title: "Nouvelle vente enregistrée (Pont-Bascule)",
    description: "Camion AA-123-BB chargé de 25T de Granite Concassé pour le client BTP Construction.",
    time: "Aujourd'hui, 14:30",
    icon: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: "bg-emerald-50",
  },
  {
    id: 2,
    type: "carburant",
    title: "Plein de carburant",
    description: "150 Litres ajoutés pour le camion DK-4567-C au compteur 125,400 km.",
    time: "Aujourd'hui, 09:15",
    icon: (
      <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75C20.25 20.653 16.556 22.5 12 22.5s-8.25-1.847-8.25-4.125v-3.75" />
      </svg>
    ),
    bgColor: "bg-sky-50",
  },
  {
    id: 3,
    type: "reparation",
    title: "Intervention mécanique",
    description: "Changement de 2 pneus arrière sur le camion TH-890-ZZ au Garage Mbacké.",
    time: "Hier, 16:45",
    icon: (
      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5m8.44-8.44l-2.492 3.053c-.217.266-.198.654.044.897L12.5 10.65m-2.227-3.518L7.22 4.64C6.545 3.965 5.455 3.965 4.78 4.64L3.36 6.06c-.675.675-.675 1.765 0 2.44l10.82 10.82c.675.675 1.765.675 2.44 0l1.42-1.42c.675-.675.675-1.765 0-2.44L7.22 4.64z" />
      </svg>
    ),
    bgColor: "bg-rose-50",
  },
  {
    id: 4,
    type: "system",
    title: "Connexion Administrateur",
    description: "L'utilisateur admin@truckmanager.sn s'est connecté au système.",
    time: "Hier, 08:00",
    icon: (
      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
    ),
    bgColor: "bg-slate-100",
  },
  {
    id: 5,
    type: "camion",
    title: "Nouveau véhicule ajouté",
    description: "Le camion Mercedes Actros (AA-999-XX) a été ajouté à la flotte.",
    time: "Il y a 3 jours",
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    bgColor: "bg-indigo-50",
  },
];

export default function HistoriquePage() {
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
           Trace d'audit et journal des événements du système.
        </p>
      </div>

      {/* Timeline */}
      <div className="card-modern p-8">
         <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
            {activities.map((activity, index) => (
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
                           {activity.time}
                        </span>
                     </div>
                     <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {activity.description}
                     </p>
                  </div>
               </div>
            ))}
         </div>
         
         <div className="mt-8 text-center">
            <button className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-colors">
               Charger plus d'activités
            </button>
         </div>
      </div>
    </div>
  );
}
