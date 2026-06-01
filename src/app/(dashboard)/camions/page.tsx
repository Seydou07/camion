"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  DataTable,
  Modal,
  Toast,
  Skeleton,
} from "@/components/ui";
import { formatDate, statutCamionColors, statutCamionLabels } from "@/lib/utils";

export default function CamionsPage() {
  const [camions, setCamions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

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
  const [chauffeurNom, setChauffeurNom] = useState("");
  const [dateMiseService, setDateMiseService] = useState("");
  const [prochaineVisite, setProchaineVisite] = useState("");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const fetchCamions = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/camions?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCamions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCamions();
  }, [search, filterStatut]);

  const handleOpenAddModal = () => {
    setEditingCamion(null);
    setImmatriculation("");
    setMarque("");
    setModele("");
    setCapaciteTonnes("");
    setStatut("en_service");
    setChauffeurNom("");
    setDateMiseService("");
    setProchaineVisite("");
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
    setChauffeurNom(camion.chauffeurNom || "");
    setDateMiseService(camion.dateMiseService ? new Date(camion.dateMiseService).toISOString().split("T")[0] : "");
    setProchaineVisite(camion.prochaineVisite ? new Date(camion.prochaineVisite).toISOString().split("T")[0] : "");
    setIsModalOpen(true);
  };

  const handleDeleteCamion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer ce camion et toutes ses données associées ?")) {
      fetch(`/api/camions/${id}`, { method: "DELETE" })
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
        });
    }
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
      chauffeurNom,
      dateMiseService,
      prochaineVisite: prochaineVisite || null,
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
      key: "immatriculation",
      header: "Immatriculation",
      render: (item: any) => (
        <span className="font-semibold text-gray-900">{item.immatriculation}</span>
      ),
    },
    {
      key: "modele",
      header: "Marque & Modèle",
      render: (item: any) => `${item.marque} ${item.modele || ""}`,
    },
    {
      key: "capaciteTonnes",
      header: "Capacité",
      render: (item: any) => `${item.capaciteTonnes} tonnes`,
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
      key: "chauffeurNom",
      header: "Chauffeur",
      render: (item: any) => item.chauffeurNom || "Aucun",
    },
    {
      key: "prochaineVisite",
      header: "Prochaine Visite",
      render: (item: any) => item.prochaineVisite ? formatDate(item.prochaineVisite) : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.location.href = `/camions/${item.id}`)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-500 transition-colors"
            title="Voir la fiche détaillée"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleOpenEditModal(item, e)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
            title="Modifier le camion"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteCamion(item.id, e)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Supprimer"
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
          <h1 className="text-xl font-bold text-gray-900">Gestion des camions</h1>
          <p className="text-sm text-gray-400">Gérez l'ensemble des camions de votre flotte</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un camion
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par immatriculation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: "tous", label: "Tous" },
            { value: "en_service", label: "En service" },
            { value: "en_panne", label: "En panne" },
            { value: "en_attente", label: "En attente" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatut(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                filterStatut === btn.value
                  ? "bg-sky-500 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des camions */}
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
            data={camions}
            onRowClick={(item) => (window.location.href = `/camions/${item.id}`)}
          />
        )}
      </div>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCamion ? "Modifier le camion" : "Ajouter un camion"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Immatriculation *"
            placeholder="Ex: AA-123-BB"
            value={immatriculation}
            onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marque *"
              placeholder="Ex: Volvo"
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              required
            />
            <Input
              label="Modèle"
              placeholder="Ex: FMX 420"
              value={modele}
              onChange={(e) => setModele(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacité (tonnes) *"
              type="number"
              step="0.1"
              placeholder="Ex: 20"
              value={capaciteTonnes}
              onChange={(e) => setCapaciteTonnes(e.target.value)}
              required
            />
            <Select
              label="Statut actuel *"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              options={[
                { value: "en_service", label: "En service" },
                { value: "en_panne", label: "En panne" },
                { value: "en_attente", label: "En attente" },
                { value: "hors_service", label: "Hors service" },
              ]}
            />
          </div>
          <Input
            label="Chauffeur"
            placeholder="Nom complet du chauffeur"
            value={chauffeurNom}
            onChange={(e) => setChauffeurNom(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mise en service *"
              type="date"
              value={dateMiseService}
              onChange={(e) => setDateMiseService(e.target.value)}
              required
            />
            <Input
              label="Prochaine visite"
              type="date"
              value={prochaineVisite}
              onChange={(e) => setProchaineVisite(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingCamion ? "Sauvegarder" : "Créer le camion"}
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
