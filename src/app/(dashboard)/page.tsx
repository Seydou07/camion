"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  StatCard,
  Badge,
  DataTable,
  Skeleton,
} from "@/components/ui";
import { formatMontant, statutCamionColors, statutCamionLabels } from "@/lib/utils";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0EA5E9", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rapports")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de chargement du dashboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[380px] lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-[380px] rounded-3xl" />
        </div>
        <Skeleton className="h-[300px] rounded-3xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Impossible de charger les données du tableau de bord.</p>
      </div>
    );
  }

  // Camion columns
  const camionColumns = [
    {
      key: "camion",
      header: "Camion",
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-fleet-blue/10 text-fleet-blue">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{item.immatriculation}</p>
            <p className="text-xs text-slate-400 font-medium">{item.marque} {item.modele || ""}</p>
          </div>
        </div>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => (
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${statutCamionColors[item.statut]}`}>
          {statutCamionLabels[item.statut]}
        </span>
      ),
    },
    {
      key: "chauffeurNom",
      header: "Chauffeur",
      render: (item: any) => <span className="text-sm font-semibold text-slate-600">{item.chauffeurNom}</span>,
    },
    {
      key: "kilometrage",
      header: "Kilométrage",
      render: (item: any) => <span className="text-sm font-bold text-slate-700">{item.kilometrage.toLocaleString()} km</span>,
    },
    {
      key: "consoMoyenne",
      header: "Conso (100km)",
      render: (item: any) => (
        <span className="text-sm font-black text-fleet-blue bg-fleet-blue/5 px-2 py-1 rounded-md">
          {item.consoMoyenne ? `${item.consoMoyenne} L` : "-"}
        </span>
      ),
    },
    {
      key: "coutTotal",
      header: "Total Dépenses",
      render: (item: any) => <span className="text-sm font-black text-rose-600">{formatMontant(item.coutTotal)}</span>,
    },
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-3 text-xs">
          <p className="font-bold text-slate-500 mb-1">{payload[0].payload.name}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="font-bold" style={{ color: p.color }}>
              {p.name} : {formatMontant(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatAbbrev = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return sign + (absVal / 1000000).toFixed(1).replace('.', ',') + 'M F';
    if (absVal >= 1000) return sign + (absVal / 1000).toFixed(1).replace('.', ',') + 'k F';
    return formatMontant(val);
  };

  return (
    <div className="space-y-8">
      {/* 1. Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        <StatCard
          title="Flotte Active"
          value={`${data.camionsEnService}/${data.totalCamions}`}
          subtitle="camions en service"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25" />
            </svg>
          }
        />
        <StatCard
          title="Dépenses Carburant"
          value={formatAbbrev(data.coutCarburant)}
          fullValue={formatMontant(data.coutCarburant)}
          subtitle="consommation du mois"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
        />
        <StatCard
          title="Frais Maintenance"
          value={formatAbbrev(data.coutReparations)}
          fullValue={formatMontant(data.coutReparations)}
          subtitle="réparations & pièces"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5" />
            </svg>
          }
        />
        <StatCard
          title="Maintenance due"
          value={String(data.nbAlertesMaintenance)}
          subtitle="entretiens en retard"
          change={{ value: data.nbAlertesMaintenance > 0 ? 100 : 0, isPositive: false }}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* 2. Charts Row: Evolution (2/3) + Doughnut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel vs Maintenance Area Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Évolution Annuelle des Charges</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Dépenses de carburant vs Frais de maintenance</p>
          </div>
          <div className="h-[280px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={data.evolutionMensuelle} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCarb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#CBD5E1" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis stroke="#CBD5E1" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="Carburant" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#colorCarb)" dot={{ r: 3, fill: "#0EA5E9" }} activeDot={{ r: 6, stroke: "#0EA5E9", strokeWidth: 2, fill: "white" }} />
                <Area type="monotone" dataKey="Maintenance" stroke="#EF4444" strokeWidth={2.5} fill="url(#colorMaint)" dot={{ r: 3, fill: "#EF4444" }} activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2, fill: "white" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Doughnut - Répartition des charges */}
        <Card className="p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Structure des Dépenses</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Répartition carburant vs maintenance</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[180px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
              {data.repartitionCharges && data.repartitionCharges.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={data.repartitionCharges}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.repartitionCharges.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl px-4 py-2.5 text-xs">
                              <p className="font-bold text-slate-700">{payload[0].name}</p>
                              <p className="font-black text-slate-900 text-sm">{formatMontant(payload[0].value)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">Aucune dépense ce mois-ci</div>
              )}
            </div>
            {/* Legend */}
            <div className="space-y-2 mt-4 w-full">
              {(data.repartitionCharges || []).map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-500 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">{formatMontant(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Highlighted Fleet Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Véhicules les plus sollicités</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Classement des camions par kilométrage actuel</p>
          </div>
          <Link href="/camions">
            <span className="text-xs text-fleet-blue font-bold hover:underline cursor-pointer px-3 py-1.5 rounded-xl hover:bg-fleet-blue/5 transition-colors">
              Voir toute la flotte →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...(data.comparatifCamions || [])]
            .sort((a: any, b: any) => b.kilometrage - a.kilometrage)
            .slice(0, 3)
            .map((camion: any, index: number) => {
               return (
                 <Card key={camion.id || index} className="p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-fleet-blue/5 transition-all duration-300">
                   {/* Rank Badge */}
                   <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[100%] flex items-start justify-end p-4 font-black text-white shadow-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-fleet-blue' : index === 1 ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                     <span className="text-lg relative -top-1 -right-1">#{index + 1}</span>
                   </div>
                   
                   <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${index === 0 ? 'bg-gradient-to-br from-fleet-blue to-fleet-blue-dark shadow-fleet-blue/30' : index === 1 ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-400/30' : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-400/30'}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 tracking-tight">{camion.immatriculation}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{camion.marque} • Chauffeur : {camion.chauffeurNom}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Kilométrage</span>
                       <span className="text-slate-800 font-black">{camion.kilometrage.toLocaleString()} km</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Consommation moyenne</span>
                       <span className="text-fleet-blue font-black">{camion.consoMoyenne ? `${camion.consoMoyenne} L/100km` : "N/A"}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Budget d'Exploitation</span>
                       <span className="text-rose-600 font-black">{formatMontant(camion.coutTotal)}</span>
                     </div>
                   </div>
                 </Card>
               );
            })}
        </div>
      </div>

      {/* 4. Global Fleet Summary Table */}
      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Récapitulatif de la Flotte</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Vue synthétique et coûts d'exploitation par véhicule</p>
          </div>
          <Link href="/camions">
            <span className="text-xs text-fleet-blue font-bold hover:underline cursor-pointer px-3 py-1.5 rounded-xl hover:bg-fleet-blue/5 transition-colors">
              Gérer les camions →
            </span>
          </Link>
        </div>
        <DataTable
          columns={camionColumns}
          data={data.comparatifCamions}
          onRowClick={(item) => (window.location.href = `/camions/${item.id}`)}
        />
      </Card>
    </div>
  );
}
