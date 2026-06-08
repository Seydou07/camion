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
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Submitting
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isReparationModalOpen, setIsReparationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fuel Form Fields
  const [fuelDate, setFuelDate] = useState("");
  const [fuelKm, setFuelKm] = useState("");
  const [fuelLitres, setFuelLitres] = useState("");
  const [fuelPrixLitre, setFuelPrixLitre] = useState("750");
  const [fuelNumeroTicket, setFuelNumeroTicket] = useState("");
  const [fuelStation, setFuelStation] = useState("");
  const [fuelRecuUrl, setFuelRecuUrl] = useState("");
  const [fuelReceiptFile, setFuelReceiptFile] = useState<File | null>(null);
  const [fuelReceiptPreviewUrl, setFuelReceiptPreviewUrl] = useState("");
  const [fuelReceiptFileName, setFuelReceiptFileName] = useState("");
  const [fuelUploadingReceipt, setFuelUploadingReceipt] = useState(false);
  const [fuelChauffeurId, setFuelChauffeurId] = useState("");

  // Reparation Form Fields
  const [repDate, setRepDate] = useState("");
  const [repType, setRepType] = useState("mecanique");
  const [repGarage, setRepGarage] = useState("");
  const [repDesc, setRepDesc] = useState("");
  const [repCout, setRepCout] = useState("");
  const [repKm, setRepKm] = useState("");
  
  // Dynamic pieces changed inside repair form
  const [repPieces, setRepPieces] = useState<any[]>([{ nom: "", quantite: 1, prixUnitaire: 0 }]);

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

  const fetchChauffeurs = () => {
    fetch("/api/chauffeurs")
      .then((res) => res.json())
      .then((resData) => setChauffeurs(resData))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCamionDetails();
    fetchChauffeurs();
  }, [id]);

  const uploadFuelReceipt = async (file: File) => {
    try {
      setFuelUploadingReceipt(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/receipts", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec du téléversement");

      setFuelRecuUrl(data.url);
      setFuelReceiptFileName(data.fileName);
      return data;
    } catch (error) {
      console.error(error);
      setToastMessage((error as Error).message || "Erreur de téléversement");
      setToastType("error");
      setShowToast(true);
      setFuelRecuUrl("");
      return null;
    } finally {
      setFuelUploadingReceipt(false);
    }
  };

  const handleOpenFuelModal = () => {
    setFuelDate(new Date().toISOString().split("T")[0]);
    setFuelKm("");
    setFuelLitres("");
    setFuelPrixLitre("750"); 
    setFuelNumeroTicket("");
    setFuelStation("");
    setFuelRecuUrl("");
    setFuelReceiptFile(null);
    setFuelReceiptPreviewUrl("");
    setFuelReceiptFileName("");
    setFuelUploadingReceipt(false);
    setFuelChauffeurId(data?.chauffeurId ? String(data.chauffeurId) : "");
    setIsFuelModalOpen(true);
  };

  const handleOpenReparationModal = () => {
    setRepDate(new Date().toISOString().split("T")[0]);
    setRepType("mecanique");
    setRepGarage("");
    setRepDesc("");
    setRepCout("");
    setRepKm(String(data?.kilometrageActuel || 0));
    setRepPieces([{ nom: "", quantite: 1, prixUnitaire: 0 }]);
    setIsReparationModalOpen(true);
  };

  const handleAddRepPiece = () => {
    setRepPieces([...repPieces, { nom: "", quantite: 1, prixUnitaire: 0 }]);
  };

  const handleRemoveRepPiece = (index: number) => {
    const list = [...repPieces];
    list.splice(index, 1);
    setRepPieces(list);
  };

  const handleRepPieceChange = (index: number, field: string, value: any) => {
    const list = [...repPieces];
    list[index][field] = value;

    // Calculate total cost
    let totalPieces = 0;
    list.forEach(p => {
      if (p.nom && p.quantite && p.prixUnitaire) {
        totalPieces += parseInt(p.quantite) * parseFloat(p.prixUnitaire);
      }
    });
    if (totalPieces > 0) {
      setRepCout(String(totalPieces));
    }

    setRepPieces(list);
  };

  const handleAddFuel = (e: React.FormEvent) => {
    e.preventDefault();

    const nouveauKm = parseInt(fuelKm);
    if (nouveauKm <= data.kilometrageActuel) {
      setToastMessage(`Le kilométrage doit être supérieur au kilométrage actuel (${data.kilometrageActuel} km)`);
      setToastType("error");
      setShowToast(true);
      return;
    }

    if (fuelUploadingReceipt) {
      setToastMessage("Attendez que le reçu soit téléversé avant d'enregistrer.");
      setToastType("error");
      setShowToast(true);
      return;
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
        numeroTicket: fuelNumeroTicket,
        stationService: fuelStation,
        recuUrl: fuelRecuUrl || null,
        recuName: fuelReceiptFileName || null,
        recuMimeType: fuelReceiptFile?.type || null,
        recuSize: fuelReceiptFile ? fuelReceiptFile.size : null,
        chauffeurId: fuelChauffeurId ? parseInt(fuelChauffeurId) : null,
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

    const filterPieces = repPieces.filter(p => p.nom.trim() !== "");

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
        kilometrage: parseInt(repKm),
        piecesChangees: filterPieces,
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
          setToastMessage("Intervention ajoutée avec succès");
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

  const typeLabels: Record<string, string> = {
    vidange: "Vidange Moteur",
    pneus: "Remplacement Pneus",
    freins: "Système de Freinage",
    courroie: "Courroie d'Accessoire / Distribution",
    batterie: "Batterie",
    visite_technique: "Visite Technique",
    autre: "Autre Entretien",
  };

  return (
    <div className="space-y-8 page-enter pb-10">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-fleet-blue/10 flex items-center justify-center text-fleet-blue border border-fleet-blue/20">
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
                    {data.marque} {data.modele || ""} • <span className="text-fleet-blue font-bold">{data.capaciteTonnes} Tonnes</span>
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
                 <p className="text-sm font-bold text-slate-700">
                   {data.chauffeur ? `${data.chauffeur.prenom || ""} ${data.chauffeur.nom}` : "Non assigné"}
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Odometer & technical control info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="card-modern p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-fleet-blue/10 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">Kilométrage Actuel</p>
                  <p className="text-xl font-black text-slate-800 mt-2 relative z-10">
                     {data.kilometrageActuel.toLocaleString()} <span className="text-xs text-slate-400 font-bold">km</span>
                  </p>
               </div>
               <div className="card-modern p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">Mise en service</p>
                  <p className="text-sm font-black text-slate-800 mt-3.5 relative z-10">
                     {formatDate(data.dateMiseService)}
                  </p>
               </div>
               <div className="card-modern p-5 relative overflow-hidden group col-span-2">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100%] transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-end relative z-10">
                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visite Technique</p>
                        <p className="text-lg font-black text-slate-800 mt-3">
                           {data.prochaineVisite ? formatDate(data.prochaineVisite) : "Non programmée"}
                        </p>
                     </div>
                     {data.prochaineVisite && (
                        <Badge variant="warning" className="shadow-sm">Seuil annuel</Badge>
                     )}
                  </div>
               </div>
            </div>

            {/* Planification de Maintenance */}
            <div className="card-modern p-6">
               <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Maintenances Préventives</h3>
                        <p className="text-xs text-slate-400 font-medium">Suivi des alertes kilométriques pour ce camion</p>
                     </div>
                  </div>
                  <Button variant="secondary" onClick={() => window.location.href = `/maintenance?camionId=${data.id}`} className="text-xs py-2 h-auto shadow-sm">
                     Gérer le planning
                  </Button>
               </div>

               <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/80">
                           <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type d'entretien</th>
                           <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kilométrage Cible</th>
                           <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Écart</th>
                           <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {data.maintenancesPlanifiees && data.maintenancesPlanifiees.length > 0 ? (
                           data.maintenancesPlanifiees.map((m: any) => {
                              const restant = m.kilometrageCible - data.kilometrageActuel;
                              const isOverdue = restant <= 0 || m.statut === "en_retard";
                              
                              return (
                                 <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{typeLabels[m.type] || m.type}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">{m.kilometrageCible.toLocaleString()} km</td>
                                    <td className="px-4 py-3 text-sm font-bold">
                                       {isOverdue ? (
                                          <span className="text-rose-600">Dépassé de {Math.abs(restant).toLocaleString()} km</span>
                                       ) : (
                                          <span className="text-emerald-600">Dans {restant.toLocaleString()} km</span>
                                       )}
                                    </td>
                                    <td className="px-4 py-3">
                                       {m.statut === "realise" ? (
                                          <Badge variant="bg-gray-100 text-gray-500">Fait</Badge>
                                       ) : isOverdue ? (
                                          <Badge variant="bg-red-50 text-red-700 border-red-200">Retard</Badge>
                                       ) : (
                                          <Badge variant="bg-green-50 text-green-700 border-green-200">OK</Badge>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 font-medium italic">
                                 Aucun entretien planifié pour ce camion.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Suivi Carburant */}
            <div className="card-modern p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-fleet-blue/10 text-fleet-blue rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Suivi Carburant</h3>
                        <p className="text-xs text-slate-400 font-medium">Consommation moyenne et historique des tickets d'essence</p>
                     </div>
                  </div>
                  <Button variant="secondary" onClick={handleOpenFuelModal} className="text-xs py-2 h-auto shadow-sm">
                     + Ticket Carburant
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                           Aucun ticket pour la consommation
                        </div>
                     )}
                  </div>
                  {/* KPI List */}
                  <div className="space-y-3">
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conso Moyenne</p>
                        <p className="text-xl font-black text-fleet-blue mt-0.5">
                           {data.resume.mois.consommationMoyenne ? `${Math.round(data.resume.mois.consommationMoyenne * 10) / 10} L/100` : "-"}
                        </p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dépenses carburant</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{formatMontant(data.resume.mois.carburantTotal)}</p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Litres Ravitaillés</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{data.resume.mois.litresTotal} Litres</p>
                     </div>
                  </div>
               </div>

               {/* Fuel Tickets Table */}
               <div className="overflow-x-auto rounded-2xl border border-slate-100 mt-4">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/80">
                           <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                           <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kilométrage</th>
                           <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Litres</th>
                           <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coût</th>
                           <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consommation</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-xs">
                        {data.carburants && data.carburants.length > 0 ? (
                           data.carburants.slice(0, 5).map((c: any) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-4 py-2.5 font-medium text-slate-600">{formatDate(c.date)}</td>
                                 <td className="px-4 py-2.5 text-slate-800 font-semibold">{c.kilometrage.toLocaleString()} km</td>
                                 <td className="px-4 py-2.5 font-bold text-fleet-blue">{c.litres} L</td>
                                 <td className="px-4 py-2.5 font-black text-slate-700">{formatMontant(c.coutTotal)}</td>
                                 <td className="px-4 py-2.5 font-bold text-slate-500">
                                    {c.consommation ? `${Math.round(c.consommation * 10) / 10} L/100km` : "-"}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">Aucun ticket carburant.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Suivi Réparations */}
            <div className="card-modern p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Historique des Interventions</h3>
                        <p className="text-xs text-slate-400 font-medium">Réparations mécaniques, pièces changées et entretiens</p>
                     </div>
                  </div>
                  <Button variant="secondary" onClick={handleOpenReparationModal} className="text-xs py-2 h-auto shadow-sm">
                     + Nouvelle Réparation
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
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
                           Aucune réparation mécanique enregistrée
                        </div>
                     )}
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Total du mois</span>
                        <span className="text-lg font-black text-rose-500">{formatMontant(data.resume.mois.reparationsTotal)}</span>
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

               {/* Repairs Log List with Replaced Parts */}
               <div className="space-y-4">
                  {data.reparations && data.reparations.length > 0 ? (
                     data.reparations.map((rep: any) => (
                        <div key={rep.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <Badge variant={rep.type === "vidange" ? "bg-purple-50 text-purple-700" : rep.type === "pneus" ? "bg-gray-50 text-gray-700" : "bg-blue-50 text-blue-700"}>
                                    {typeReparationLabels[rep.type] || rep.type}
                                 </Badge>
                                 <span className="text-xs text-slate-400 font-semibold ml-3">{formatDate(rep.date)} • Odomètre : {rep.kilometrage?.toLocaleString() || 0} km</span>
                              </div>
                              <span className="font-black text-sm text-rose-600">{formatMontant(rep.cout)}</span>
                           </div>
                           <p className="text-xs text-slate-800 font-bold mb-1">Garage : {rep.garage}</p>
                           <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3">{rep.description}</p>
                           
                           {/* Pièces changées */}
                           {rep.piecesChangees && rep.piecesChangees.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pièces de rechange / Prestations :</p>
                                 <div className="flex flex-wrap gap-2">
                                    {rep.piecesChangees.map((p: any) => (
                                       <span key={p.id} className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                                          {p.nom} <span className="text-fleet-blue font-bold">x{p.quantite}</span> ({formatMontant(p.prixUnitaire)})
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     ))
                  ) : (
                     <div className="text-center py-6 text-slate-400 italic text-sm">Aucune réparation enregistrée.</div>
                  )}
               </div>
            </div>

         </div>

         {/* Right Column: Fleet Operational Sheet */}
         <div className="lg:col-span-1">
            <div className="sticky top-24">
               <div className="card-modern p-6 border-fleet-blue/20 bg-gradient-to-b from-white to-fleet-blue/5">
                  <div className="text-center mb-6">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fleet-blue/10 text-fleet-blue mb-3 shadow-sm shadow-fleet-blue/10">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                        </svg>
                     </div>
                     <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        Bilan Exploitation
                     </h4>
                     <p className="text-lg font-black text-slate-800 mt-1">Dépenses du mois</p>
                  </div>

                  <div className="space-y-3 text-xs">
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Kilomètres Parcourus</span>
                        <span className="font-black text-slate-800">{data.resume.mois.kmParcourus.toLocaleString()} km</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Carburant</span>
                        <span className="font-black text-rose-500">-{formatMontant(data.resume.mois.carburantTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Consommation moyenne</span>
                        <span className="font-black text-fleet-blue">{data.resume.mois.consommationMoyenne ? `${Math.round(data.resume.mois.consommationMoyenne * 10) / 10} L/100` : "-"}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Réparations & Filtres</span>
                        <span className="font-black text-rose-500">-{formatMontant(data.resume.mois.reparationsTotal)}</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200">
                     <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center mb-1">Total Dépenses</p>
                     <div className="text-center">
                        <span className="text-2xl font-black text-rose-500">
                           {formatMontant(data.resume.mois.carburantTotal + data.resume.mois.reparationsTotal)}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Modal Plein Carburant */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Ajouter un ticket carburant">
        <form onSubmit={handleAddFuel} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} required />
            <Select
              label="Chauffeur"
              value={fuelChauffeurId}
              onChange={(e) => setFuelChauffeurId(e.target.value)}
              placeholder="Chauffeur qui a fait le plein"
              options={chauffeurs.map(ch => ({
                value: String(ch.id),
                label: `${ch.prenom || ""} ${ch.nom}`,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Kilométrage actuel *" type="number" placeholder={`Index > ${data.kilometrageActuel} km`} value={fuelKm} onChange={(e) => setFuelKm(e.target.value)} required />
            <Input label="Station-Service" placeholder="Ex: Total Yoff" value={fuelStation} onChange={(e) => setFuelStation(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input label="Volume (L) *" type="number" step="0.01" placeholder="Litres" value={fuelLitres} onChange={(e) => setFuelLitres(e.target.value)} required />
            </div>
            <div className="col-span-1">
              <Input label="Prix/Litre (F) *" type="number" step="0.1" value={fuelPrixLitre} onChange={(e) => setFuelPrixLitre(e.target.value)} required />
            </div>
            <div className="col-span-1">
              <Input label="N° Ticket" placeholder="Optionnel" value={fuelNumeroTicket} onChange={(e) => setFuelNumeroTicket(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo du reçu</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  setFuelReceiptFile(file);
                  if (file) {
                    setFuelReceiptPreviewUrl(URL.createObjectURL(file));
                    setFuelRecuUrl("");
                    await uploadFuelReceipt(file);
                  } else {
                    setFuelReceiptPreviewUrl("");
                    setFuelReceiptFileName("");
                    setFuelRecuUrl("");
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-fleet-blue focus:ring-2 focus:ring-fleet-blue/20"
              />
              <p className="mt-2 text-[11px] text-slate-400">Formats acceptés : JPG, PNG, PDF</p>
              {fuelReceiptPreviewUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-500">
                    {fuelReceiptFile?.type.startsWith("image/") ? (
                      <img src={fuelReceiptPreviewUrl} alt="Aperçu reçu" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] font-black">PDF</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{fuelReceiptFileName || fuelReceiptFile?.name}</p>
                    <p className="text-[11px] text-slate-400">{fuelUploadingReceipt ? "Téléversement en cours…" : "Fichier prêt"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsFuelModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting} disabled={fuelUploadingReceipt}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Réparations */}
      <Modal isOpen={isReparationModalOpen} onClose={() => setIsReparationModalOpen(false)} title="Enregistrer une intervention de réparation">
        <form onSubmit={handleAddReparation} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={repDate} onChange={(e) => setRepDate(e.target.value)} required />
            <Select
              label="Type d'intervention *"
              value={repType}
              onChange={(e) => setRepType(e.target.value)}
              options={Object.keys(typeLabels).map(k => ({
                value: k,
                label: typeLabels[k],
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Garage / Prestataire *" placeholder="Nom du garage" value={repGarage} onChange={(e) => setRepGarage(e.target.value)} required />
            <Input label="Kilométrage actuel *" type="number" placeholder="Odomètre de l'intervention" value={repKm} onChange={(e) => setRepKm(e.target.value)} required />
          </div>
          <Textarea label="Description de la panne / Travaux effectués *" placeholder="Rapport d'intervention..." value={repDesc} onChange={(e) => setRepDesc(e.target.value)} required />

          {/* Pièces de rechange */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pièces de rechange / Détails</span>
              <button type="button" className="text-xs text-fleet-blue font-bold hover:underline" onClick={handleAddRepPiece}>
                + Ajouter une pièce
              </button>
            </div>

            {repPieces.map((piece, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Nom de la pièce changée"
                    value={piece.nom}
                    onChange={(e) => handleRepPieceChange(idx, "nom", e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={piece.quantite}
                    onChange={(e) => handleRepPieceChange(idx, "quantite", e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="Prix Unit. (F)"
                    value={piece.prixUnitaire}
                    onChange={(e) => handleRepPieceChange(idx, "prixUnitaire", e.target.value)}
                  />
                </div>
                {repPieces.length > 1 && (
                  <button type="button" className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl mb-0.5" onClick={() => handleRemoveRepPiece(idx)}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <Input label="Coût total calculé (F) *" type="number" value={repCout} onChange={(e) => setRepCout(e.target.value)} required />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsReparationModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Enregistrer l'Intervention</Button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
