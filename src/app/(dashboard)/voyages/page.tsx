"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  Toast,
  Skeleton,
  ConfirmModal,
  TableCard,
  Pagination,
} from "@/components/ui";
import { formatDate, formatMontant, formatMontantAbrege } from "@/lib/utils";

export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCamion, setFilterCamion] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddFuelModalOpen, setIsAddFuelModalOpen] = useState(false);
  const [selectedVoyage, setSelectedVoyage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Fuel fields
  const [fuelMontant, setFuelFuelMontant] = useState("");
  const [fuelStation, setFuelStation] = useState("");
  const [fuelCommentaire, setFuelCommentaire] = useState("");
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().slice(0, 16));
  
  // Multiple receipts management
  const [receiptFiles, setReceiptFiles] = useState<
    { file: File; preview: string; name: string; url?: string; mimeType?: string; size?: number }[]
  >([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Start Voyage fields
  const [camionId, setCamionId] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [kilometrageDepart, setKilometrageDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [observations, setObservations] = useState("");
  const [montantPrevisionCarburant, setMontantPrevisionCarburant] = useState("");

  // End Voyage fields
  const [dateFin, setDateFin] = useState("");
  const [kilometrageArrivee, setKilometrageArrivee] = useState("");
  const [observationsFin, setObservationsFin] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    return () => {
      receiptFiles.forEach(r => {
        if (r.preview.startsWith("blob:")) {
          URL.revokeObjectURL(r.preview);
        }
      });
    };
  }, [receiptFiles]);

  const uploadReceiptFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/receipts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Échec du téléversement");
      }

      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const uploadAllReceipts = async () => {
    setUploadingReceipt(true);
    const updatedFiles = [...receiptFiles];
    const results: { url: string; fileName?: string; mimeType?: string; size?: number }[] = [];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (!updatedFiles[i].url) {
        const res = await uploadReceiptFile(updatedFiles[i].file);
        if (res) {
          updatedFiles[i].url = res.url;
          updatedFiles[i].mimeType = res.mimeType;
          updatedFiles[i].size = res.size;
          results.push({
            url: res.url,
            fileName: res.fileName,
            mimeType: res.mimeType,
            size: res.size,
          });
        }
      } else {
        results.push({
          url: updatedFiles[i].url!,
          fileName: updatedFiles[i].name,
          mimeType: updatedFiles[i].mimeType || updatedFiles[i].file.type,
          size: updatedFiles[i].size || updatedFiles[i].file.size,
        });
      }
    }
    setReceiptFiles(updatedFiles);
    setUploadingReceipt(false);
    return results;
  };

  const fetchVoyages = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (filterCamion && filterCamion !== "tous") query.append("camionId", filterCamion);
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/voyages?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setVoyages(Array.isArray(data) ? data : []);
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
      .then((data) => setCamions(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  const fetchChauffeurs = () => {
    fetch("/api/chauffeurs")
      .then((res) => res.json())
      .then((data) => setChauffeurs(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchVoyages();
  }, [search, filterCamion, filterStatut]);

  useEffect(() => {
    fetchCamions();
    fetchChauffeurs();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const actifs = voyages.filter(v => v.statut === "EN_COURS").length;
    const totalKm = voyages.reduce((sum, v) => sum + (v.kilometrageArrivee ? v.kilometrageArrivee - v.kilometrageDepart : 0), 0);
    const totalCarb = voyages.reduce((sum, v) => sum + (v.carburant?.totalDepenses || 0), 0);
    return { actifs, totalKm, totalCarb };
  }, [voyages]);

  // Pagination logic
  const paginatedVoyages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return voyages.slice(start, start + pageSize);
  }, [voyages, currentPage, pageSize]);

  const totalPages = Math.ceil(voyages.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCamion, filterStatut, pageSize]);

  // Autofill driver and current mileage when a truck is selected
  useEffect(() => {
    if (camionId) {
      const selectedCamion = camions.find(c => String(c.id) === camionId);
      if (selectedCamion) {
        setKilometrageDepart(String(selectedCamion.kilometrageActuel || 0));
        if (selectedCamion.chauffeurId) {
          setChauffeurId(String(selectedCamion.chauffeurId));
        } else {
          setChauffeurId("");
        }
      }
    } else {
      setKilometrageDepart("");
      setChauffeurId("");
    }
  }, [camionId, camions]);

  const handleOpenAddModal = () => {
    setCamionId("");
    setChauffeurId("");
    setDateDebut(new Date().toISOString().slice(0, 16)); // Format YYYY-MM-DDTHH:MM
    setKilometrageDepart("");
    setDestination("");
    setObservations("");
    setMontantPrevisionCarburant("");
    setIsAddModalOpen(true);
  };

  const handleOpenEndModal = (voyage: any) => {
    setSelectedVoyage(voyage);
    setDateFin(new Date().toISOString().slice(0, 16));
    setKilometrageArrivee("");
    setObservationsFin(voyage.observations || "");
    // Reset fuel fields for closure
    setFuelFuelMontant("");
    setFuelStation("");
    setReceiptFiles([]);
    setIsEndModalOpen(true);
  };

  const handleOpenDetailModal = (voyage: any) => {
    setSelectedVoyage(voyage);
    setIsDetailModalOpen(true);
  };

  const handleOpenAddFuelModal = () => {
    setFuelFuelMontant("");
    setFuelStation("");
    setFuelCommentaire("");
    setFuelDate(new Date().toISOString().slice(0, 16));
    setReceiptFiles([]);
    setIsAddFuelModalOpen(true);
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoyage) return;
    setIsSubmitting(true);

    const uploadedUrls = await uploadAllReceipts();

    const payload = {
      typeOperation: "DEPENSE", // Standard for fuel tickets
      montant: parseFloat(fuelMontant),
      stationService: fuelStation,
      commentaire: fuelCommentaire,
      dateOperation: new Date(fuelDate).toISOString(),
      recuUrl: uploadedUrls.length > 0 ? uploadedUrls[0].url : null,
      recuUrls: uploadedUrls.map((receipt) => receipt.url),
      receipts: uploadedUrls,
    };

    fetch(`/api/carburant/${selectedVoyage.carburant.id}/mouvements`, {
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
          setToastMessage("Ticket carburant ajouté !");
          setToastType("success");
          setShowToast(true);
          setIsAddFuelModalOpen(false);
          // Refresh details and list
          fetchVoyages();
          // Update selected voyage to show new movement in modal
          fetch(`/api/voyages/${selectedVoyage.id}`)
            .then(res => res.json())
            .then(data => setSelectedVoyage(data));
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage("Erreur lors de l'ajout du ticket");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        file,
        name: file.name,
        preview: URL.createObjectURL(file)
      }));
      setReceiptFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeReceiptFile = (index: number) => {
    setReceiptFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview.startsWith("blob:")) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleStartVoyage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      camionId: parseInt(camionId),
      chauffeurId: chauffeurId ? parseInt(chauffeurId) : null,
      dateDebut: dateDebut ? new Date(dateDebut).toISOString() : new Date().toISOString(),
      kilometrageDepart: parseInt(kilometrageDepart),
      destination,
      observations,
      montantPrevisionCarburant: montantPrevisionCarburant ? parseFloat(montantPrevisionCarburant) : 0,
    };

    fetch("/api/voyages", {
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
          setToastMessage("Voyage démarré avec succès !");
          setToastType("success");
          setShowToast(true);
          setIsAddModalOpen(false);
          fetchVoyages();
          fetchCamions(); // Refresh truck mileage just in case
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage("Erreur lors du démarrage du voyage");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
  };

  const handleEndVoyage = async (e: React.FormEvent) => {
    e.preventDefault();

    const arrivalKm = parseInt(kilometrageArrivee);
    if (arrivalKm <= selectedVoyage.kilometrageDepart) {
      setToastMessage(`Le kilométrage d'arrivée doit être strictement supérieur à celui de départ (${selectedVoyage.kilometrageDepart} km)`);
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload receipts — each creates a COMPLEMENT movement
      if (receiptFiles.length > 0) {
        const uploadedReceipts = await uploadAllReceipts();

        for (const receipt of uploadedReceipts) {
          const mvtRes = await fetch(
            `/api/carburant/${selectedVoyage.carburant.id}/mouvements`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                typeOperation: "COMPLEMENT",
                montant: 0,
                dateOperation: new Date(dateFin).toISOString(),
                commentaire: "Ticket de carburant",
                receipts: [receipt],
              }),
            }
          );
          if (!mvtRes.ok) {
            const errData = await mvtRes.json();
            throw new Error(errData.error || "Erreur lors de l'ajout du ticket");
          }
        }
      }

      // 2. Close the voyage
      const payload = {
        action: "terminer",
        kilometrageArrivee: arrivalKm,
        dateFin: new Date(dateFin).toISOString(),
        observations: observationsFin,
      };

      const response = await fetch(`/api/voyages/${selectedVoyage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la clôture du voyage");
      }

      const synthese = data.synthese;
      const msg = synthese
        ? `Voyage clôturé — ${synthese.distanceParcourue} km, coût carburant : ${formatMontant(synthese.coutCarburant)}`
        : "Voyage terminé avec succès !";
      
      setToastMessage(msg);
      setToastType("success");
      setShowToast(true);
      setIsEndModalOpen(false);
      fetchVoyages();
      fetchCamions();
    } catch (error: any) {
      setToastMessage(error.message || "Une erreur est survenue");
      setToastType("error");
      setShowToast(true);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoyage = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDeleteVoyage = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/voyages/${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Voyage supprimé avec succès");
          setToastType("success");
          setShowToast(true);
          fetchVoyages();
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

  const getStatusBadge = (statut: string) => {
    if (statut === "EN_COURS" || statut === "en_cours") {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse">
          En route
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
        Terminé
      </span>
    );
  };

  const columns = [
    {
      key: "dateDebut",
      header: "Date",
      className: "w-32",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-700">{formatDate(item.dateDebut).split(' ')[0]}</span>
      ),
    },
    {
      key: "camion",
      header: "Véhicule",
      className: "w-40",
      render: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[11px] tracking-tight w-fit">
            {item.camion?.immatriculation}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">{item.camion?.marque}</span>
        </div>
      ),
    },
    {
      key: "chauffeur",
      header: "Chauffeur",
      className: "w-48",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
            {item.chauffeur ? `${item.chauffeur.prenom?.[0] || ""}${item.chauffeur.nom?.[0] || ""}` : "?"}
          </div>
          <span className="text-sm font-bold text-slate-600 truncate">
            {item.chauffeur ? `${item.chauffeur.prenom || ""} ${item.chauffeur.nom}` : "Non assigné"}
          </span>
        </div>
      ),
    },
    {
      key: "destination",
      header: "Destination",
      render: (item: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700 truncate block max-w-[300px]">{item.destination}</span>
          <span className="text-[10px] text-slate-400 font-medium">Voyage #{item.numeroVoyage}</span>
        </div>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      className: "w-32",
      render: (item: any) => getStatusBadge(item.statut),
    },
    {
      key: "actions",
      header: "Action",
      className: "w-32 text-right",
      render: (item: any) => (
        <Button
          size="sm"
          variant={item.statut === "CLOTURE" ? "ghost" : "primary"}
          disabled={item.statut === "CLOTURE"}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEndModal(item);
          }}
          className="text-[10px] font-black uppercase tracking-widest px-3 h-8 rounded-lg"
        >
          {item.statut === "CLOTURE" ? "Clôturé" : "Clôturer"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search + Add Button + Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-4">
          <div className="w-full md:w-80">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une destination, un camion ou un chauffeur..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { value: "tous", label: "Tous" },
              { value: "EN_COURS", label: "En route" },
              { value: "CLOTURE", label: "Terminés" },
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
        <Button onClick={handleOpenAddModal} className="shadow-lg shadow-fleet-blue/20">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Voyage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border-l-4 border-amber-500 bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-50/50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Voyages en cours</p>
            <p className="text-2xl font-black leading-none text-amber-600 tracking-tight mt-1">{stats.actifs}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Missions actives sur la route</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-l-4 border-fleet-blue bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-fleet-blue/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Distance Totale</p>
            <p className="text-2xl font-black leading-none text-fleet-blue tracking-tight mt-1">{stats.totalKm.toLocaleString()} km</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Cumul des kilomètres parcourus</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-l-4 border-rose-500 bg-white shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-50/50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Budget Carburant</p>
            <p className="text-2xl font-black leading-none text-rose-600 tracking-tight mt-1">{formatMontantAbrege(stats.totalCarb)}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase tracking-tighter">Dépenses totales sur voyages</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <TableCard>

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
              data={paginatedVoyages}
              onRowClick={(item) => handleOpenDetailModal(item)}
              emptyMessage="Aucun voyage trouvé."
            />
            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={voyages.length}
              />
            </div>
          </>
        )}
      </TableCard>

      {/* Modal - Démarrer un voyage */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Démarrer un voyage"
      >
        <form onSubmit={handleStartVoyage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Camion *"
              value={camionId}
              onChange={(value) => setCamionId(value)}
              placeholder="Sélectionner le camion"
              options={camions.map((c) => ({
                value: String(c.id),
                label: `${c.immatriculation} (${c.marque} - ${c.kilometrageActuel} km)`,
              }))}
              required
            />
            <Select
              label="Chauffeur"
              value={chauffeurId}
              onChange={(value) => setChauffeurId(value)}
              placeholder="Sélectionner le chauffeur"
              options={chauffeurs.map((ch) => ({
                value: String(ch.id),
                label: `${ch.prenom || ""} ${ch.nom}`,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kilométrage de Départ *"
              type="number"
              placeholder="Odomètre actuel"
              value={kilometrageDepart}
              onChange={(e) => setKilometrageDepart(e.target.value)}
              required
            />
            <Input
              label="Date & Heure de début"
              type="datetime-local"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prévision Carburant (F CFA)"
              type="number"
              placeholder="Montant alloué"
              value={montantPrevisionCarburant}
              onChange={(e) => setMontantPrevisionCarburant(e.target.value)}
            />
            <Input
              label="Destination / Mission *"
              placeholder="Ex: Dakar - Saint-Louis"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
          <Input
            label="Observations"
            placeholder="Notes sur la marchandise, instructions particulières..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Démarrer le voyage
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Clôturer un voyage */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="Clôturer le voyage"
      >
        {selectedVoyage && (
          <form onSubmit={handleEndVoyage} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1 mb-4 text-gray-600">
              <p><strong>Numéro :</strong> {selectedVoyage.numeroVoyage}</p>
              <p><strong>Camion :</strong> {selectedVoyage.camion?.immatriculation}</p>
              <p><strong>Destination :</strong> {selectedVoyage.destination}</p>
              <p><strong>Départ le :</strong> {formatDate(selectedVoyage.dateDebut)}</p>
              <p><strong>Kilométrage Départ :</strong> {selectedVoyage.kilometrageDepart.toLocaleString()} km</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Kilométrage d'arrivée *"
                type="number"
                placeholder="Index odomètre à la fin"
                value={kilometrageArrivee}
                onChange={(e) => setKilometrageArrivee(e.target.value)}
                required
              />
              <Input
                label="Date & Heure de Fin *"
                type="datetime-local"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
            
            <Input
              label="Observations de fin de voyage"
              placeholder="Problèmes rencontrés, notes, etc."
              value={observationsFin}
              onChange={(e) => setObservationsFin(e.target.value)}
            />

            {/* Ticket upload at closure */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Tickets carburant</h4>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full italic">Optionnel</span>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reçus (Photos/PDFs)</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="end-fuel-receipt-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="end-fuel-receipt-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-fleet-blue hover:bg-fleet-blue/5 transition-all cursor-pointer bg-white"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-[10px] font-bold text-slate-500">Cliquer pour joindre les reçus finaux</span>
                    </div>
                  </label>
                </div>
                {receiptFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {receiptFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg border border-slate-100 overflow-hidden bg-white h-16">
                        {file.file.type.startsWith("image/") ? (
                          <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeReceiptFile(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const kmArr = parseInt(kilometrageArrivee);
              const coutCarb = selectedVoyage.carburant?.totalDepenses || 0;
              const dist = !isNaN(kmArr) && kmArr > selectedVoyage.kilometrageDepart
                ? kmArr - selectedVoyage.kilometrageDepart
                : null;
              
              // Fallback for litres estimation just for UI display
              const estimLitres = coutCarb / 750;
              const conso = dist && estimLitres > 0
                ? ((estimLitres / dist) * 100).toFixed(1)
                : null;

              return (
                <div className="p-4 rounded-xl border border-fleet-blue/20 bg-fleet-blue/5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-fleet-blue">Synthèse carburant du voyage</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Mouvements</p>
                      <p className="font-black text-slate-800">{selectedVoyage.carburant?.mouvements?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Coût carburant</p>
                      <p className="font-black text-rose-600">{formatMontant(coutCarb)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Distance</p>
                      <p className="font-black text-slate-800">
                        {dist !== null ? `${dist} km` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Conso (estimée)</p>
                      <p className="font-black text-slate-800">
                        {conso ? `${conso} L/100` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setIsEndModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Clôturer le voyage
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal - Détails du voyage */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Fiche de Voyage"
        size="xl"
        noScroll
      >
        {selectedVoyage && (
          <div className="space-y-5 h-full flex flex-col">
            {/* Header Section with key stats */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-fleet-blue text-white flex items-center justify-center shadow-lg shadow-fleet-blue/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">Voyage #{selectedVoyage.numeroVoyage}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedVoyage.destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right border-r border-slate-200 pr-6 hidden sm:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Distance</p>
                  <p className="text-sm font-black text-fleet-blue">
                    {selectedVoyage.kilometrageArrivee 
                      ? `${(selectedVoyage.kilometrageArrivee - selectedVoyage.kilometrageDepart).toLocaleString()} km` 
                      : "En cours..."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {getStatusBadge(selectedVoyage.statut)}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(selectedVoyage.dateDebut)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* Left Side: Infos & Finances (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-1">
                {/* Actors & Trajet Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Acteurs */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-fleet-blue/5 text-fleet-blue flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Véhicule</p>
                        <p className="text-sm font-black text-fleet-blue">{selectedVoyage.camion?.immatriculation}</p>
                        <p className="text-[10px] font-bold text-slate-500">{selectedVoyage.camion?.marque} {selectedVoyage.camion?.modele}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chauffeur</p>
                        <p className="text-sm font-black text-slate-800">{selectedVoyage.chauffeur ? `${selectedVoyage.chauffeur.prenom} ${selectedVoyage.chauffeur.nom}` : "Non assigné"}</p>
                        <p className="text-[10px] font-bold text-slate-500">{selectedVoyage.chauffeur?.telephone || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trajet */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Suivi Odomètre
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Index Départ</p>
                        <p className="text-xs font-black text-slate-700">{selectedVoyage.kilometrageDepart?.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Index Arrivée</p>
                        <p className="text-xs font-black text-slate-700">{selectedVoyage.kilometrageArrivee?.toLocaleString() || "—"} km</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Dates Trajet</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-slate-700">{formatDate(selectedVoyage.dateDebut).split(' ')[0]}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-xs font-black text-slate-700">{selectedVoyage.dateFin ? formatDate(selectedVoyage.dateFin).split(' ')[0] : "..."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carburant Section */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-fleet-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Analyse Financière Carburant
                    </h4>
                    <span className="text-[10px] font-black text-fleet-blue bg-fleet-blue/5 px-2 py-0.5 rounded-lg border border-fleet-blue/10 uppercase">Dossier #{selectedVoyage.carburant?.id}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Dépenses Réelles du Voyage</p>
                      <p className="text-lg font-black text-rose-500">{formatMontant(selectedVoyage.carburant?.totalDepenses || 0)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Budget Véhicule Restant</p>
                      <p className="text-lg font-black text-emerald-600">
                        {formatMontant(selectedVoyage.camion?.budgetRestant || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-400 tracking-widest">Dépenses cumulées</span>
                      <span className="text-rose-500">
                        {formatMontant(selectedVoyage.carburant?.totalDepenses || 0)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full transition-all duration-700 ease-out bg-rose-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium italic mt-1">
                      Note: Chaque ticket ajouté s'accumule et se déduit du budget annuel du véhicule.
                    </p>
                  </div>

                  {selectedVoyage.statut === "CLOTURE" && selectedVoyage.consoMoyenne && (
                    <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-fleet-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficience Énergétique</p>
                          <p className="text-xs font-bold text-slate-200 italic">Consommation calculée pour ce trajet</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-fleet-blue">{selectedVoyage.consoMoyenne} <span className="text-xs text-slate-400">L/100</span></p>
                    </div>
                  )}
                </div>

                {selectedVoyage.observations && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <svg className="w-12 h-12 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L21.017 3V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3 21L3 18C3 16.8954 3.89543 16 5 16H8C8.55228 16 9 15.5523 9 15V9C9 8.44772 8.55228 8 8 8H5C3.89543 8 3 7.10457 3 6V3L10 3V15C10 18.3137 7.31371 21 4 21H3Z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-amber-700 uppercase mb-2 flex items-center gap-1.5 relative z-10">Observations de voyage</p>
                    <p className="text-sm text-amber-900 leading-relaxed font-medium relative z-10 italic">"{selectedVoyage.observations}"</p>
                  </div>
                )}
              </div>

              {/* Right Side: History (4 cols) */}
              <div className="lg:col-span-4 flex flex-col min-h-0 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mouvements Carburant</h4>
                  {(selectedVoyage.statut === "EN_COURS" || selectedVoyage.statut === "en_cours") && (
                    <button
                      onClick={handleOpenAddFuelModal}
                      className="bg-fleet-blue text-white p-1 rounded-md hover:bg-fleet-blue-dark transition-colors shadow-sm"
                      title="Ajouter un ticket"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {selectedVoyage.carburant?.mouvements && selectedVoyage.carburant.mouvements.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {selectedVoyage.carburant.mouvements.map((mvt: any) => (
                        <div key={mvt.id} className="p-4 hover:bg-slate-50 transition-colors group">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{formatDate(mvt.dateOperation).split(' ')[0]}</span>
                            <span className="text-xs font-black text-slate-900 group-hover:text-fleet-blue transition-colors">{formatMontant(mvt.montant)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-[11px] text-slate-600 font-bold truncate">{mvt.stationService || "Station non précisée"}</p>
                          </div>
                          {mvt.commentaire && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 italic leading-tight">"{mvt.commentaire}"</p>
                          )}
                          {mvt.recus && mvt.recus.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {mvt.recus.map((recu: any) => (
                                <a
                                  key={recu.id}
                                  href={recu.cheminImage}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-fleet-blue/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fleet-blue hover:bg-fleet-blue hover:text-white transition-colors"
                                >
                                  Ticket
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-40">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun mouvement</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-50 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dépenses totales voyage</p>
                  <p className="text-lg font-black text-rose-500 mt-0.5">{formatMontant(selectedVoyage.carburant?.totalDepenses || 0)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0">
              <div className="flex gap-3">
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={(e) => { setIsDetailModalOpen(false); setDeleteTarget(selectedVoyage.id); }}
                  className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/10"
                >
                  Supprimer le dossier
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={() => setIsDetailModalOpen(false)} className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-none">
                Fermer la fiche
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteVoyage}
        loading={deleteLoading}
        title="Supprimer ce voyage ?"
        message="Le voyage, son dossier de carburant et son historique seront définitivement supprimés."
        confirmLabel="Supprimer"
      />

      {/* Modal - Ajouter du carburant */}
      <Modal
        isOpen={isAddFuelModalOpen}
        onClose={() => setIsAddFuelModalOpen(false)}
        title="Ajouter un Ticket Carburant"
      >
        <form onSubmit={handleAddFuel} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant (F CFA) *"
              type="number"
              placeholder="Ex: 45000"
              value={fuelMontant}
              onChange={(e) => setFuelFuelMontant(e.target.value)}
              required
            />
            <Input
              label="Date & Heure *"
              type="datetime-local"
              value={fuelDate}
              onChange={(e) => setFuelDate(e.target.value)}
              required
            />
          </div>
          <Input
            label="Station Service"
            placeholder="Ex: Shell Keur Massar"
            value={fuelStation}
            onChange={(e) => setFuelStation(e.target.value)}
          />
          
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Ticket carburant</h4>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full italic">Optionnel</span>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reçus (Photos/PDFs)</label>
              <div className="relative group">
                <input
                  type="file"
                  id="fuel-receipt-upload"
                  className="hidden"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="fuel-receipt-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-fleet-blue hover:bg-fleet-blue/5 transition-all cursor-pointer bg-white"
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-500">Cliquer pour joindre le ticket</span>
                  </div>
                </label>
              </div>

              {receiptFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {receiptFiles.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg border border-slate-100 overflow-hidden bg-white h-16">
                      {file.file.type.startsWith("image/") ? (
                        <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeReceiptFile(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Input
            label="Commentaire"
            placeholder="Notes éventuelles..."
            value={fuelCommentaire}
            onChange={(e) => setFuelCommentaire(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddFuelModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={uploadingReceipt}>
              Enregistrer le ticket
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
