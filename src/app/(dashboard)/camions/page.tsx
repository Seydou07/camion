"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  DataTable,
  TableCard,
  Pagination,
  Modal,
  Toast,
  Skeleton,
  Textarea,
  ConfirmModal,
} from "@/components/ui";
import { formatDate, formatMontant, formatMontantAbrege, statutCamionColors, statutCamionLabels } from "@/lib/utils";

export default function CamionsPage() {
  const [camions, setCamions] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Budget Global
  const [budgetGlobal, setBudgetGlobal] = useState<number>(0);
  const [editingBudgetGlobal, setEditingBudgetGlobal] = useState(false);
  const [budgetGlobalInput, setBudgetGlobalInput] = useState("");

  // Formulaire Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCamion, setEditingCamion] = useState<any>(null);

  // Form fields
  const [immatriculation, setImmatriculation] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [capaciteTonnes, setCapaciteTonnes] = useState("");
  const [statut, setStatut] = useState("en_service");
  const [chauffeurId, setChauffeurId] = useState("aucune");
  const [kilometrageActuel, setKilometrageActuel] = useState("0");
  const [dateMiseService, setDateMiseService] = useState("");
  const [prochaineVisite, setProchaineVisite] = useState("");
  const [annee, setAnnee] = useState("");
  const [numeroChassis, setNumeroChassis] = useState("");
  const [couleur, setCouleur] = useState("");
  const [carburant, setCarburant] = useState("Diesel");
  const [capaciteReservoir, setCapaciteReservoir] = useState("");
  const [transmission, setTransmission] = useState("Manuelle");
  const [dotationAnnuelle, setDotationAnnuelle] = useState("");
  const [frequenceVidange, setFrequenceVidange] = useState("");
  const [echeanceAssurance, setEcheanceAssurance] = useState("");
  const [numeroPoliceAssurance, setNumeroPoliceAssurance] = useState("");
  const [compagnieAssurance, setCompagnieAssurance] = useState("");
  const [notes, setNotes] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  // Confirmation suppression
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCamions = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/camions?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCamions(Array.isArray(data) ? data : []);
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
      .then((data) => setChauffeurs(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  const fetchBudgetGlobal = () => {
    fetch("/api/parametres?cle=budget_annuel_global")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.valeur) {
          setBudgetGlobal(parseFloat(data.valeur));
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCamions();
  }, [search, filterStatut]);

  useEffect(() => {
    fetchChauffeurs();
    fetchBudgetGlobal();
  }, []);

  // Budget calculations
  const budgetStats = useMemo(() => {
    const totalAlloue = camions.reduce((sum, c) => sum + (c.dotationAnnuelle || 0), 0);
    const totalConsomme = camions.reduce((sum, c) => sum + (c.budgetConsomme || 0), 0);
    const budgetRestant = budgetGlobal - totalAlloue;
    const budgetReelRestant = budgetGlobal - totalConsomme;
    return { totalAlloue, totalConsomme, budgetRestant, budgetReelRestant };
  }, [camions, budgetGlobal]);

  // Pagination logic
  const paginatedCamions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return camions.slice(start, start + pageSize);
  }, [camions, currentPage, pageSize]);

  const totalPages = Math.ceil(camions.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatut, pageSize]);

  // Save budget global
  const handleSaveBudgetGlobal = () => {
    const val = parseFloat(budgetGlobalInput);
    if (isNaN(val) || val < 0) return;

    fetch("/api/parametres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cle: "budget_annuel_global",
        valeur: String(val),
        description: "Budget annuel total pour la flotte",
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setBudgetGlobal(val);
        setEditingBudgetGlobal(false);
        setToastMessage("Budget global mis à jour");
        setToastType("success");
        setShowToast(true);
      })
      .catch(() => {
        setToastMessage("Erreur lors de la mise à jour du budget");
        setToastType("error");
        setShowToast(true);
      });
  };

  const handleOpenAddModal = () => {
    setEditingCamion(null);
    setImmatriculation("");
    setMarque("");
    setModele("");
    setCapaciteTonnes("");
    setStatut("en_service");
    setChauffeurId("aucune");
    setKilometrageActuel("0");
    setDateMiseService(new Date().toISOString().split("T")[0]);
    setProchaineVisite("");
    setAnnee("");
    setNumeroChassis("");
    setCouleur("");
    setCarburant("Diesel");
    setCapaciteReservoir("");
    setTransmission("Manuelle");
    setDotationAnnuelle("");
    setFrequenceVidange("");
    setEcheanceAssurance("");
    setNumeroPoliceAssurance("");
    setCompagnieAssurance("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (camion: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCamion(camion);
    setImmatriculation(camion.immatriculation);
    setMarque(camion.marque);
    setModele(camion.modele || "");
    setCapaciteTonnes(String(camion.capaciteTonnes));
    setStatut(camion.statut);
    setChauffeurId(camion.chauffeurId ? String(camion.chauffeurId) : "aucune");
    setKilometrageActuel(String(camion.kilometrageActuel));
    setDateMiseService(camion.dateMiseService ? new Date(camion.dateMiseService).toISOString().split("T")[0] : "");
    setProchaineVisite(camion.prochaineVisite ? new Date(camion.prochaineVisite).toISOString().split("T")[0] : "");
    setAnnee(camion.annee ? String(camion.annee) : "");
    setNumeroChassis(camion.numeroChassis || "");
    setCouleur(camion.couleur || "");
    setCarburant(camion.carburant || "Diesel");
    setCapaciteReservoir(camion.capaciteReservoir ? String(camion.capaciteReservoir) : "");
    setTransmission(camion.transmission || "Manuelle");
    setDotationAnnuelle(camion.dotationAnnuelle ? String(camion.dotationAnnuelle) : "");
    setFrequenceVidange(camion.frequenceVidange ? String(camion.frequenceVidange) : "");
    setEcheanceAssurance(camion.echeanceAssurance ? new Date(camion.echeanceAssurance).toISOString().split("T")[0] : "");
    setNumeroPoliceAssurance(camion.numeroPoliceAssurance || "");
    setCompagnieAssurance(camion.compagnieAssurance || "");
    setNotes(camion.notes || "");
    setIsModalOpen(true);
  };

  const handleDeleteCamion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDeleteCamion = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/camions/${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Camion supprimé avec succès");
          setToastType("success");
          setShowToast(true);
          fetchCamions();
        } else {
          setToastMessage(data.error || "Erreur de suppression");
          setToastType("error");
          setShowToast(true);
        }
      })
      .finally(() => {
        setDeleteLoading(false);
        setDeleteTarget(null);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      immatriculation,
      marque,
      modele,
      capaciteTonnes: parseFloat(capaciteTonnes),
      statut,
      kilometrageActuel: parseInt(kilometrageActuel),
      dateMiseService,
      prochaineVisite: prochaineVisite || null,
      chauffeurId: chauffeurId === "aucune" ? null : parseInt(chauffeurId),
      annee,
      numeroChassis,
      couleur,
      carburant,
      capaciteReservoir,
      transmission,
      dotationAnnuelle,
      frequenceVidange,
      echeanceAssurance: echeanceAssurance || null,
      numeroPoliceAssurance,
      compagnieAssurance,
      notes,
    };

    const url = editingCamion ? `/api/camions/${editingCamion.id}` : "/api/camions";
    const method = editingCamion ? "PUT" : "POST";

    fetch(url, {
      method,
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
          setToastMessage(editingCamion ? "Camion modifié avec succès" : "Camion ajouté avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchCamions();
          fetchChauffeurs();
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

  // Filtrer les chauffeurs disponibles
  const getChauffeursOptions = () => {
    const opts = [{ value: "aucune", label: "Aucun chauffeur assigné" }];
    
    chauffeurs.forEach((ch) => {
      const isAvailable = !ch.camion || (editingCamion && ch.camion.id === editingCamion.id);
      if (isAvailable) {
        opts.push({
          value: String(ch.id),
          label: `${ch.prenom || ""} ${ch.nom}`,
        });
      }
    });

    return opts;
  };

  // Helper: budget percentage
  const getBudgetPercent = (consomme: number, alloue: number) => {
    if (!alloue || alloue === 0) return 0;
    return Math.min(100, Math.round((consomme / alloue) * 100));
  };

  const columns = [
    {
      key: "camion",
      header: "Véhicule",
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-fleet-blue/10 text-fleet-blue">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.immatriculation}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.marque} {item.modele || ""}</p>
          </div>
        </div>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => (
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${statutCamionColors[item.statut]}`}>
          {statutCamionLabels[item.statut]}
        </span>
      ),
    },
    {
      key: "chauffeur",
      header: "Chauffeur",
      render: (item: any) => item.chauffeur ? (
        <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{item.chauffeur.prenom || ""} {item.chauffeur.nom}</span>
      ) : (
        <span className="text-slate-400 italic text-xs">Aucun</span>
      ),
    },
    {
      key: "kilometrage",
      header: "Kilométrage actuel",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.kilometrageActuel?.toLocaleString() || 0} km</span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "w-[120px] text-right",
      render: (item: any) => (
        <div className="flex items-center justify-end gap-2 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); window.location.href = `/camions/${item.id}`; }}
            className="p-2 text-fleet-blue hover:bg-fleet-blue hover:text-white rounded-lg transition-all"
            title="Voir"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleOpenEditModal(item, e)}
            className="p-2 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteCamion(item.id, e)}
            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // Determine row className for alerts (left border color)
  const getRowClassName = (item: any) => {
    if (item.alerteVisite || item.alerteAssurance || item.alerteVidange) {
      return "!border-l-red-500";
    }
    if (item.alerteBudget) return "!border-l-amber-500";
    const pct = getBudgetPercent(item.budgetConsomme || 0, item.dotationAnnuelle || 0);
    if (pct >= 100) return "!border-l-red-500";
    if (pct >= 80) return "!border-l-amber-500";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Budget Global Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Budget Global */}
        <div className="p-4 rounded-2xl border-l-4 border-fleet-blue bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-fleet-blue/5 dark:bg-fleet-blue/10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Budget Global</p>
            {editingBudgetGlobal ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={budgetGlobalInput}
                  onChange={(e) => setBudgetGlobalInput(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20"
                  placeholder="Montant..."
                  autoFocus
                />
                <button onClick={handleSaveBudgetGlobal} className="h-8 px-3 bg-fleet-blue text-white text-xs font-bold rounded-lg hover:bg-fleet-blue-dark transition-colors">OK</button>
                <button onClick={() => setEditingBudgetGlobal(false)} className="h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">✕</button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-black leading-none text-fleet-blue tracking-tight">{formatMontantAbrege(budgetGlobal)}</p>
                <button
                  onClick={() => { setBudgetGlobalInput(String(budgetGlobal)); setEditingBudgetGlobal(true); }}
                  className="p-1.5 rounded-lg bg-fleet-blue/10 text-fleet-blue hover:bg-fleet-blue hover:text-white transition-all group/btn flex items-center gap-1"
                  title="Approvisionner le budget global"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m8-8H4" />
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-tight">Ajouter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Total Alloué */}
        <div className="p-4 rounded-2xl border-l-4 border-indigo-500 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-950/20 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Total Alloué</p>
            <p className="text-2xl font-black leading-none text-indigo-600 tracking-tight mt-1">{formatMontantAbrege(budgetStats.totalAlloue)}</p>
            {budgetGlobal > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                {Math.round((budgetStats.totalAlloue / budgetGlobal) * 100)}% du global
              </p>
            )}
          </div>
        </div>

        {/* Budget Restant */}
        <div className="p-4 rounded-2xl border-l-4 border-emerald-500 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-50/50 dark:bg-emerald-950/20 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Budget Restant</p>
            <p className={`text-2xl font-black leading-none tracking-tight mt-1 ${budgetStats.budgetRestant < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatMontantAbrege(budgetStats.budgetRestant)}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
              Disponible pour affectation
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <TableCard>
        {/* Search + Add Button + Filter Pills */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4">
          <div className="flex-1 flex flex-wrap items-center gap-4">
            <div className="w-full md:w-64">
              <Input
                placeholder="Rechercher un camion..."
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: "tous", label: "Tous" },
                { value: "en_service", label: "En service" },
                { value: "en_panne", label: "En panne" },
                { value: "en_attente", label: "En attente" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterStatut(btn.value)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex-shrink-0 ${
                    filterStatut === btn.value
                      ? "bg-fleet-blue text-white shadow-lg shadow-fleet-blue/20"
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleOpenAddModal} className="h-10 px-6 flex items-center gap-2 shadow-xl shadow-fleet-blue/20 transition-all font-black text-xs uppercase tracking-widest shrink-0 rounded-xl">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Véhicule
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-4 px-6 py-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedCamions}
              onRowClick={(item) => (window.location.href = `/camions/${item.id}`)}
              rowClassName={getRowClassName}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={camions.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </TableCard>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCamion ? "Modifier le camion" : "Ajouter un camion"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne de Gauche */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-fleet-blue flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fleet-blue"></span> Identité du véhicule
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Immatriculation *" placeholder="Ex: 11 LL 1234" value={immatriculation} onChange={(e) => setImmatriculation(e.target.value.toUpperCase())} required />
                  <Input label="Marque *" placeholder="Ex: Toyota" value={marque} onChange={(e) => setMarque(e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Modèle" placeholder="Ex: Hilux" value={modele} onChange={(e) => setModele(e.target.value)} />
                  <Input label="Année" type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} />
                  <Input label="Couleur" value={couleur} onChange={(e) => setCouleur(e.target.value)} />
                </div>
                <Input label="N° Châssis (VIN)" placeholder="VIN..." value={numeroChassis} onChange={(e) => setNumeroChassis(e.target.value)} />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Documents & Conformité
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mise en service *" type="date" value={dateMiseService} onChange={(e) => setDateMiseService(e.target.value)} required />
                  <Input label="Visite Technique" type="date" value={prochaineVisite} onChange={(e) => setProchaineVisite(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Échéance Assurance" type="date" value={echeanceAssurance} onChange={(e) => setEcheanceAssurance(e.target.value)} />
                  <Input label="Compagnie Assurance" value={compagnieAssurance} onChange={(e) => setCompagnieAssurance(e.target.value)} />
                </div>
                <Input label="N° Police d'assurance" value={numeroPoliceAssurance} onChange={(e) => setNumeroPoliceAssurance(e.target.value)} />
              </div>
            </div>

            {/* Colonne de Droite */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> État & Technique
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Statut *" value={statut} onChange={(value) => setStatut(value)} options={[
                    { value: "en_service", label: "En service" }, { value: "en_panne", label: "En panne" }, { value: "en_attente", label: "En attente" }, { value: "hors_service", label: "Hors service" }
                  ]} />
                  <Select label="Chauffeur" value={chauffeurId} onChange={(value) => setChauffeurId(value)} options={getChauffeursOptions()} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Kilométrage actuel" type="number" value={kilometrageActuel} onChange={(e) => setKilometrageActuel(e.target.value)} disabled={!!editingCamion} />
                  <Input label="Capacité (tonnes) *" type="number" step="0.1" value={capaciteTonnes} onChange={(e) => setCapaciteTonnes(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Carburant *" value={carburant} onChange={(value) => setCarburant(value)} options={[
                    { value: "Essence", label: "Essence" }, { value: "Diesel", label: "Diesel" }, { value: "Électrique", label: "Électrique" }, { value: "Hybride", label: "Hybride" }
                  ]} />
                  <Select label="Transmission" value={transmission} onChange={(value) => setTransmission(value)} options={[
                    { value: "Manuelle", label: "Manuelle" }, { value: "Automatique", label: "Automatique" }
                  ]} />
                </div>
                <Input label="Réservoir (L)" type="number" value={capaciteReservoir} onChange={(e) => setCapaciteReservoir(e.target.value)} />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Allocation & Entretien
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input label="Dotation annuelle (F) *" type="number" value={dotationAnnuelle} onChange={(e) => setDotationAnnuelle(e.target.value)} required />
                    <p className={`text-[10px] font-bold px-1 ${budgetStats.budgetRestant < 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      Budget dispo : {formatMontant(budgetStats.budgetRestant)}
                    </p>
                  </div>
                  <Input label="Fréquence vidange (km)" type="number" value={frequenceVidange} onChange={(e) => setFrequenceVidange(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <Textarea label="Notes particulières" placeholder="Observations diverses..." value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>{editingCamion ? "Sauvegarder" : "Enregistrer le véhicule"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteCamion}
        loading={deleteLoading}
        title="Supprimer ce véhicule ?"
        message="Cette action supprimera définitivement le camion et toutes ses données associées (tickets carburant, réparations, voyages). Cette opération est irréversible."
        confirmLabel="Supprimer"
      />

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
