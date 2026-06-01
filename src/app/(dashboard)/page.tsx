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
import { formatMontant, formatDate, statutCamionColors, statutCamionLabels } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
          <div className="p-2 rounded-xl bg-sky-50 text-sky-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{item.immatriculation}</p>
            <p className="text-xs text-slate-400 font-medium">{item.marque}</p>
          </div>
        </div>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => (
        <Badge variant={statutCamionColors[item.statut]}>
          {statutCamionLabels[item.statut]}
        </Badge>
      ),
    },
    {
      key: "chiffreAffaires",
      header: "CA du mois",
      render: (item: any) => <span className="font-bold text-slate-700">{formatMontant(item.chiffreAffaires)}</span>,
    },
    {
      key: "carburant",
      header: "Carburant",
      render: (item: any) => <span className="text-slate-500">{formatMontant(item.carburant)}</span>,
    },
    {
      key: "benefice",
      header: "Bénéfice",
      render: (item: any) => (
        <span className={item.benefice >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
          {formatMontant(item.benefice)}
        </span>
      ),
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
          title="Chiffre d'Affaires"
          value={formatAbbrev(data.chiffreAffaires)}
          fullValue={formatMontant(data.chiffreAffaires)}
          change={{ value: 12.5, isPositive: true }}
          subtitle="vs mois dernier"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Bénéfice Net"
          value={formatAbbrev(data.beneficeNet)}
          fullValue={formatMontant(data.beneficeNet)}
          change={{ value: 8.2, isPositive: data.beneficeNet >= 0 }}
          subtitle="marge brute estimée"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          title="Flotte Active"
          value={`${data.camionsEnService}/${data.totalCamions}`}
          subtitle="camions en service"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Factures Impayées"
          value={formatAbbrev(data.montantFacturesImpayees)}
          fullValue={formatMontant(data.montantFacturesImpayees)}
          subtitle={`${data.nbFacturesImpayees} facture(s) en attente`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* 2. Charts Row: Evolution (2/3) + Doughnut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA vs Bénéfice Area Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Évolution Annuelle</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Chiffre d'affaires vs Bénéfice net</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolutionMensuelle} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                <Area type="monotone" dataKey="Chiffre d'Affaires" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#colorCA)" dot={{ r: 3, fill: "#0EA5E9" }} activeDot={{ r: 6, stroke: "#0EA5E9", strokeWidth: 2, fill: "white" }} />
                <Area type="monotone" dataKey="Bénéfice" stroke="#10B981" strokeWidth={2.5} fill="url(#colorBenefice)" dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2, fill: "white" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Doughnut - Répartition des charges */}
        <Card className="p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Répartition des Charges</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Matériaux, carburant, réparations</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[180px] w-full">
              {data.repartitionCharges && data.repartitionCharges.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">Aucune charge</div>
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

      {/* 3. Performance per truck (Top Performers Leaderboard) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Top Performance Véhicules</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Classement des camions les plus rentables du mois</p>
          </div>
          <Link href="/camions">
            <span className="text-xs text-sky-500 font-bold hover:underline cursor-pointer px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors">
              Voir toute la flotte →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...(data.comparatifCamions || [])]
            .sort((a: any, b: any) => b.benefice - a.benefice)
            .slice(0, 3)
            .map((camion: any, index: number) => {
               const marginPercent = camion.chiffreAffaires > 0 ? (camion.benefice / camion.chiffreAffaires) * 100 : 0;
               return (
                 <Card key={camion.id || index} className="p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300">
                   {/* Medal/Rank Badge */}
                   <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[100%] flex items-start justify-end p-4 font-black text-white shadow-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-amber-400 shadow-amber-400/20' : index === 1 ? 'bg-slate-300 shadow-slate-300/20' : 'bg-amber-600 shadow-amber-600/20'}`}>
                     <span className="text-lg relative -top-1 -right-1">#{index + 1}</span>
                   </div>
                   
                   <div className="flex items-center gap-4 mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 shadow-amber-400/30' : index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30' : 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-600/30'}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 tracking-tight">{camion.immatriculation}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{camion.marque}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                     <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                           <span className="text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</span>
                           <span className="text-slate-800 text-sm">{formatAbbrev(camion.chiffreAffaires)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-sky-500 rounded-full w-full"></div>
                        </div>
                     </div>
                     
                     <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                           <span className="text-slate-500 uppercase tracking-wider">Bénéfice Net</span>
                           <span className={`text-sm ${camion.benefice >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                             {formatAbbrev(camion.benefice)}
                           </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-1000 ${camion.benefice >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                              style={{ width: `${Math.min(100, Math.max(5, Math.abs(marginPercent)))}%` }}
                           ></div>
                        </div>
                     </div>
                   </div>
                 </Card>
               );
            })}
        </div>
      </div>

      {/* 4. Comparatif Camions Table */}
      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Récapitulatif par Camion</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Rentabilité mensuelle de chaque camion</p>
          </div>
          <Link href="/camions">
            <span className="text-xs text-sky-500 font-bold hover:underline cursor-pointer px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors">
              Détails →
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
