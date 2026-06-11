"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, Textarea } from "@/components/ui";

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If provided, we're editing
  camions: any[];
  cartesCarburant: any[];
}

export default function MaintenanceFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  camions,
  cartesCarburant,
}: MaintenanceFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    camionId: "",
    reference: "",
    type: "mecanique",
    statut: "planifiee",
    garage: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    dateFin: "",
    kilometrage: "",
    mainOeuvreCout: "",
    mainOeuvreSource: "budget_vehicule",
    carteCarburantId: "",
  });

  const [pieces, setPieces] = useState<any[]>([
    { nom: "", quantite: 1, prixUnitaire: 0, sourcePaiement: "budget_vehicule" },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          camionId: String(initialData.camionId),
          reference: initialData.reference || "",
          type: initialData.type || "mecanique",
          statut: initialData.statut || "planifiee",
          garage: initialData.garage || "",
          description: initialData.description || "",
          date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          dateFin: initialData.dateFin ? new Date(initialData.dateFin).toISOString().split("T")[0] : "",
          kilometrage: initialData.kilometrage ? String(initialData.kilometrage) : "",
          mainOeuvreCout: initialData.mainOeuvreCout ? String(initialData.mainOeuvreCout) : "",
          mainOeuvreSource: initialData.mainOeuvreSource || "budget_vehicule",
          carteCarburantId: initialData.carteCarburantId ? String(initialData.carteCarburantId) : "",
        });

        if (initialData.piecesChangees && initialData.piecesChangees.length > 0) {
          setPieces(
            initialData.piecesChangees.map((p: any) => ({
              ...p,
              quantite: p.quantite || 1,
              prixUnitaire: p.prixUnitaire || 0,
              sourcePaiement: p.sourcePaiement || "budget_vehicule",
            }))
          );
        } else {
          setPieces([{ nom: "", quantite: 1, prixUnitaire: 0, sourcePaiement: "budget_vehicule" }]);
        }
      } else {
        setFormData({
          camionId: "",
          reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          type: "mecanique",
          statut: "planifiee",
          garage: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          dateFin: "",
          kilometrage: "",
          mainOeuvreCout: "",
          mainOeuvreSource: "budget_vehicule",
          carteCarburantId: "",
        });
        setPieces([{ nom: "", quantite: 1, prixUnitaire: 0, sourcePaiement: "budget_vehicule" }]);
      }
      setError("");
    }
  }, [isOpen, initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "camionId" && value) {
      fetch(`/api/camions/${value}`)
        .then((r) => r.json())
        .then((camion) => {
          if (camion?.kilometrageActuel) {
            setFormData((prev) => ({ ...prev, kilometrage: String(camion.kilometrageActuel) }));
          }
        })
        .catch(() => {});
    }
  };

  const handlePieceChange = (index: number, field: string, value: string) => {
    const newPieces = [...pieces];
    newPieces[index][field] = value;
    setPieces(newPieces);
  };

  const handleAddPiece = () => {
    setPieces([
      ...pieces,
      { nom: "", quantite: 1, prixUnitaire: 0, sourcePaiement: "budget_vehicule" },
    ]);
  };

  const handleRemovePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Calcul du coût total
    const totalPieces = pieces.reduce(
      (sum, p) => sum + parseInt(p.quantite || 0) * parseFloat(p.prixUnitaire || 0),
      0
    );
    const mainOeuvreCout = parseFloat(formData.mainOeuvreCout || "0");
    const coutTotal = totalPieces + mainOeuvreCout;

    const payload = {
      ...formData,
      cout: coutTotal,
      piecesChangees: pieces.filter((p) => p.nom.trim() !== ""),
    };

    const url = initialData ? `/api/reparations/${initialData.id}` : "/api/reparations";
    const method = initialData ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    { value: "budget_vehicule", label: "Budget Véhicule" },
    { value: "carte_carburant", label: "Carte Carburant" },
    { value: "especes", label: "Espèces" },
  ];

  const typeOptions = [
    { value: "mecanique", label: "Mécanique" },
    { value: "pneus", label: "Pneus" },
    { value: "vidange", label: "Vidange" },
    { value: "carrosserie", label: "Carrosserie" },
    { value: "electricite", label: "Électricité" },
    { value: "autre", label: "Autre" },
  ];

  const statusOptions = [
    { value: "planifiee", label: "Planifiée" },
    { value: "en_cours", label: "En Cours" },
    { value: "terminee", label: "Terminée" },
    { value: "annulee", label: "Annulée" },
  ];

  const showCarteCarburantGlobal = formData.mainOeuvreSource === "carte_carburant" || pieces.some(p => p.sourcePaiement === "carte_carburant");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Modifier l'intervention" : "Nouvelle intervention"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne de Gauche */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Informations Principales</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Camion *"
                  placeholder="Sélectionner un véhicule"
                  value={formData.camionId}
                  onChange={(value) => handleChange("camionId", value)}
                  options={camions.map((c) => ({
                    value: String(c.id),
                    label: c.immatriculation,
                  }))}
                  required
                />
                <Input
                  label="Référence"
                  value={formData.reference}
                  onChange={(e) => handleChange("reference", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type d'intervention *"
                  value={formData.type}
                  onChange={(value) => handleChange("type", value)}
                  options={typeOptions}
                  required
                />
                <Select
                  label="Statut *"
                  value={formData.statut}
                  onChange={(value) => handleChange("statut", value)}
                  options={statusOptions}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Planning & Véhicule</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date de début *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => handleChange("dateFin", e.target.value)}
                />
              </div>
              <Input
                label="Kilométrage du véhicule *"
                type="number"
                value={formData.kilometrage}
                onChange={(e) => handleChange("kilometrage", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Colonne de Droite */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prestataire & Notes</h3>
              <Input
                label="Garage / Prestataire *"
                value={formData.garage}
                onChange={(e) => handleChange("garage", e.target.value)}
                required
              />
              <Textarea
                label="Description / Détails de l'intervention *"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Main d'Œuvre</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Coût (F)"
                  type="number"
                  value={formData.mainOeuvreCout}
                  onChange={(e) => handleChange("mainOeuvreCout", e.target.value)}
                />
                <Select
                  label="Source Paiement"
                  value={formData.mainOeuvreSource}
                  onChange={(value) => handleChange("mainOeuvreSource", value)}
                  options={paymentOptions}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pièces Changées / Fournitures</h3>
            <button
              type="button"
              className="text-xs text-fleet-blue font-bold hover:underline"
              onClick={handleAddPiece}
            >
              + Ajouter une pièce
            </button>
          </div>

          {pieces.map((piece, index) => (
            <div key={index} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  label="Nom de la pièce"
                  value={piece.nom}
                  onChange={(e) => handlePieceChange(index, "nom", e.target.value)}
                  placeholder="Ex: Filtre à huile"
                />
              </div>
              <div className="w-24">
                <Input
                  label="Qté"
                  type="number"
                  value={piece.quantite}
                  onChange={(e) => handlePieceChange(index, "quantite", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  label="Prix Unitaire"
                  type="number"
                  value={piece.prixUnitaire}
                  onChange={(e) => handlePieceChange(index, "prixUnitaire", e.target.value)}
                />
              </div>
              <div className="w-48">
                <Select
                  label="Source Paiement"
                  value={piece.sourcePaiement}
                  onChange={(value) => handlePieceChange(index, "sourcePaiement", value)}
                  options={paymentOptions}
                />
              </div>
              {pieces.length > 1 && (
                <button
                  type="button"
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5"
                  onClick={() => handleRemovePiece(index)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {showCarteCarburantGlobal && (
          <div className="p-4 bg-fleet-blue/5 border border-fleet-blue/20 rounded-2xl shadow-sm">
            <Select
              label="Sélectionner la Carte Carburant utilisée *"
              value={formData.carteCarburantId}
              onChange={(value) => handleChange("carteCarburantId", value)}
              options={cartesCarburant.map((c) => ({
                value: String(c.id),
                label: `${c.numeroCarte} (Solde: ${c.solde} F)`,
              }))}
            />
            <p className="text-xs text-fleet-blue mt-1">
              Obligatoire car au moins un élément (Main d'œuvre ou Pièce) utilise la carte carburant comme moyen de paiement.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {initialData ? "Mettre à jour" : "Enregistrer l'intervention"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
