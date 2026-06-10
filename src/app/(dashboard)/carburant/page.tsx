"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  Toast,
  Skeleton,
  TableCard,
  Pagination,
} from "@/components/ui";
import { formatDate, formatMontant, formatMontantAbrege } from "@/lib/utils";

// Définition des interfaces pour une meilleure sécurité de typage
interface Camion {
  id: string | number;
  immatriculation: string;
  marque?: string;
  modele?: string;
  dotationAnnuelle?: number;
  budgetRestant?: number;
  budgetConsomme?: number;
}

interface Recu {
  id: number;
  cheminImage: string;
  nomFichier?: string | null;
  mimeType?: string | null;
  tailleOctets?: number | null;
  montantRecu: number;
  commentaire?: string | null;
}

interface Mouvement {
  id: string | number;
  dateOperation: string;
  stationService?: string;
  typeOperation: 'PREVISION' | 'DEPENSE' | 'COMPLEMENT' | 'AJUSTEMENT';
  montant: number;
  recus?: Recu[];
}

interface Dossier {
  id: string | number;
  voyage?: { numeroVoyage: string };
  camion?: Camion;
  chauffeur?: { nom: string; prenom?: string };
  totalDepenses: number;
  totalComplements?: number;
  statut: string;
  createdAt: string;
  mouvements?: Mouvement[];
}

