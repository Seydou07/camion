"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  DataTable,
  Pagination,
  Modal,
  Toast,
  Skeleton,
  ConfirmModal,
} from "@/components/ui";
import { formatDate, formatMontant } from "@/lib/utils";

export default function CarburantPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCamion, setFilterCamion] = useState("tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Form fields
  const [camionId, setCamionId] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [date, setDate] = useState("");
  const [kilometrage, setKilometrage] = useState("");
  const [litres, setLitres] = useState("");
  const [prixLitre, setPrixLitre] = useState("750");
  const [numeroTicket, setNumeroTicket] = useState("");
  const [stationService, setStationService] = useState("");
  const [recuUrl, setRecuUrl] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [estPlein, setEstPlein] = useState(true);
  const [typeOperation, setTypeOperation] = useState("plein_depot");
  const [voyageId, setVoyageId] = useState("");
  const [activeVoyages, setActiveVoyages] = useState<any[]>([]);

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterCamion && filterCamion !== "tous") query.append("camionId", filterCamion);

    fetch(`/api/carburant?${query.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setTickets([]);
          return;
        }
        setTickets(data);
      })
      .finally(() => setLoading(false))
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

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const filteredTickets = safeTickets.filter((ticket) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return [
      ticket.camion?.immatriculation,
      ticket.chauffeur?.prenom,
      ticket.chauffeur?.nom,
      ticket.stationService,
      ticket.numeroTicket,
      ticket.typeOperation,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  useEffect(() => {
    setCurrentPage(1);
    fetchTickets();
  }, [filterCamion]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchCamions();
    fetchChauffeurs();
  }, []);

  // Autofill driver and fetch active voyages when a truck is selected in the form
  useEffect(() => {
    if (camionId) {
      const selectedCamion = camions.find(c => String(c.id) === camionId);
      if (selectedCamion && selectedCamion.chauffeurId) {
        setChauffeurId(String(selectedCamion.chauffeurId));
      } else {
        setChauffeurId("");
      }

      fetch(`/api/voyages?camionId=${camionId}&statut=en_cours`)
        .then((res) => res.json())
        .then((data) => {
          setActiveVoyages(data);
          if (data.length === 1) {
            setVoyageId(String(data[0].id));
            setTypeOperation("appoint_route");
          } else {
            setVoyageId("");
            setTypeOperation("plein_depot");
          }
        })
        .catch((err) => console.error(err));
    } else {
      setActiveVoyages([]);
      setVoyageId("");
      setTypeOperation("plein_depot");
      setChauffeurId("");
    }
  }, [camionId, camions]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  const uploadReceiptFile = async (file: File) => {
    try {
      setUploadingReceipt(true);
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

      setRecuUrl(data.url);
      setReceiptFileName(data.fileName);
      return data;
    } catch (error) {
      console.error(error);
      setToastMessage((error as Error).message || "Erreur de téléversement");
      setToastType("error");
      setShowToast(true);
      setRecuUrl("");
      return null;
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleOpenAddModal = () => {
    setCamionId("");
    setChauffeurId("");
    setDate(new Date().toISOString().split("T")[0]);
    setKilometrage("");
    setLitres("");
    setPrixLitre("750");
    setNumeroTicket("");
    setStationService("");
    setRecuUrl("");
    setReceiptFile(null);
    setReceiptPreviewUrl("");
    setReceiptFileName("");
    setUploadingReceipt(false);
    setEstPlein(true);
    setTypeOperation("plein_depot");
    setVoyageId("");
    setActiveVoyages([]);
    setIsModalOpen(true);
  };

  const handleDeleteTicket = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDeleteTicket = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/carburant?id=${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Ticket supprimé avec succès");
          setToastType("success");
          setShowToast(true);
          fetchTickets();
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

    const selectedCamion = camions.find(c => String(c.id) === camionId);
    const newKm = parseInt(kilometrage);

    if (selectedCamion && newKm <= selectedCamion.kilometrageActuel) {
      setToastMessage(`Le kilométrage doit être supérieur au kilométrage actuel du véhicule (${selectedCamion.kilometrageActuel} km)`);
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

    const payload = {
      camionId: parseInt(camionId),
      chauffeurId: chauffeurId ? parseInt(chauffeurId) : null,
      date,
      kilometrage: newKm,
      litres: parseFloat(litres),
      prixLitre: parseFloat(prixLitre),
      numeroTicket,
      stationService,
      recuUrl: recuUrl || null,
      recuName: receiptFileName || null,
      recuMimeType: receiptFile?.type || null,
      recuSize: receiptFile ? receiptFile.size : null,
      estPlein,
      typeOperation,
      voyageId: voyageId ? parseInt(voyageId) : null,
    };

    fetch("/api/carburant", {
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
          setToastMessage("Ticket carburant enregistré avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchTickets();
          fetchCamions();
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

  const columns = [
    {
      key: "date",
      header: "Date",
      className: "w-28",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-700">{formatDate(item.date)}</span>
      ),
    },
    {
      key: "camion",
      header: "Camion",
      className: "w-32",
      render: (item: any) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800 text-sm">{item.camion?.immatriculation || "-"}</div>
          <div className="text-xs text-slate-400 font-medium">{item.camion?.marque || "Véhicule"}</div>
        </div>
      ),
    },
    {
      key: "chauffeur",
      header: "Chauffeur",
      className: "w-40",
      render: (item: any) => (
        <div className="text-sm font-semibold text-slate-600">
          {item.chauffeur ? `${item.chauffeur.prenom || ""} ${item.chauffeur.nom}` : "Non assigné"}
        </div>
      ),
    },
    {
      key: "litres",
      header: "Volume",
      className: "w-24",
      render: (item: any) => <span className="text-sm font-bold text-fleet-blue">{item.litres} L</span>,
    },
    {
      key: "coutTotal",
      header: "Montant",
      className: "w-28",
      render: (item: any) => <span className="text-sm font-black text-rose-500">{formatMontant(item.coutTotal)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right w-28",
      render: (item: any) => (
        <div className="flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedTicket(item); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-fleet-blue/10 hover:text-fleet-blue"
            title="Détails du ticket"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteTicket(item.id, e)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Supprimer ce ticket"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tickets de carburant</h1>
          <p className="text-sm text-gray-400">Enregistrez et examinez les justificatifs d'essence transmis par les chauffeurs</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Enregistrer un ticket
        </Button>
      </div>

      {/* Barre de filtrage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Input
          label="Recherche"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher camion, chauffeur, station..."
          className="md:col-span-2"
        />
        <Select
          label="Filtrer par camion"
          value={filterCamion}
          onChange={(e) => setFilterCamion(e.target.value)}
          placeholder="Tous les camions"
          options={camions.map((c) => ({ value: String(c.id), label: c.immatriculation }))}
        />
      </div>

      {/* Tableau des tickets */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedTickets}
              onRowClick={(item) => setSelectedTicket(item)}
              emptyMessage="Aucun ticket carburant enregistré."
            />
            <Pagination
              currentPage={currentPage}
              totalPages={pageCount}
              pageSize={pageSize}
              totalItems={filteredTickets.length}
              onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), pageCount))}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Modal d'ajout de ticket */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer un ticket carburant"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Camion *"
              value={camionId}
              onChange={(e) => setCamionId(e.target.value)}
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
              onChange={(e) => setChauffeurId(e.target.value)}
              placeholder="Sélectionner le chauffeur"
              options={chauffeurs.map((ch) => ({
                value: String(ch.id),
                label: `${ch.prenom || ""} ${ch.nom}`,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date du plein *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Kilométrage actuel *"
              type="number"
              placeholder="Index au compteur"
              value={kilometrage}
              onChange={(e) => setKilometrage(e.target.value)}
              required
            />
          </div>

          {camionId && (() => {
            const selected = camions.find((c) => String(c.id) === camionId);
            if (!selected?.dotationAnnuelle) return null;
            const coutEstime = (parseFloat(litres) || 0) * (parseFloat(prixLitre) || 0);
            const consomme = selected.budgetConsomme || 0;
            const restant = selected.dotationAnnuelle - consomme;
            const apres = restant - coutEstime;
            return (
              <div className={`p-3 rounded-xl border text-xs ${apres < 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="font-black uppercase text-[9px] tracking-widest text-slate-500 mb-1">Impact budget véhicule</p>
                <p>Consommé : <strong>{formatMontant(consomme)}</strong> / {formatMontant(selected.dotationAnnuelle)}</p>
                <p>Coût de ce ticket : <strong>{formatMontant(coutEstime)}</strong></p>
                <p className={apres < 0 ? "text-red-600 font-bold" : "text-emerald-700 font-semibold"}>
                  {apres < 0 ? "⚠ Budget dépassé après enregistrement" : `Reste après opération : ${formatMontant(apres)}`}
                </p>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Volume (litres) *"
              type="number"
              step="0.01"
              placeholder="Litres saisis"
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              required
            />
            <Input
              label="Prix du litre (F) *"
              type="number"
              step="0.1"
              value={prixLitre}
              onChange={(e) => setPrixLitre(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="N° Ticket / Reçu"
              placeholder="Ex: Shell-98754"
              value={numeroTicket}
              onChange={(e) => setNumeroTicket(e.target.value)}
            />
            <Input
              label="Station-Service"
              placeholder="Ex: Total Yoff"
              value={stationService}
              onChange={(e) => setStationService(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type d'Opération *"
              value={typeOperation}
              onChange={(e) => setTypeOperation(e.target.value)}
              options={[
                { value: "plein_depot", label: "Plein au Dépôt" },
                { value: "appoint_route", label: "Appoint en Route" },
                { value: "plein_retour", label: "Plein au Retour" },
              ]}
              required
            />
            {activeVoyages.length > 0 ? (
              <Select
                label="Associer au Voyage"
                value={voyageId}
                onChange={(e) => setVoyageId(e.target.value)}
                placeholder="Aucun voyage"
                options={activeVoyages.map((v) => ({
                  value: String(v.id),
                  label: `${v.destination} (${formatDate(v.dateDebut)})`,
                }))}
              />
            ) : (
              <div className="flex items-center text-[10px] text-slate-400 font-black uppercase pt-6 pl-1">
                Aucun voyage en cours
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
            <input
              id="estPlein"
              type="checkbox"
              checked={estPlein}
              onChange={(e) => setEstPlein(e.target.checked)}
              className="w-4.5 h-4.5 rounded-lg border-slate-200 text-fleet-blue focus:ring-fleet-blue/20 cursor-pointer"
            />
            <label htmlFor="estPlein" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
              Plein complet fait ? (Décochez s'il s'agit d'un appoint / ravitaillement partiel)
            </label>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo du reçu</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  setReceiptFile(file);
                  if (file) {
                    const preview = URL.createObjectURL(file);
                    setReceiptPreviewUrl(preview);
                    setRecuUrl("");
                    await uploadReceiptFile(file);
                  } else {
                    setReceiptPreviewUrl("");
                    setReceiptFileName("");
                    setRecuUrl("");
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-fleet-blue focus:ring-2 focus:ring-fleet-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-2 text-[11px] text-slate-400">Formats acceptés : JPG, PNG, PDF</p>
              {receiptPreviewUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-500">
                    {receiptFile?.type.startsWith("image/") ? (
                      <img src={receiptPreviewUrl} alt="Aperçu reçu" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] font-black">PDF</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{receiptFileName || receiptFile?.name}</p>
                    <p className="text-[11px] text-slate-400">{uploadingReceipt ? "Téléversement en cours…" : "Fichier prêt pour enregistrement"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreviewUrl("");
                      setReceiptFileName("");
                      setRecuUrl("");
                    }}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={uploadingReceipt}>
              Enregistrer le ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTicket}
        loading={deleteLoading}
        title="Supprimer ce ticket ?"
        message="Le ticket carburant sera définitivement supprimé. Le budget véhicule ne sera pas recalculé automatiquement."
        confirmLabel="Supprimer"
      />

      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title="Fiche Ticket Carburant"
        size="lg"
        noScroll
      >
        {selectedTicket && (
          <div className="space-y-4 h-full flex flex-col">
            {/* Top Header Section with Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-fleet-blue text-white flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">Ticket #{selectedTicket.numeroTicket || selectedTicket.id}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(selectedTicket.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
                  selectedTicket.estPlein ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {selectedTicket.estPlein ? "Plein" : "Appoint"}
                </span>
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {(() => {
                    const types: Record<string, string> = {
                      plein_depot: "Dépôt",
                      appoint_route: "Route",
                      plein_retour: "Retour",
                    };
                    return types[selectedTicket.typeOperation] || selectedTicket.typeOperation;
                  })()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Left Column: Information */}
              <div className="space-y-3 overflow-y-auto pr-1">
                {/* Vehicule & Chauffeur */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Véhicule</p>
                    <p className="text-sm font-black text-fleet-blue truncate">{selectedTicket.camion?.immatriculation}</p>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{selectedTicket.camion?.marque}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Chauffeur</p>
                    <p className="text-sm font-black text-slate-800 truncate">{selectedTicket.chauffeur ? `${selectedTicket.chauffeur.prenom} ${selectedTicket.chauffeur.nom}` : "N/A"}</p>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{selectedTicket.chauffeur?.telephone || "N/A"}</p>
                  </div>
                </div>

                {/* Operation Details */}
                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Station</p>
                      <p className="text-xs font-black text-slate-700 truncate">{selectedTicket.stationService || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Kilométrage</p>
                      <p className="text-xs font-black text-slate-700">{selectedTicket.kilometrage?.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Volume</p>
                      <p className="text-xs font-black text-fleet-blue">{selectedTicket.litres} L</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Prix/L</p>
                      <p className="text-xs font-black text-slate-700">{formatMontant(selectedTicket.prixLitre)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                    <p className="text-base font-black text-rose-500">{formatMontant(selectedTicket.coutTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Receipt Image */}
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 p-2 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center relative overflow-hidden">
                  {selectedTicket.recuUrl ? (
                    <>
                      {selectedTicket.recuUrl.endsWith(".pdf") ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">PDF</p>
                        </div>
                      ) : (
                        <img 
                          src={selectedTicket.recuUrl} 
                          alt="Reçu" 
                          className="max-h-full max-w-full rounded-lg shadow-md object-contain" 
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <a 
                          href={selectedTicket.recuUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bg-white text-slate-900 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-fleet-blue hover:text-white transition-all"
                        >
                          Agrandir
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <svg className="w-6 h-6 text-slate-200 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pas de photo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2 shrink-0">
              <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-none">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
