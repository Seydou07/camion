"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Select,
  Badge,
  Skeleton,
} from "@/components/ui";
import { formatMontant, moisFrancais } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#38BDF8", "#0EA5E9", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

export default function RapportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [camions, setCamions] = useState<any[]>([]);

  // Filtres
  const [filterMois, setFilterMois] = useState("");
  const [filterAnnee, setFilterAnnee] = useState(String(new Date().getFullYear()));
  const [filterCamion, setFilterCamion] = useState("tous");

  const fetchRapport = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterMois) query.append("mois", filterMois);
    if (filterAnnee) query.append("annee", filterAnnee);
    if (filterCamion && filterCamion !== "tous") query.append("camionId", filterCamion);

    fetch(`/api/rapports?${query.toString()}`)
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
      .then((resData) => setCamions(resData))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRapport();
  }, [filterMois, filterAnnee, filterCamion]);

  useEffect(() => {
    fetchCamions();
  }, []);

  // Fonction d'export au format CSV (Lisible dans Excel)
  const exportToExcel = () => {
    if (!data || !data.comparatifCamions) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM UTF-8 pour Excel
    csvContent += "Camion;Chiffre d'Affaires (F);Carburant (F);Réparations (F);Bénéfice Net (F);Taux de Marge (%)\n";

    data.comparatifCamions.forEach((c: any) => {
      const row = [
        c.immatriculation,
        c.chiffreAffaires,
        c.carburant,
        c.reparation,
        c.benefice,
        Math.round(c.marge * 10) / 10,
      ].join(";");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Flotte_${filterAnnee}_${filterMois || "Annuel"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <p className="text-sm text-gray-400">Analysez la rentabilité, les charges et la performance de votre flotte</p>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sky-500 text-sky-500 font-semibold hover:bg-sky-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter en Excel (CSV)
        </button>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
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
        <Select
          label="Camion"
          value={filterCamion}
          onChange={(e) => setFilterCamion(e.target.value)}
          placeholder="Tous les camions"
          options={camions.map((c) => ({ value: String(c.id), label: c.immatriculation }))}
        />
      </div>

      {/* Section 1 - Graphique CA Mensuel */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Chiffre d'Affaires Mensuel</h3>
          <p className="text-xs text-gray-400">Évolution globale des ventes</p>
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
                      <div className="custom-tooltip">
                        <p className="text-xs font-semibold text-gray-500 mb-1">{payload[0].payload.name}</p>
                        <p className="text-sm font-bold text-sky-500">
                          CA : {formatMontant(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="Chiffre d'Affaires" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Section 2 & 3 - Tableau Comparatif et Répartition des Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau comparatif */}
        <Card className="lg:col-span-2 p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Tableau comparatif par camion</h3>
            <p className="text-xs text-gray-400">Rentabilité analytique par engin</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Camion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Carburant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Réparations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bénéfice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data.comparatifCamions || []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-sky-50/50 cursor-pointer transition-colors" onClick={() => (window.location.href = `/camions/${c.id}`)}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.immatriculation}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatMontant(c.chiffreAffaires)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatMontant(c.carburant)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatMontant(c.reparation)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={c.benefice >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {formatMontant(c.benefice)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-sky-500">
                      {Math.round(c.marge * 10) / 10}%
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
            <h3 className="text-base font-semibold text-gray-900">Répartition des charges</h3>
            <p className="text-xs text-gray-400">Structure des dépenses globales</p>
          </div>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {data.repartitionCharges.length > 0 ? (
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
    </div>
  );
}
