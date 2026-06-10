"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  Select,
  Skeleton,
  StatCard,
  Toast,
} from "@/components/ui";
import { formatMontant, moisFrancais } from "@/lib/utils";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";

const COLORS = ["#0EA5E9", "#EF4444", "#F59E0B", "#8B5CF6", "#10B981"];

export default function RapportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [camions, setCamions] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");
  const [showToast, setShowToast] = useState(false);

  const showExportError = (message: string) => {
    setToastMessage(message);
    setToastType("error");
    setShowToast(true);
  };

  // Filtres
  const [filterMois, setFilterMois] = useState("");
  const [filterAnnee, setFilterAnnee] = useState(String(new Date().getFullYear()));
  const [reportTypes, setReportTypes] = useState({ carburant: true, maintenance: true });
  const [selectedCamionIds, setSelectedCamionIds] = useState<number[]>([]);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);

  const toggleCamion = (id: number) => {
    setSelectedCamionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(e.target as Node)) {
        setVehicleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const buildQuery = () => {
    const query = new URLSearchParams();
    if (filterMois) query.append("mois", filterMois);
    if (filterAnnee) query.append("annee", filterAnnee);
    if (selectedCamionIds.length > 0) {
      query.append("camionIds", selectedCamionIds.join(","));
    }
    return query.toString();
  };

  const fetchRapport = () => {
    setLoading(true);
    fetch(`/api/rapports?${buildQuery()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchCamions = () => {
    fetch("/api/camions")
      .then((res) => res.json())
      .then((resData) => setCamions(Array.isArray(resData) ? resData : []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRapport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMois, filterAnnee, selectedCamionIds]);

  useEffect(() => {
    fetchCamions();
  }, []);

  const selectedVehicleLabels = selectedCamionIds.length === 0
    ? "Tous les camions"
    : selectedCamionIds.map((id) => camions.find((c) => c.id === id)?.immatriculation).filter(Boolean).join(", ");

  // Fonction d'export au format Excel Premium
  const exportToExcel = () => {
    setExporting(true);
    const query = new URLSearchParams();
    if (filterMois) query.append("mois", filterMois);
    if (filterAnnee) query.append("annee", filterAnnee);
    if (selectedCamionIds.length > 0) {
      query.append("camionIds", selectedCamionIds.join(","));
    }
    const types = [];
    if (reportTypes.carburant) types.push("carburant");
    if (reportTypes.maintenance) types.push("maintenance");
    if (types.length > 0) query.append("types", types.join(","));

    fetch(`/api/rapports/excel?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Erreur lors de la génération du fichier Excel");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rapport_Flotte_${filterAnnee}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setExporting(false);
      })
      .catch((err) => {
        showExportError(err.message || "Une erreur est survenue lors de la génération du rapport Excel.");
        setExporting(false);
      });
  };

  const exportToPdf = () => {
    setExportingPdf(true);
    const query = new URLSearchParams();
    if (filterMois) query.append("mois", filterMois);
    if (filterAnnee) query.append("annee", filterAnnee);
    if (selectedCamionIds.length > 0) {
      query.append("camionIds", selectedCamionIds.join(","));
    }
    const types = [];
    if (reportTypes.carburant) types.push("carburant");
    if (reportTypes.maintenance) types.push("maintenance");
    if (types.length > 0) query.append("types", types.join(","));

    fetch(`/api/rapports/pdf?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Erreur lors de la génération du PDF");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rapport_Flotte_${filterAnnee}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setExportingPdf(false);
      })
      .catch((err) => {
        showExportError(err.message || "Une erreur est survenue lors de la génération du rapport PDF.");
        setExportingPdf(false);
      });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[350px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rapports et Analyses</h1>
          <p className="text-sm text-gray-400">Analysez l'efficacité du carburant, les coûts d'exploitation et la maintenance de votre flotte</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {exportingPdf ? "Génération..." : "Exporter PDF"}
          </button>
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-fleet-blue text-fleet-blue font-semibold hover:bg-fleet-blue/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
          {exporting ? (
            <svg className="animate-spin h-5 w-5 text-fleet-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {exporting ? "Génération de l'Excel..." : "Exporter Excel Premium"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Exploitation"
          value={formatMontant(data.coutTotalExploitation)}
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" />
            </svg>
          }
        />
        <StatCard
          title="Carburant"
          value={formatMontant(data.coutCarburant)}
          subtitle={`${Math.round((data.coutCarburant / (data.coutTotalExploitation || 1)) * 100)}% des charges`}
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
        />
        <StatCard
          title="Maintenance"
          value={formatMontant(data.coutReparations)}
          subtitle={`${data.nbAlertesMaintenance || 0} alerte(s) en retard`}
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85" />
            </svg>
          }
        />
        <StatCard
          title="Dotation Flotte"
          value={formatMontant(data.dotationTotale || 0)}
          subtitle={`${data.camionsEnService}/${data.totalCamions} en service`}
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          }
        />
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase text-slate-400">Type de rapport</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reportTypes.carburant}
              onChange={(e) => setReportTypes((prev) => ({ ...prev, carburant: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-fleet-blue focus:ring-fleet-blue/20"
            />
            <span className="text-xs font-bold text-slate-700">Carburant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reportTypes.maintenance}
              onChange={(e) => setReportTypes((prev) => ({ ...prev, maintenance: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-fleet-blue focus:ring-fleet-blue/20"
            />
            <span className="text-xs font-bold text-slate-700">Maintenance</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Mois"
            value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)}
            placeholder="Toute l'année"
            options={moisFrancais.map((m, idx) => ({ value: String(idx + 1), label: m }))}
          />
          <Select
            label="Année"
            value={filterAnnee}
            onChange={(e) => setFilterAnnee(e.target.value)}
            options={[
              { value: "2026", label: "2026" },
              { value: "2025", label: "2025" },
              { value: "2024", label: "2024" },
            ]}
          />
          <div className="relative" ref={vehicleDropdownRef}>
            <div className="space-y-1.5 w-full">
              <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">Véhicules</label>
              <button
                type="button"
                onClick={() => setVehicleDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue hover:border-slate-300 cursor-pointer"
              >
                <span className="truncate">{selectedVehicleLabels}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${vehicleDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {vehicleDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
                <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCamionIds.length === 0}
                    onChange={() => setSelectedCamionIds([])}
                    className="w-4 h-4 rounded border-slate-300 text-fleet-blue focus:ring-fleet-blue/20"
                  />
                  <span className="text-xs font-bold text-slate-700">Tous les véhicules</span>
                </label>
                <div className="border-t border-slate-100 my-1" />
                {camions.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCamionIds.includes(c.id)}
                      onChange={() => toggleCamion(c.id)}
                      className="w-4 h-4 rounded border-slate-300 text-fleet-blue focus:ring-fleet-blue/20"
                    />
                    <span className="text-xs font-bold text-slate-700">{c.immatriculation}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 - Graphique Dépenses Mensuelles */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Charges d'Exploitation Mensuelles</h3>
          <p className="text-xs text-gray-400">Évolution globale des dépenses de carburant vs réparations mécaniques</p>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.evolutionMensuelle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-3 text-xs">
                        <p className="text-xs font-semibold text-gray-500 mb-1">{payload[0].payload.name}</p>
                        {payload.map((p: any) => (
                          <p key={p.name} className="font-bold" style={{ color: p.color }}>
                            {p.name} : {formatMontant(p.value as number)}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: 700 }} />
              <Bar dataKey="Carburant" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Maintenance" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Section Fréquences Carburant & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Fréquence des pleins carburant</h3>
            <p className="text-xs text-gray-400">Nombre de tickets et volume mensuel (litres)</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.frequenceCarburant || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#0EA5E9" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-3 text-xs">
                          <p className="font-semibold text-gray-500 mb-1">{payload[0].payload.name}</p>
                          <p className="font-bold text-fleet-blue">Pleins : {payload[0].payload.pleins}</p>
                          <p className="font-bold text-slate-600">Litres : {payload[0].payload.litres} L</p>
                          <p className="font-bold text-rose-500">Montant : {formatMontant(payload[0].payload.montant)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 700 }} />
                <Bar yAxisId="left" dataKey="pleins" name="Nb pleins" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="litres" name="Litres" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Fréquence des maintenances</h3>
            <p className="text-xs text-gray-400">Interventions et coûts mensuels</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.frequenceMaintenance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#EF4444" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-3 text-xs">
                          <p className="font-semibold text-gray-500 mb-1">{payload[0].payload.name}</p>
                          <p className="font-bold text-red-500">Interventions : {payload[0].payload.interventions}</p>
                          <p className="font-bold text-slate-700">Coût : {formatMontant(payload[0].payload.montant)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 700 }} />
                <Bar yAxisId="left" dataKey="interventions" name="Interventions" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="montant" name="Montant (F)" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Budget par véhicule */}
      {(data.budgetParVehicule || []).length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Consommation budgétaire par véhicule</h3>
            <p className="text-xs text-gray-400">Dotation annuelle vs budget véhicule consommé (carburant + maintenance imputée)</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.budgetParVehicule} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="immatriculation" stroke="#94A3B8" fontSize={10} width={80} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-3 text-xs">
                          <p className="font-bold text-slate-800 mb-1">{p.immatriculation}</p>
                          <p className="text-indigo-600">Dotation : {formatMontant(p.dotation)}</p>
                          <p className="text-rose-600">Consommé : {formatMontant(p.consomme)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 700 }} />
                <Bar dataKey="dotation" name="Dotation" fill="#6366F1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="consomme" name="Consommé" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Section 2 & 3 - Tableau Comparatif et Répartition des Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau comparatif */}
        <Card className="lg:col-span-2 p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Synthèse d'exploitation par véhicule</h3>
            <p className="text-xs text-gray-400">Kilométrage, consommation et frais d'exploitation de chaque camion</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Camion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chauffeur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kilométrage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Carburant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Conso Moy.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exploitation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data.comparatifCamions || []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-fleet-blue/5 cursor-pointer transition-colors text-xs font-medium text-slate-700" onClick={() => (window.location.href = `/camions/${c.id}`)}>
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">{c.immatriculation}</td>
                    <td className="px-4 py-3">{c.chauffeurNom}</td>
                    <td className="px-4 py-3 font-semibold">{c.kilometrage.toLocaleString()} km</td>
                    <td className="px-4 py-3">{formatMontant(c.carburant)} ({c.litres} L)</td>
                    <td className="px-4 py-3 font-semibold text-fleet-blue">
                      {c.consoMoyenne ? `${c.consoMoyenne} L/100` : "-"}
                    </td>
                    <td className="px-4 py-3">{formatMontant(c.reparation)}</td>
                    <td className="px-4 py-3 font-black text-rose-600">
                      {formatMontant(c.coutTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Camembert des charges */}
        <Card className="p-6 flex flex-col justify-center items-center">
          <div className="mb-4 text-center">
            <h3 className="text-base font-semibold text-gray-900">Répartition des Dépenses</h3>
            <p className="text-xs text-gray-400">Structure des charges globales</p>
          </div>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {data.repartitionCharges && data.repartitionCharges.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.repartitionCharges} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {data.repartitionCharges.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400">Aucune charge enregistrée</div>
            )}
          </div>
          <div className="space-y-1.5 w-full mt-4 text-xs font-semibold">
            {data.repartitionCharges.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="text-gray-900">{formatMontant(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
