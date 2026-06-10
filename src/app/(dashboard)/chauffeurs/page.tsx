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
  ConfirmModal,
} from "@/components/ui";

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<any>(null);

  // Form fields
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroPermis, setNumeroPermis] = useState("");
  const [statut, setStatut] = useState("actif");
  const [camionId, setCamionId] = useState("aucun");

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchChauffeurs = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/chauffeurs?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setChauffeurs(data);
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

  useEffect(() => {
    fetchChauffeurs();
  }, [search, filterStatut]);

  useEffect(() => {
    fetchCamions();
  }, []);

  const handleOpenAddModal = () => {
    setEditingChauffeur(null);
    setNom("");
    setPrenom("");
    setTelephone("");
    setNumeroPermis("");
    setStatut("actif");
    setCamionId("aucun");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chauffeur: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChauffeur(chauffeur);
    setNom(chauffeur.nom);
    setPrenom(chauffeur.prenom || "");
    setTelephone(chauffeur.telephone || "");
    setNumeroPermis(chauffeur.numeroPermis || "");
    setStatut(chauffeur.statut);
    setCamionId(chauffeur.camion?.id ? String(chauffeur.camion.id) : "aucun");
    setIsModalOpen(true);
  };

  const handleDeleteChauffeur = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDeleteChauffeur = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/chauffeurs/${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Chauffeur supprimé avec succès");
          setToastType("success");
          setShowToast(true);
          fetchChauffeurs();
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
      nom,
      prenom,
      telephone,
      numeroPermis,
      statut,
      camionId: camionId === "aucun" ? null : parseInt(camionId),
    };

    const url = editingChauffeur ? `/api/chauffeurs/${editingChauffeur.id}` : "/api/chauffeurs";
    const method = editingChauffeur ? "PUT" : "POST";

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
          setToastMessage(editingChauffeur ? "Chauffeur modifié avec succès" : "Chauffeur ajouté avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchChauffeurs();
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

  // Filtrer les camions disponibles dans le formulaire
  const getCamionsOptions = () => {
    const opts = [{ value: "aucun", label: "Aucun camion assigné" }];
    
    camions.forEach((c) => {
      // Un camion est disponible s'il n'a pas de chauffeur ou s'il est déjà assigné au chauffeur en cours d'édition
      const isAvailable = !c.chauffeurId || (editingChauffeur && c.chauffeurId === editingChauffeur.id);
      if (isAvailable) {
        opts.push({
          value: String(c.id),
          label: `${c.immatriculation} (${c.marque} ${c.modele || ""})`,
        });
      }
    });

    return opts;
  };

  const columns = [
    {
      key: "nomComplet",
      header: "Nom complet",
      render: (item: any) => (
        <span className="font-bold text-slate-800 text-sm">{item.prenom || ""} {item.nom}</span>
      ),
    },
    {
      key: "telephone",
      header: "Téléphone",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-600">{item.telephone || "-"}</span>
      ),
    },
    {
      key: "numeroPermis",
      header: "N° Permis",
      render: (item: any) => (
        <span className="text-xs font-bold text-slate-500 tracking-wide">{item.numeroPermis || "-"}</span>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => (
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
          item.statut === "actif" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-gray-50 text-gray-700 border-gray-200"
        }`}>
          {item.statut === "actif" ? "Actif" : "Inactif"}
        </span>
      ),
    },
    {
      key: "camion",
      header: "Véhicule Assigné",
      render: (item: any) => item.camion ? (
        <span className="font-black text-fleet-blue bg-fleet-blue/10 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-fleet-blue/20">
          {item.camion.immatriculation}
        </span>
      ) : (
        <span className="text-slate-400 italic text-[10px] font-bold uppercase">Non assigné</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => handleOpenEditModal(item, e)}
            className="p-2 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
            title="Modifier le chauffeur"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteChauffeur(item.id, e)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion des chauffeurs</h1>
          <p className="text-sm text-gray-400">Gérez le personnel de conduite et leurs affectations de camions</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un chauffeur
        </Button>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou prénom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: "tous", label: "Tous" },
            { value: "actif", label: "Actifs" },
            { value: "inactif", label: "Inactifs" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatut(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                filterStatut === btn.value
                  ? "bg-fleet-blue text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Chauffeurs */}
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
            data={chauffeurs}
          />
        )}
      </div>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChauffeur ? "Modifier le chauffeur" : "Ajouter un chauffeur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              placeholder="Ex: Moussa"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Input
              label="Nom *"
              placeholder="Ex: Diallo"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              placeholder="Ex: +221 77 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
            <Input
              label="N° Permis de Conduire"
              placeholder="Ex: DK-2026-987"
              value={numeroPermis}
              onChange={(e) => setNumeroPermis(e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Statut actuel *"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              options={[
                { value: "actif", label: "Actif" },
                { value: "inactif", label: "Inactif" },
              ]}
            />
            <Select
              label="Camion assigné *"
              value={camionId}
              onChange={(e) => setCamionId(e.target.value)}
              options={getCamionsOptions()}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingChauffeur ? "Sauvegarder" : "Créer le chauffeur"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteChauffeur}
        loading={deleteLoading}
        title="Supprimer ce chauffeur ?"
        message="Le chauffeur sera définitivement supprimé. S'il est assigné à un véhicule, l'assignation sera retirée."
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