export default function CarburantPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCamion, setFilterCamion] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isAddMovementModalOpen, setIsAddMovementModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt-only upload (attach to existing movement)
  const [isAddRecuModalOpen, setIsAddRecuModalOpen] = useState(false);
  const [recuTargetMvtId, setRecuTargetMvtId] = useState<number | null>(null);
  const [recuTargetCarburantId, setRecuTargetCarburantId] = useState<number | null>(null);
  const [recuOnlyFiles, setRecuOnlyFiles] = useState<File[]>([]);
  const [recuOnlyPreviews, setRecuOnlyPreviews] = useState<
    { url: string; fileName: string; mimeType: string; size: number; previewUrl: string }[]
  >([]);
  const [uploadingRecuOnly, setUploadingRecuOnly] = useState(false);

  // Mouvement form fields
  const [mouvementDossierId, setMouvementDossierId] = useState("");
  const [typeOperation, setTypeOperation] = useState("DEPENSE");
  const [montant, setMontant] = useState("");
  const [commentaire, setCommentaire] = useState("");
  // Multi-receipts state
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptPreviews, setReceiptPreviews] = useState<
    { url: string; fileName: string; mimeType: string; size: number; previewUrl: string }[]
  >([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (filterCamion && filterCamion !== "tous") query.append("camionId", filterCamion);
      if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

      const res = await fetch(`/api/carburant?${query.toString()}`);
      const data = await res.json();
      setDossiers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des dossiers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCamions = async () => {
    try {
      const res = await fetch("/api/camions");
      const data = await res.json();
      setCamions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des camions:", err);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, [search, filterCamion, filterStatut]);

  useEffect(() => {
    fetchCamions();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalDepenses = dossiers?.reduce((sum, d) => sum + (d.totalDepenses || 0), 0) || 0;
    const totalComplements = dossiers?.reduce((sum, d) => sum + (d.totalComplements || 0), 0) || 0;
    const enCours = dossiers?.filter(d => d.statut === "EN_COURS")?.length || 0;
    const dossiersAvecComplements = dossiers?.filter(d => (d.totalComplements || 0) > 0)?.length || 0;
    return { totalDepenses, totalComplements, enCours, dossiersAvecComplements };
  }, [dossiers]);

  // Pagination logic
  const paginatedDossiers = useMemo(() => {
    if (!dossiers) return [];
    const start = (currentPage - 1) * pageSize;
    return dossiers.slice(start, start + pageSize);
  }, [dossiers, currentPage, pageSize]);

  const totalPages = Math.ceil((dossiers?.length || 0) / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCamion, filterStatut, pageSize]);

  useEffect(() => {
    return () => {
      receiptPreviews.forEach((r) => {
        if (r.previewUrl.startsWith("blob:")) URL.revokeObjectURL(r.previewUrl);
      });
    };
  }, [receiptPreviews]);

  const uploadReceiptFiles = async (files: File[]) => {
    setUploadingReceipt(true);
    const uploaded: typeof receiptPreviews = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/uploads/receipts", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Échec du téléversement");
        uploaded.push({
          url: data.url,
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.size,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (error) {
        console.error(error);
        setToastMessage(`Erreur pour ${file.name}: ${(error as Error).message}`);
        setToastType("error");
        setShowToast(true);
      }
    }
    setReceiptPreviews((prev) => [...prev, ...uploaded]);
    setUploadingReceipt(false);
  };

  // Upload recu files and return uploaded previews (reusable)
  const uploadRecuOnlyFiles = async (files: File[]): Promise<typeof recuOnlyPreviews> => {
    setUploadingRecuOnly(true);
    const uploaded: typeof recuOnlyPreviews = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads/receipts", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec du téléversement");
        uploaded.push({
          url: data.url,
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.size,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (error) {
        console.error(error);
        setToastMessage(`Erreur pour ${file.name}: ${(error as Error).message}`);
        setToastType("error");
        setShowToast(true);
      }
    }
    setRecuOnlyPreviews((prev) => [...prev, ...uploaded]);
    setUploadingRecuOnly(false);
    return uploaded;
  };

  const handleOpenAddRecuModal = (carburantId: number, mouvementId: number) => {
    setRecuTargetCarburantId(carburantId);
    setRecuTargetMvtId(mouvementId);
    setRecuOnlyFiles([]);
    setRecuOnlyPreviews([]);
    setUploadingRecuOnly(false);
    setIsAddRecuModalOpen(true);
  };

  const handleAddRecuToMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recuTargetCarburantId || !recuTargetMvtId || recuOnlyPreviews.length === 0) return;
    setIsSubmitting(true);

    try {
      // Send each receipt to the existing movement
      for (const r of recuOnlyPreviews) {
        const res = await fetch(
          `/api/carburant/${recuTargetCarburantId}/mouvements/${recuTargetMvtId}/recus`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cheminImage: r.url,
              montantRecu: 0, // no extra cost, just attaching the file
              nomFichier: r.fileName,
              mimeType: r.mimeType,
              tailleOctets: r.size,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout du reçu");
      }

      setToastMessage("Reçu(s) ajouté(s) avec succès");
      setToastType("success");
      setShowToast(true);
      setIsAddRecuModalOpen(false);

      // Refresh the selected dossier
      if (selectedDossier) {
        const res = await fetch(`/api/carburant/${selectedDossier.id}`);
        const updated = await res.json();
        if (!updated.error) setSelectedDossier(updated);
      }
    } catch (error) {
      setToastMessage((error as Error).message || "Erreur");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddMovementModal = (dossierId?: string) => {
    setMouvementDossierId(dossierId || "");
    setTypeOperation("DEPENSE");
    setMontant("");
    setCommentaire("");
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setUploadingReceipt(false);
    setIsAddMovementModalOpen(true);
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mouvementDossierId) {
      setToastMessage("Veuillez sélectionner un dossier.");
      setToastType("error");
      setShowToast(true);
      return;
    }

    if (uploadingReceipt) {
      setToastMessage("Attendez que le reçu soit téléversé avant d'enregistrer.");
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    const receiptsPayload = receiptPreviews.map((r) => ({
      url: r.url,
      fileName: r.fileName,
      mimeType: r.mimeType,
      size: r.size,
      montantRecu: parseFloat(montant),
    }));

    const payload = {
      typeOperation,
      montant: parseFloat(montant),
      commentaire,
      receipts: receiptsPayload.length > 0 ? receiptsPayload : undefined,
    };

    fetch(`/api/carburant/${mouvementDossierId}/mouvements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSubmitting(false);
        if (data.error) {
          setToastMessage(data.error);
          setToastType("error");
          setShowToast(true);
        } else {
          setToastMessage("Mouvement enregistré avec succès");
          setToastType("success");
          setShowToast(true);
          setIsAddMovementModalOpen(false);
          fetchDossiers();
          fetchCamions();

          // Re-fetch the selected dossier with fresh data (includes recus)
          if (selectedDossier && String(selectedDossier.id) === String(mouvementDossierId)) {
            fetch(`/api/carburant/${mouvementDossierId}`)
              .then((res) => res.json())
              .then((updated) => {
                if (updated && !updated.error) setSelectedDossier(updated);
              });
          }
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage("Une erreur est survenue");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
  };

  const getStatusBadge = (statut: string) => {
    if (statut === "EN_COURS" || statut === "en_cours") {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse">
          En cours
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
        Clôturé
      </span>
    );
  };

  const getTypeOperationBadge = (type: string) => {
    const colors: Record<string, string> = {
      PREVISION: "bg-blue-50 text-blue-700 border-blue-200",
      DEPENSE: "bg-rose-50 text-rose-700 border-rose-200",
      COMPLEMENT: "bg-orange-50 text-orange-700 border-orange-200",
      AJUSTEMENT: "bg-purple-50 text-purple-700 border-purple-200",
    };
    const color = colors[type] || "bg-slate-50 text-slate-700 border-slate-200";
    return (
      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${color}`}>
        {type}
      </span>
    );
  };

  const getBudgetVehiculeTotal = (dossier: Dossier | null) =>
    dossier?.camion?.dotationAnnuelle || 0;

  const getBudgetVehiculeRestant = (dossier: Dossier | null) => {
    if (typeof dossier?.camion?.budgetRestant === "number") {
      return dossier.camion.budgetRestant;
    }

    const budgetTotal = getBudgetVehiculeTotal(dossier);
    const budgetConsomme = dossier?.camion?.budgetConsomme || 0;
    return budgetTotal - budgetConsomme;
  };

  const getUtilisationBudgetVehicule = (dossier: Dossier | null) => {
    const budgetTotal = getBudgetVehiculeTotal(dossier);
    if (budgetTotal <= 0) return 0;
    return Math.round(((dossier?.totalDepenses || 0) / budgetTotal) * 100);
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      className: "w-28",
      render: (item: Dossier) => (
        <span className="text-xs font-black tracking-widest text-slate-500">{formatDate(item.createdAt).split(" ")[0]}</span>
      ),
    },
    {
      key: "voyage",
      header: "N° Voyage",
      className: "w-32",
      render: (item: Dossier) => (
        <span className="text-xs font-black tracking-widest text-slate-500">{item.voyage?.numeroVoyage || "N/A"}</span>
      ),
    },
    {
      key: "camion",
      header: "Camion",
      className: "w-32",
      render: (item: Dossier) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800 text-sm">{item.camion?.immatriculation || "-"}</div>
        </div>
      ),
    },
    {
      key: "chauffeur",
      header: "Chauffeur",
      className: "w-40",
      render: (item: Dossier) => (
        <div className="text-sm font-semibold text-slate-600">
          {item.chauffeur ? `${item.chauffeur.prenom || ""} ${item.chauffeur.nom}` : "Non assigné"}
        </div>
      ),
    },
    {
      key: "budgetConsommeVoyage",
      header: "Consommé voyage",
      className: "w-28",
      render: (item: Dossier) => (
        <span className="text-sm font-black text-rose-500">{formatMontant((item.totalDepenses || 0) + (item.totalComplements || 0))}</span>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      className: "w-24 text-right",
      render: (item: Dossier) => getStatusBadge(item.statut),
    },
  ];

  return (
    <div className="space-y-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border-l-4 border-rose-500 bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-50/50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dépenses Totales</p>
            <p className="text-2xl font-black leading-none text-rose-600 tracking-tight mt-1">{formatMontantAbrege(stats.totalDepenses)}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Cumul des paiements</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-l-4 border-fleet-blue bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-fleet-blue/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Compléments Carburant</p>
            <p className="text-2xl font-black leading-none text-fleet-blue tracking-tight mt-1">{formatMontantAbrege(stats.totalComplements)}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Montants ajoutés en cours de voyage</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-l-4 border-amber-500 bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-50/50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Missions actives</p>
            <p className="text-2xl font-black leading-none text-amber-600 tracking-tight mt-1">{stats.enCours}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Suivis en cours</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-l-4 border-red-600 bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-50/50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Avec Compléments</p>
            <p className="text-2xl font-black leading-none text-red-600 tracking-tight mt-1">{stats.dossiersAvecComplements}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Voyages ayant reçu un ajout</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <TableCard>
        {/* Filters bar inside TableCard */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un voyage, un camion ou un chauffeur..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { value: "tous", label: "Tous" },
              { value: "EN_COURS", label: "En cours" },
              { value: "CLOTURE", label: "Clôturés" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilterStatut(btn.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex-shrink-0 ${
                  filterStatut === btn.value
                    ? "bg-fleet-blue text-white shadow-lg shadow-fleet-blue/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedDossiers}
              onRowClick={(item) => setSelectedDossier(item)}
              emptyMessage="Aucun dossier carburant trouvé."
            />
            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={dossiers.length}
              />
            </div>
          </>
        )}
      </TableCard>

      {/* Modal - Dossier Details */}
      <Modal
        isOpen={Boolean(selectedDossier)}
        onClose={() => setSelectedDossier(null)}
        title="Fiche Carburant Voyage"
        size="xl"
        noScroll
      >
        {selectedDossier && (
          <div className="space-y-6 h-full flex flex-col">
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">Dossier #{selectedDossier.id}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Voyage {selectedDossier.voyage?.numeroVoyage} • {selectedDossier.camion?.immatriculation}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {getStatusBadge(selectedDossier.statut)}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créé le {formatDate(selectedDossier.createdAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* Left Side: Summary & Progress (4 cols) */}
              <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-1">
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-50 pb-3">Récapitulatif Carburant</h4>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Budget Total Véhicule</p>
                      <p className="text-lg font-black text-slate-700">{formatMontant(getBudgetVehiculeTotal(selectedDossier))}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="text-[9px] font-bold text-rose-400 uppercase mb-1">Budget Consommé Voyage</p>
                      <p className="text-lg font-black text-rose-600">{formatMontant(selectedDossier.totalDepenses)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-[9px] font-bold text-amber-500 uppercase mb-1">Compléments Carburant</p>
                      <p className="text-lg font-black text-amber-600">{formatMontant(selectedDossier.totalComplements || 0)}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${getBudgetVehiculeRestant(selectedDossier) < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className={`text-[9px] font-bold uppercase mb-1 ${getBudgetVehiculeRestant(selectedDossier) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>Budget Restant Véhicule</p>
                      <p className={`text-lg font-black ${getBudgetVehiculeRestant(selectedDossier) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatMontant(getBudgetVehiculeRestant(selectedDossier))}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-400 tracking-widest">Utilisation budget véhicule</span>
                      <span className={getUtilisationBudgetVehicule(selectedDossier) >= 100 ? 'text-red-500' : 'text-fleet-blue'}>
                        {getUtilisationBudgetVehicule(selectedDossier)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-700 ${
                          getUtilisationBudgetVehicule(selectedDossier) >= 100 ? 'bg-red-500' : 'bg-fleet-blue'
                        }`}
                        style={{ width: `${Math.min(100, getUtilisationBudgetVehicule(selectedDossier))}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium italic mt-1">
                      Ici on suit le consommé du voyage et le budget global restant du véhicule, sans afficher de budget prévu.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Véhicule Associé</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-fleet-blue font-black text-xs">
                      {selectedDossier.camion?.immatriculation.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{selectedDossier.camion?.immatriculation}</p>
                      <p className="text-[10px] font-bold text-slate-400">{selectedDossier.camion?.marque} {selectedDossier.camion?.modele}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: History (8 cols) */}
              <div className="lg:col-span-8 flex flex-col min-h-0 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Historique des Mouvements</h4>
                  <span className="bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">
                    {selectedDossier.mouvements?.length || 0} Ticket(s)
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {selectedDossier.mouvements && selectedDossier.mouvements.length > 0 ? (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-3">Date & Station</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3 text-right">Montant</th>
                          <th className="px-6 py-3 text-center">Reçu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedDossier.mouvements.map((mvt: Mouvement) => (
                          <tr key={mvt.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{formatDate(mvt.dateOperation).split(' ')[0]}</p>
                              <p className="text-xs font-bold text-slate-700 group-hover:text-fleet-blue transition-colors">{mvt.stationService || "Station non précisée"}</p>
                            </td>
                            <td className="px-6 py-4">{getTypeOperationBadge(mvt.typeOperation || 'DEPENSE')}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-black text-slate-900">{formatMontant(mvt.montant || 0)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {mvt.recus && mvt.recus.length > 0 ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  {mvt.recus.slice(0, 4).map((recu, ri) => (
                                    <a
                                      key={ri}
                                      href={recu.cheminImage}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:ring-2 hover:ring-fleet-blue/40 transition-all"
                                    >
                                      {recu.mimeType?.startsWith("image/") ? (
                                        <img
                                          src={recu.cheminImage}
                                          alt={recu.nomFichier || "Reçu"}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="flex items-center justify-center w-full h-full text-[8px] font-black text-fleet-blue uppercase tracking-widest">
                                          PDF
                                        </span>
                                      )}
                                    </a>
                                  ))}
                                  {mvt.recus.length > 4 && (
                                    <span className="text-[9px] font-bold text-slate-400">+{mvt.recus.length - 4}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">Aucun</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aucun mouvement enregistré</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dépenses Cumulées</p>
                  <p className="text-xl font-black text-fleet-blue">{formatMontant(selectedDossier.totalDepenses)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 shrink-0">
              <Button
                type="button"
                variant="primary"
                onClick={() => handleOpenAddMovementModal(String(selectedDossier.id))}
                className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un mouvement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelectedDossier(null)} className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-none">
                Fermer la visionneuse
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Ajouter un Mouvement */}
      <Modal
        isOpen={isAddMovementModalOpen}
        onClose={() => setIsAddMovementModalOpen(false)}
        title="Ajouter un mouvement carburant"
        size="md"
      >
        <form onSubmit={handleAddMovement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type d'opération *"
              value={typeOperation}
              onChange={(value) => setTypeOperation(value)}
              options={[
                { value: "DEPENSE", label: "Dépense" },
                { value: "COMPLEMENT", label: "Complément" },
                { value: "PREVISION", label: "Prévision" },
                { value: "AJUSTEMENT", label: "Ajustement" },
              ]}
            />
            <Input
              label="Montant (F) *"
              type="number"
              step="0.01"
              placeholder="Ex: 50000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçus (un ou plusieurs)</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setReceiptFiles((prev) => [...prev, ...files]);
                  await uploadReceiptFiles(files);
                  e.target.value = "";
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-fleet-blue focus:ring-2 focus:ring-fleet-blue/20 file:mr-3 file:rounded-lg file:border-0 file:bg-fleet-blue file:px-3 file:py-1.5 file:text-[10px] file:font-black file:text-white file:uppercase file:tracking-widest hover:file:bg-fleet-blue/90"
              />
              <p className="mt-2 text-[11px] text-slate-400">Formats acceptés : JPG, PNG, PDF — sélectionnez plusieurs fichiers à la fois</p>
              {receiptPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {receiptPreviews.map((r, i) => (
                    <div key={i} className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <div className="flex h-14 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                        {r.mimeType.startsWith("image/") ? (
                          <img src={r.previewUrl} alt={r.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-black text-fleet-blue uppercase tracking-widest">PDF</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[10px] font-semibold text-slate-700">{r.fileName}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptPreviews((prev) => prev.filter((_, j) => j !== i));
                          setReceiptFiles((prev) => prev.filter((_, j) => j !== i));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 text-[10px] font-black shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadingReceipt && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Téléversement en cours…
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Commentaire</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Optionnel — Raison du mouvement, détails…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-fleet-blue focus:ring-2 focus:ring-fleet-blue/20 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddMovementModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={uploadingReceipt}>
              Enregistrer le mouvement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Ajouter un reçu à un mouvement existant */}
      <Modal
        isOpen={isAddRecuModalOpen}
        onClose={() => setIsAddRecuModalOpen(false)}
        title="Ajouter un reçu au mouvement"
        size="sm"
      >
        <form onSubmit={handleAddRecuToMovement} className="space-y-4">
          <div className="rounded-xl border border-fleet-blue/20 bg-fleet-blue/5 p-3 text-[11px] text-slate-600 font-medium">
            Le reçu sera attaché au mouvement existant. Aucun montant supplémentaire n'est ajouté.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçus</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setRecuOnlyFiles((prev) => [...prev, ...files]);
                  await uploadRecuOnlyFiles(files);
                  e.target.value = "";
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-fleet-blue file:px-3 file:py-1.5 file:text-[10px] file:font-black file:text-white file:uppercase file:tracking-widest hover:file:bg-fleet-blue/90"
              />
              <p className="mt-2 text-[11px] text-slate-400">JPG, PNG, PDF — plusieurs fichiers possibles</p>
              {recuOnlyPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {recuOnlyPreviews.map((r, i) => (
                    <div key={i} className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <div className="flex h-14 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                        {r.mimeType.startsWith("image/") ? (
                          <img src={r.previewUrl} alt={r.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-black text-fleet-blue uppercase tracking-widest">PDF</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[10px] font-semibold text-slate-700">{r.fileName}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setRecuOnlyPreviews((prev) => prev.filter((_, j) => j !== i));
                          setRecuOnlyFiles((prev) => prev.filter((_, j) => j !== i));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 text-[10px] font-black shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadingRecuOnly && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Téléversement en cours…
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddRecuModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={uploadingRecuOnly || recuOnlyPreviews.length === 0}>
              Attacher le(s) reçu(s)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
