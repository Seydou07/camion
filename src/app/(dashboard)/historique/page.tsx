"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
} from "@/components/ui";

const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "camion", label: "Véhicules" },
  { id: "chauffeur", label: "Chauffeurs" },
  { id: "carburant", label: "Finance" },
  { id: "maintenance", label: "Maintenance" },
  { id: "voyage", label: "Missions" },
];

const getEntityIcon = (entity: string) => {
  switch (entity) {
    case "camion":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "chauffeur":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "carburant":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    case "maintenance":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85" />
        </svg>
      );
    case "voyage":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case "create":
      return "Création";
    case "update":
      return "Modification";
    case "delete":
      return "Suppression";
    default:
      return "Action";
  }
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        let filtered = data;
        if (selectedCategory !== "all") {
          filtered = data.filter((l: any) => l.entity === selectedCategory);
        }
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter((l: any) => 
            (l.details?.toLowerCase().includes(searchLower) || 
            (l.user?.name?.toLowerCase().includes(searchLower)) ||
            (l.action?.toLowerCase().includes(searchLower)))
          )
        }
        setLogs(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedCategory, search]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Search + Filters + Export */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-4">
          {/* Search bar */}
          <div className="w-full md:w-80">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher dans les logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue"
              />
            </div>
          </div>
          {/* Category filters */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase transition-all duration-300 border ${
                  selectedCategory === cat.id
                    ? "bg-fleet-blue text-white shadow-lg shadow-fleet-blue/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <Button className="h-11 px-6 rounded-2xl font-bold text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-5 5-5-5" />
          </svg>
          Exporter PDF
        </Button>
      </div>



      {/* Timeline */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
                <div className="w-0.5 flex-1 bg-slate-100" />
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="h-4 bg-slate-100 rounded w-1/4 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-3/4 mb-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-fleet-blue/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-fleet-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-700 mb-1">
            Aucune activité enregistrée
          </h3>
          <p className="text-sm text-slate-400">
            Les actions seront affichées ici une fois que des modifications sont effectuées
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 ml-5" />
          <div className="space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-6">
                <div className="flex flex-col items-center z-10">
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center text-fleet-blue hover:bg-fleet-blue hover:text-white hover:border-fleet-blue/20 transition-all duration-300 shadow-sm">
                    {getEntityIcon(log.entity)}
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    onClick={() => {
                      setSelectedLog(log);
                      setIsModalOpen(true);
                    }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-fleet-blue/30 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-fleet-blue/10 text-fleet-blue text-[10px] font-black uppercase rounded-xl">
                          {log.entity.charAt(0).toUpperCase() + log.entity.slice(1)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {/* Details */}
                    <p className="text-sm text-slate-700 mb-4">
                      {log.details || "Aucun détail disponible"}
                    </p>
                    {/* User */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.user ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fleet-blue/10 to-fleet-blue/5 flex items-center justify-center text-fleet-blue text-xs font-black">
                              {getInitials(log.user.name)}
                            </div>
                            <span className="text-xs font-semibold text-slate-600">
                              {log.user.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black">
                              S
                            </div>
                            <span className="text-xs font-semibold text-slate-400">
                              Système
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Détails de l'opération"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-fleet-blue/10 flex items-center justify-center text-fleet-blue">
                {getEntityIcon(selectedLog.entity)}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {getActionLabel(selectedLog.action)}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                  Module
                </span>
                <span className="px-4 py-2 bg-fleet-blue/10 text-fleet-blue text-xs font-bold rounded-xl">
                  {selectedLog.entity.charAt(0).toUpperCase() + selectedLog.entity.slice(1)}
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                  Date & Heure
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                Exécuté par
              </span>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {selectedLog.user ? (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fleet-blue/10 to-fleet-blue/5 flex items-center justify-center text-fleet-blue text-sm font-black">
                      {getInitials(selectedLog.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{selectedLog.user.name}</p>
                      <p className="text-xs text-slate-400">{selectedLog.user.email}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-black">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Système</p>
                      <p className="text-xs text-slate-400">Action automatique</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {selectedLog.details && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                  Commentaire / Description
                </span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700">
                  {selectedLog.details}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(false)}>
                  Fermer le panel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
