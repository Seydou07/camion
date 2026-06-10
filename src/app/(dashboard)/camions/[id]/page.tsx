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
  typeReparationLabels,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [alerts, setAlerts] = useState<any[]>([]);

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

  useEffect(() => {
    fetch("/api/alertes")
      .then((r) => r.json())
      .then((d) => setAlerts((d.alerts || []).filter((a: any) => a.camionId === parseInt(id))))
      .catch(() => {});
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

  const typeLabels: Record<string, string> = {
    vidange: "Vidange Moteur",
    pneus: "Remplacement Pneus",
    freins: "Système de Freinage",
    courroie: "Courroie d'Accessoire / Distribution",
    batterie: "Batterie",
    visite_technique: "Visite Technique",
    autre: "Autre Entretien",
  };

  const formatDateSafe = (value?: Date | string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return formatDate(parsed);
  };

  const currentYear = new Date().getFullYear();

  const carburantDossiers = Array.isArray(data.recentCarburants) ? data.recentCarburants : [];
  const reparations = Array.isArray(data.recentReparations) ? data.recentReparations : [];

  const budgetCarburantConsomme = data.stats?.budgetCarburantConsomme || 0;
  const budgetMaintenanceConsomme = data.stats?.budgetMaintenanceConsomme || 0;
  const budgetVehiculeTotal = data.dotationAnnuelle || 0;
  const budgetVehiculeConsomme =
    budgetCarburantConsomme + budgetMaintenanceConsomme;
  const budgetVehiculeRestant = budgetVehiculeTotal - budgetVehiculeConsomme;
  const budgetVehiculePercent =
    budgetVehiculeTotal > 0
      ? Math.min(100, Math.round((budgetVehiculeConsomme / budgetVehiculeTotal) * 100))
      : 0;

  const carburantChartData = [...carburantDossiers]
    .slice(0, 6)
    .reverse()
    .map((c: any, index: number) => ({
      label: formatDateSafe(c.createdAt).slice(0, 5) || `D${index + 1}`,
      depenses: c.totalDepenses || 0,
    }));

  const carburantRows = carburantDossiers.slice(0, 3);
  const carburantRowsRestants = Math.max(0, (data.counts?.carburants || 0) - carburantRows.length);

  const maintenanceFrequencyData = Array.isArray(data.maintenanceFrequency)
    ? data.maintenanceFrequency
    : [];

  const derniereMaintenance = reparations.length > 0 ? reparations[0] : null;
  const recentReparations = reparations.slice(0, 3);
  const reparationsRestantes = Math.max(0, (data.counts?.reparations || 0) - recentReparations.length);

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

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, i: number) => {
            const isCritique = alert.severity === "critique";
            const isHaute = alert.severity === "haute";
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
                  isCritique ? "border-rose-200 bg-rose-50" : isHaute ? "border-amber-200 bg-amber-50" : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCritique ? "bg-rose-500" : isHaute ? "bg-amber-500" : "bg-yellow-400"}`} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 w-28 shrink-0">
                  {alert.type === "vidange" ? "Vidange" : alert.type === "assurance" ? "Assurance" : "Visite Technique"}
                </span>
                <span className="text-sm font-bold text-slate-700">{alert.message}</span>
                <span
                  className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    isCritique ? "bg-rose-200 text-rose-700" : isHaute ? "bg-amber-200 text-amber-700" : "bg-yellow-200 text-yellow-700"
                  }`}
                >
                  {isCritique ? "Critique" : isHaute ? "Haute" : "Moyenne"}
                </span>
              </div>
            );
          })}
        </div>
      )}

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
                        <p className="text-xs text-slate-400 font-medium">Evolution des dépenses carburant du véhicule dans le temps</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Graph */}
                  <div className="md:col-span-2 h-[220px]">
                     {carburantChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={carburantChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                           <XAxis dataKey="label" fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                           <YAxis fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                           <RechartsTooltip
                             cursor={{ fill: '#F1F5F9' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: any) => formatMontant(Number(value))}
                           />
                           <Bar dataKey="depenses" name="Dépenses carburant" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           Aucun dossier carburant enregistré
                        </div>
                     )}
                  </div>
                  {/* KPI List */}
                  <div className="space-y-3">
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Budget Carburant Consommé</p>
                        <p className="text-xl font-black text-fleet-blue mt-0.5">
                           {formatMontant(budgetCarburantConsomme)}
                        </p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dernier dossier</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">
                           {carburantDossiers[0] ? formatDateSafe(carburantDossiers[0].createdAt) : "-"}
                        </p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dossiers Carburant</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{data.counts?.carburants || 0}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniers dossiers carburant</p>
                     {carburantRowsRestants > 0 && (
                        <span className="text-[10px] font-bold text-slate-500">
                           + {carburantRowsRestants} autre(s) non affiché(s)
                        </span>
                     )}
                  </div>
                  {carburantRows.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {carburantRows.map((c: any) => (
                           <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                 <span className="text-xs font-black text-slate-800">{formatDateSafe(c.createdAt)}</span>
                                 <span className="text-[10px] font-bold text-slate-500">
                                    {c.statut === "CLOTURE" ? "Clôturé" : "En cours"}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-500 font-semibold truncate">
                                 {c.chauffeur ? `${c.chauffeur.prenom || ""} ${c.chauffeur.nom}`.trim() : "Non assigné"}
                              </p>
                              <p className="text-lg font-black text-slate-800">{formatMontant(c.totalDepenses || 0)}</p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="px-4 py-6 text-center text-slate-400 italic rounded-2xl border border-slate-100 bg-slate-50/70">
                        Aucun dossier carburant.
                     </div>
                  )}
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
               </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
                  <div className="h-[200px]">
                      {maintenanceFrequencyData.some((item: any) => item.interventions > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={maintenanceFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                              <XAxis dataKey="label" fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                              <RechartsTooltip
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                 formatter={(value: any) => [`${value} intervention(s)`, "Fréquence"]}
                              />
                              <Bar dataKey="interventions" name="Interventions" fill="#EF4444" radius={[6, 6, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           Aucune intervention cette année
                        </div>
                     )}
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Interventions ce mois</span>
                        <span className="text-lg font-black text-rose-500">{data.counts?.reparationsMois || 0}</span>
                     </div>
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Budget maintenance consommé</span>
                        <span className="text-lg font-black text-slate-800">{formatMontant(budgetMaintenanceConsomme)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Dernière maintenance</span>
                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                           {derniereMaintenance ? formatDateSafe(derniereMaintenance.date) : "-"}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernières interventions</p>
                     {reparationsRestantes > 0 && (
                        <span className="text-[10px] font-bold text-slate-500">
                           + {reparationsRestantes} autre(s) non affichée(s)
                        </span>
                     )}
                  </div>
                  {recentReparations.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recentReparations.map((rep: any) => (
                           <div key={rep.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                 <Badge variant={rep.type === "vidange" ? "bg-purple-50 text-purple-700" : rep.type === "pneus" ? "bg-gray-50 text-gray-700" : "bg-blue-50 text-blue-700"}>
                                    {typeReparationLabels[rep.type] || rep.type}
                                 </Badge>
                                 <span className="text-xs font-black text-rose-600">{formatMontant(rep.cout)}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-semibold">{formatDateSafe(rep.date)}</p>
                              <p className="text-sm text-slate-800 font-bold truncate">{rep.garage}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{rep.description}</p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-6 text-slate-400 italic text-sm rounded-2xl border border-slate-100 bg-slate-50/70">
                        Aucune réparation enregistrée.
                     </div>
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
                        Budget Véhicule
                     </h4>
                     <p className="text-lg font-black text-slate-800 mt-1">Vue globale du camion</p>
                  </div>

                  <div className="space-y-3 text-xs">
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Budget véhicule</span>
                        <span className="font-black text-slate-800">{formatMontant(budgetVehiculeTotal)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Budget consommé</span>
                        <span className="font-black text-rose-500">{formatMontant(budgetVehiculeConsomme)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Budget restant</span>
                        <span className={`font-black ${budgetVehiculeRestant < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                           {formatMontant(budgetVehiculeRestant)}
                        </span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Consommé carburant</span>
                        <span className="font-black text-fleet-blue">{formatMontant(budgetCarburantConsomme)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-slate-500">Consommé maintenance</span>
                        <span className="font-black text-amber-600">{formatMontant(budgetMaintenanceConsomme)}</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200">
                     <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center mb-2">Utilisation du budget</p>
                     <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                           className={`h-full transition-all duration-700 ${budgetVehiculePercent >= 100 ? "bg-rose-500" : "bg-fleet-blue"}`}
                           style={{ width: `${budgetVehiculePercent}%` }}
                        />
                     </div>
                     <p className="text-center text-xs font-black mt-3 text-slate-700">{budgetVehiculePercent}% consommé</p>
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
