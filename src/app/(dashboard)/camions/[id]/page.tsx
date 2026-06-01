"use client";

import { useEffect, useState, use } from "react";
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  Toast,
  Skeleton,
} from "@/components/ui";
import {
  formatMontant,
  formatDate,
  statutCamionColors,
  statutCamionLabels,
  typeReparationColors,
  typeReparationLabels,
  statutPaiementColors,
  statutPaiementLabels,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#64748B"];

export default function CamionDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const id = params.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Submitting
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isReparationModalOpen, setIsReparationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fuel Form Fields
  const [fuelDate, setFuelDate] = useState("");
  const [fuelKm, setFuelKm] = useState("");
  const [fuelLitres, setFuelLitres] = useState("");
  const [fuelPrixLitre, setFuelPrixLitre] = useState("");

  // Reparation Form Fields
  const [repDate, setRepDate] = useState("");
  const [repType, setRepType] = useState("mecanique");
  const [repGarage, setRepGarage] = useState("");
  const [repDesc, setRepDesc] = useState("");
  const [repCout, setRepCout] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const fetchCamionDetails = () => {
    setLoading(true);
    fetch(`/api/camions/${id}`)
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

  useEffect(() => {
    fetchCamionDetails();
  }, [id]);

  const handleOpenFuelModal = () => {
    setFuelDate(new Date().toISOString().split("T")[0]);
    setFuelKm("");
    setFuelLitres("");
    setFuelPrixLitre("750"); 
    setIsFuelModalOpen(true);
  };

  const handleOpenReparationModal = () => {
    setRepDate(new Date().toISOString().split("T")[0]);
    setRepType("mecanique");
    setRepGarage("");
    setRepDesc("");
    setRepCout("");
    setIsReparationModalOpen(true);
  };

  const handleAddFuel = (e: React.FormEvent) => {
    e.preventDefault();

    const nouveauKm = parseInt(fuelKm);
    const derniersPleins = data.carburants || [];
    if (derniersPleins.length > 0) {
      const dernierKm = derniersPleins[0].kilometrage;
      if (nouveauKm <= dernierKm) {
        setToastMessage(`Le kilométrage doit être supérieur au dernier enregistré (${dernierKm} km)`);
        setToastType("error");
        setShowToast(true);
        return;
      }
    }

    setIsSubmitting(true);
    fetch("/api/carburant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camionId: data.id,
        date: fuelDate,
        kilometrage: nouveauKm,
        litres: parseFloat(fuelLitres),
        prixLitre: parseFloat(fuelPrixLitre),
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        setIsSubmitting(false);
        if (resData.error) {
          setToastMessage(resData.error);
          setToastType("error");
          setShowToast(true);
        } else {
          setToastMessage("Plein ajouté avec succès");
          setToastType("success");
          setShowToast(true);
          setIsFuelModalOpen(false);
          fetchCamionDetails();
        }
      });
  };

  const handleAddReparation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    fetch("/api/reparations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camionId: data.id,
        date: repDate,
        type: repType,
        garage: repGarage,
        description: repDesc,
        cout: parseFloat(repCout),
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        setIsSubmitting(false);
        if (resData.error) {
          setToastMessage(resData.error);
          setToastType("error");
          setShowToast(true);
        } else {
          setToastMessage("Réparation ajoutée avec succès");
          setToastType("success");
          setShowToast(true);
          setIsReparationModalOpen(false);
          fetchCamionDetails();
        }
      });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl col-span-2" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        <p className="text-xl font-bold text-slate-500">{data?.error || "Véhicule introuvable"}</p>
        <Button className="mt-6" variant="secondary" onClick={() => (window.location.href = "/camions")}>
           Retour à la flotte
        </Button>
      </div>
    );
  }

  const carburantChartData = [...(data.carburants || [])]
    .reverse()
    .slice(-6)
    .map((c: any) => ({
      date: formatDate(c.date).split("/").slice(0, 2).join("/"),
      "Consommation (L/100km)": c.consommation ? Math.round(c.consommation * 10) / 10 : 0,
    }));

  const categoriesReparation = (data.reparations || []).reduce((acc: any, curr: any) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.cout;
    return acc;
  }, {});

  const reparationPieData = Object.keys(categoriesReparation).map((key) => ({
    name: typeReparationLabels[key] || key,
    value: categoriesReparation[key],
  }));

  return (
    <div className="space-y-8 page-enter pb-10">
      
      {/* 1. Clean & Light Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                 </svg>
              </div>
              <div>
                 <Badge variant={statutCamionColors[data.statut]} className="mb-2 shadow-sm">
                   <div className="flex items-center gap-1.5">
                     <span className={`w-1.5 h-1.5 rounded-full ${data.statut === 'en_service' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
                     {statutCamionLabels[data.statut]}
                   </div>
                 </Badge>
                 <h1 className="text-3xl font-black tracking-tight text-slate-800">
                   {data.immatriculation}
                 </h1>
                 <p className="text-slate-500 font-medium text-sm mt-1">
                   {data.marque} {data.modele || ""} • <span className="text-sky-600 font-bold">{data.capaciteTonnes} Tonnes</span>
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
              </div>
              <div className="pr-4">
                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chauffeur assigné</p>
                 <p className="text-sm font-bold text-slate-700">{data.chauffeurNom || "Non assigné"}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Metrics & Main Data */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="card-modern p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-sky-50 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">Kilométrage</p>
                  <p className="text-2xl font-black text-slate-800 mt-2 relative z-10">
                     {data.carburants && data.carburants.length > 0 ? data.carburants[0].kilometrage.toLocaleString() : 0} <span className="text-sm text-slate-400 font-bold">km</span>
                  </p>
               </div>
               <div className="card-modern p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">Mise en service</p>
                  <p className="text-lg font-black text-slate-800 mt-3 relative z-10">
                     {formatDate(data.dateMiseService)}
                  </p>
               </div>
               <div className="card-modern p-5 relative overflow-hidden group col-span-2">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-end relative z-10">
                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Prochaine Visite Technique</p>
                        <p className="text-lg font-black text-slate-800 mt-3">
                           {data.prochaineVisite ? formatDate(data.prochaineVisite) : "Non planifiée"}
                        </p>
                     </div>
                     {data.prochaineVisite && (
                        <Badge variant="warning" className="shadow-sm">Alerte</Badge>
                     )}
                  </div>
               </div>
            </div>

            {/* Suivi Carburant */}
            <div className="card-modern p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-sky-50 text-sky-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Suivi Carburant</h3>
                        <p className="text-xs text-slate-400 font-medium">Évolution de la consommation au 100km</p>
                     </div>
                  </div>
                  <Button variant="secondary" onClick={handleOpenFuelModal} className="text-xs py-2 h-auto shadow-sm">
                     + Plein
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Graph */}
                  <div className="md:col-span-2 h-[220px]">
                     {carburantChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={carburantChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <XAxis dataKey="date" fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                           <YAxis fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                           <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                           <Bar dataKey="Consommation (L/100km)" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           Aucune donnée de consommation
                        </div>
                     )}
                  </div>
                  {/* KPI List */}
                  <div className="space-y-3">
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conso Moyenne</p>
                        <p className="text-xl font-black text-sky-600 mt-0.5">
                           {data.resume.mois.consommationMoyenne ? `${Math.round(data.resume.mois.consommationMoyenne * 10) / 10} L` : "-"}
                        </p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coût du mois</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{formatMontant(data.resume.mois.carburantTotal)}</p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume (L)</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{data.resume.mois.litresTotal} Litres</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Suivi Réparations */}
            <div className="card-modern p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5m8.44-8.44l-2.492 3.053c-.217.266-.198.654.044.897L12.5 10.65m-2.227-3.518L7.22 4.64C6.545 3.965 5.455 3.965 4.78 4.64L3.36 6.06c-.675.675-.675 1.765 0 2.44l10.82 10.82c.675.675 1.765.675 2.44 0l1.42-1.42c.675-.675.675-1.765 0-2.44L7.22 4.64z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Maintenance</h3>
                        <p className="text-xs text-slate-400 font-medium">Réparations et révisions</p>
                     </div>
                  </div>
                  <Button variant="secondary" onClick={handleOpenReparationModal} className="text-xs py-2 h-auto shadow-sm">
                     + Intervention
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-[200px]">
                     {reparationPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={reparationPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                 {reparationPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           Aucune réparation
                        </div>
                     )}
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Total du mois</span>
                        <span className="text-lg font-black text-slate-800">{formatMontant(data.resume.mois.reparationsTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Total de l'année</span>
                        <span className="text-lg font-black text-slate-800">{formatMontant(data.resume.annee.reparationsTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Nombre d'interventions</span>
                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full">{data.resume.annee.nbInterventions}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Ventes / Livraisons */}
            <div className="card-modern p-6">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-800 tracking-tight">Historique des Livraisons</h3>
                     <p className="text-xs text-slate-400 font-medium">Dernières ventes effectuées par ce véhicule</p>
                  </div>
               </div>
               
               <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-slate-50/80">
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantité</th>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {(data.ventes || []).slice(0, 5).map((v: any) => (
                           <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-sm text-slate-600 font-medium">{formatDate(v.date)}</td>
                              <td className="px-4 py-3 text-sm text-slate-800 font-bold">{v.client?.nom}</td>
                              <td className="px-4 py-3 text-sm text-amber-600 font-bold bg-amber-50/30">
                                 {v.quantite} {v.produit?.unite}s
                              </td>
                              <td className="px-4 py-3 text-sm font-black text-emerald-600 tracking-tight">{formatMontant(v.montantTotal)}</td>
                           </tr>
                        ))}
                        {(!data.ventes || data.ventes.length === 0) && (
                           <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 font-medium">
                                 Aucune livraison enregistrée
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
               <div className="mt-4 text-center">
                  <Button variant="ghost" className="text-sky-500 hover:text-sky-600 text-xs font-bold" onClick={() => (window.location.href = `/ventes?camionId=${data.id}`)}>
                     Voir toutes les ventes →
                  </Button>
               </div>
            </div>

         </div>

         {/* Right Column: Financial Light Statement */}
         <div className="lg:col-span-1">
            <div className="sticky top-24">
               <div className="card-modern p-6 border-sky-100 bg-gradient-to-b from-white to-sky-50/30">
                  <div className="text-center mb-6">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 mb-3 shadow-sm shadow-sky-500/10">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                        </svg>
                     </div>
                     <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        Bilan Mensuel
                     </h4>
                     <p className="text-lg font-black text-slate-800 mt-1">Juin 2026</p>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Chiffre d'Affaires</span>
                        <span className="text-sm font-black text-emerald-600">+{formatMontant(data.resume.mois.ventesTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Carburant</span>
                        <span className="text-sm font-black text-rose-500">-{formatMontant(data.resume.mois.carburantTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Réparations</span>
                        <span className="text-sm font-black text-rose-500">-{formatMontant(data.resume.mois.reparationsTotal)}</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200">
                     <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center mb-1">Bénéfice Net</p>
                     <div className="text-center">
                        <span className={`text-3xl font-black tracking-tight ${data.resume.mois.beneficeNet >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                           {formatMontant(data.resume.mois.beneficeNet)}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Modal Plein Carburant */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Ajouter un plein de carburant">
        <form onSubmit={handleAddFuel} className="space-y-4">
          <Input label="Date *" type="date" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} required />
          <Input label="Kilométrage actuel *" type="number" placeholder="Kilométrage au compteur" value={fuelKm} onChange={(e) => setFuelKm(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Litres *" type="number" step="0.01" placeholder="Quantité en litres" value={fuelLitres} onChange={(e) => setFuelLitres(e.target.value)} required />
            <Input label="Prix au litre (F) *" type="number" step="0.1" value={fuelPrixLitre} onChange={(e) => setFuelPrixLitre(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsFuelModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Réparations */}
      <Modal isOpen={isReparationModalOpen} onClose={() => setIsReparationModalOpen(false)} title="Ajouter une réparation / maintenance">
        <form onSubmit={handleAddReparation} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={repDate} onChange={(e) => setRepDate(e.target.value)} required />
            <Select
              label="Type d'intervention *"
              value={repType}
              onChange={(e) => setRepType(e.target.value)}
              options={[
                { value: "mecanique", label: "Mécanique" },
                { value: "pneus", label: "Pneus" },
                { value: "vidange", label: "Vidange" },
                { value: "carrosserie", label: "Carrosserie" },
                { value: "electricite", label: "Électricité" },
                { value: "autre", label: "Autre" },
              ]}
            />
          </div>
          <Input label="Garage *" placeholder="Nom du prestataire / garage" value={repGarage} onChange={(e) => setRepGarage(e.target.value)} required />
          <Textarea label="Description de la panne/maintenance *" placeholder="Indiquez les pièces changées, le type de panne..." value={repDesc} onChange={(e) => setRepDesc(e.target.value)} required />
          <Input label="Coût total de l'intervention (F) *" type="number" value={repCout} onChange={(e) => setRepCout(e.target.value)} required />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsReparationModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
