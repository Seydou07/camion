"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  Toast,
  Skeleton,
  ConfirmModal,
} from "@/components/ui";
import { formatDate, formatMontant } from "@/lib/utils";

export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCamion, setFilterCamion] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [selectedVoyage, setSelectedVoyage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start Voyage fields
  const [camionId, setCamionId] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [kilometrageDepart, setKilometrageDepart] = useState("");
  const [destination, setDestination] = useState("");

  // End Voyage fields
  const [dateFin, setDateFin] = useState("");
  const [kilometrageArrivee, setKilometrageArrivee] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchVoyages = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterCamion && filterCamion !== "tous") query.append("camionId", filterCamion);
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/voyages?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setVoyages(data);
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
  }, [filterCamion, filterStatut]);

  useEffect(() => {
    fetchCamions();
    fetchChauffeurs();
  }, []);

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
    setIsAddModalOpen(true);
  };

  const handleOpenEndModal = (voyage: any) => {
    setSelectedVoyage(voyage);
    setDateFin(new Date().toISOString().slice(0, 16));
    setKilometrageArrivee(String(voyage.kilometrageDepart + 100)); // Default suggestion
    setIsEndModalOpen(true);
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

  const handleEndVoyage = (e: React.FormEvent) => {
    e.preventDefault();

    const arrivalKm = parseInt(kilometrageArrivee);
    if (arrivalKm <= selectedVoyage.kilometrageDepart) {
      setToastMessage(`Le kilométrage d'arrivée doit être strictement supérieur à celui de départ (${selectedVoyage.kilometrageDepart} km)`);
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      action: "terminer",
      kilometrageArrivee: arrivalKm,
      dateFin: new Date(dateFin).toISOString(),
    };

    fetch(`/api/voyages/${selectedVoyage.id}`, {
      method: "PUT",
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
          const synthese = data.synthese;
          const msg = synthese
            ? `Voyage clôturé — ${synthese.distanceParcourue} km, ${synthese.totalLitres} L (${synthese.consommationMoyenne ?? "-"} L/100), ${formatMontant(synthese.coutCarburant)}`
            : "Voyage terminé avec succès !";
          setToastMessage(msg);
          setToastType("success");
          setShowToast(true);
          setIsEndModalOpen(false);
          fetchVoyages();
          fetchCamions();
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage("Erreur lors de la clôture du voyage");
        setToastType("error");
        setShowToast(true);
        console.error(err);
      });
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
    if (statut === "en_cours") {
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
      header: "Date Départ",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-700">{formatDate(item.dateDebut)}</span>
      ),
    },
    {
      key: "dateFin",
      header: "Date Arrivée",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-500">
          {item.dateFin ? formatDate(item.dateFin) : "-"}
        </span>
      ),
    },
    {
      key: "camion",
      header: "Camion",
      render: (item: any) => (
        <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[11px] tracking-tight">
          {item.camion?.immatriculation}
        </span>
      ),
    },
    {
      key: "chauffeur",
      header: "Chauffeur",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-600">
          {item.chauffeur ? `${item.chauffeur.prenom || ""} ${item.chauffeur.nom}` : "-"}
        </span>
      ),
    },
    {
      key: "destination",
      header: "Destination",
      render: (item: any) => <span className="text-sm font-bold text-slate-700">{item.destination}</span>,
    },
    {
      key: "kilometres",
      header: "KMs (Dép / Arr / Dist)",
      render: (item: any) => {
        const dist = item.kilometrageArrivee ? item.kilometrageArrivee - item.kilometrageDepart : null;
        return (
          <div className="text-[11px] font-medium">
            <span className="text-slate-400">{item.kilometrageDepart.toLocaleString()}</span>
            <span className="mx-1 text-slate-300">→</span>
            <span className="text-slate-800 font-bold">
              {item.kilometrageArrivee ? `${item.kilometrageArrivee.toLocaleString()}` : "..."}
            </span>
            {dist !== null && (
              <span className="ml-1.5 text-fleet-blue font-black tracking-tight">({dist} km)</span>
            )}
          </div>
        );
      },
    },
    {
      key: "carburant",
      header: "Plein Route",
      render: (item: any) => {
        const carburants = item.carburants || [];
        const totalLitres = carburants.reduce((sum: number, c: any) => sum + c.litres, 0);
        return (
          <span className="text-sm font-black text-slate-700">
            {totalLitres > 0 ? `${totalLitres.toFixed(1)} L` : "0 L"}
          </span>
        );
      },
    },
    {
      key: "consommation",
      header: "Conso moyenne",
      render: (item: any) => {
        const carburants = item.carburants || [];
        const totalLitres = carburants.reduce((sum: number, c: any) => sum + c.litres, 0);
        const dist = item.kilometrageArrivee ? item.kilometrageArrivee - item.kilometrageDepart : 0;
        if (dist > 0 && totalLitres > 0) {
          const conso = (totalLitres / dist) * 100;
          return <span className="text-sm font-black text-fleet-blue bg-fleet-blue/5 px-2 py-1 rounded-md">{conso.toFixed(1)} L/100</span>;
        }
        return <span className="text-slate-300">-</span>;
      },
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => getStatusBadge(item.statut),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.statut === "en_cours" && (
            <button
              onClick={() => handleOpenEndModal(item)}
              className="px-2.5 py-1 rounded bg-fleet-blue text-white text-[10px] font-bold uppercase hover:bg-fleet-blue-dark transition-all cursor-pointer"
            >
              Clôturer
            </button>
          )}
          <button
            onClick={(e) => handleDeleteVoyage(item.id, e)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
            title="Supprimer ce voyage"
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
          <h1 className="text-xl font-bold text-gray-900">Suivi des Voyages</h1>
          <p className="text-sm text-gray-400">
            Démarrer, clôturer et analysez la consommation de carburant par trajet.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Démarrer un voyage
        </Button>
      </div>

      {/* Barre de filtrage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Select
          label="Filtrer par camion"
          value={filterCamion}
          onChange={(e) => setFilterCamion(e.target.value)}
          placeholder="Tous les camions"
          options={camions.map((c) => ({ value: String(c.id), label: c.immatriculation }))}
        />
        <Select
          label="Filtrer par statut"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          placeholder="Tous les statuts"
          options={[
            { value: "en_cours", label: "En route" },
            { value: "termine", label: "Terminés" },
          ]}
        />
      </div>

      {/* Tableau des voyages */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={voyages}
            emptyMessage="Aucun voyage trouvé."
          />
        )}
      </div>

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
          <Input
            label="Destination / Mission *"
            placeholder="Ex: Dakar - Saint-Louis (Livraison Marchandise)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
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

            {(() => {
              const kmArr = parseInt(kilometrageArrivee);
              const carburants = selectedVoyage.carburants || [];
              const totalLitres = carburants.reduce((s: number, c: any) => s + c.litres, 0);
              const coutCarb = carburants.reduce((s: number, c: any) => s + c.coutTotal, 0);
              const dist = !isNaN(kmArr) && kmArr > selectedVoyage.kilometrageDepart
                ? kmArr - selectedVoyage.kilometrageDepart
                : null;
              const conso = dist && totalLitres > 0
                ? ((totalLitres / dist) * 100).toFixed(1)
                : null;

              return (
                <div className="p-4 rounded-xl border border-fleet-blue/20 bg-fleet-blue/5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-fleet-blue">Synthèse carburant du voyage</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Pleins enregistrés</p>
                      <p className="font-black text-slate-800">{carburants.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Total litres</p>
                      <p className="font-black text-fleet-blue">{totalLitres.toFixed(1)} L</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Coût carburant</p>
                      <p className="font-black text-rose-600">{formatMontant(coutCarb)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Distance / Conso</p>
                      <p className="font-black text-slate-800">
                        {dist !== null ? `${dist} km` : "—"}
                        {conso ? ` · ${conso} L/100` : ""}
                      </p>
                    </div>
                  </div>
                  {carburants.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold">
                      Aucun plein lié à ce voyage. Enregistrez les tickets carburant avant de clôturer pour un suivi précis.
                    </p>
                  )}
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

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteVoyage}
        loading={deleteLoading}
        title="Supprimer ce voyage ?"
        message="Le voyage et son historique associé seront définitivement supprimés."
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
