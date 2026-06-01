"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  DataTable,
  Modal,
  Toast,
  Skeleton,
} from "@/components/ui";
import { formatMontant, formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal Ajout/Modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Form Fields
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [adresse, setAdresse] = useState("");
  const [email, setEmail] = useState("");
  const [typePrix, setTypePrix] = useState("standard");

  // Modal Historique des ventes du client
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientVentes, setClientVentes] = useState<any[]>([]);
  const [loadingVentes, setLoadingVentes] = useState(false);

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append("search", search);

    fetch(`/api/clients?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setNom("");
    setContact("");
    setAdresse("");
    setEmail("");
    setTypePrix("standard");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setNom(client.nom);
    setContact(client.contact || "");
    setAdresse(client.adresse || "");
    setEmail(client.email || "");
    setTypePrix(client.typePrix);
    setIsModalOpen(true);
  };

  const handleOpenHistory = (client: any) => {
    setSelectedClient(client);
    setLoadingVentes(true);

    fetch(`/api/ventes?clientId=${client.id}`)
      .then((res) => res.json())
      .then((data) => {
        setClientVentes(data);
        setLoadingVentes(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingVentes(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nom,
      contact,
      adresse,
      email,
      typePrix,
    };

    fetch("/api/clients", {
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
          setToastMessage("Client enregistré avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchClients();
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
      key: "nom",
      header: "Nom / Entreprise",
      render: (item: any) => <span className="font-semibold text-gray-900">{item.nom}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (item: any) => item.contact || "-",
    },
    {
      key: "adresse",
      header: "Adresse",
      render: (item: any) => item.adresse || "-",
    },
    {
      key: "email",
      header: "Email",
      render: (item: any) => item.email || "-",
    },
    {
      key: "typePrix",
      header: "Type Tarif",
      render: (item: any) => (
        <Badge variant={item.typePrix === "preferentiel" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
          {item.typePrix === "preferentiel" ? "Préférentiel" : "Standard"}
        </Badge>
      ),
    },
    {
      key: "totalAchats",
      header: "Total Achats",
      render: (item: any) => formatMontant(item.totalAchats || 0),
    },
    {
      key: "soldeDu",
      header: "Solde Dû",
      render: (item: any) => (
        <span className={item.soldeDu > 0 ? "text-yellow-600 font-semibold" : "text-green-600 font-semibold"}>
          {formatMontant(item.soldeDu || 0)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenHistory(item)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-500 transition-colors"
            title="Historique des ventes"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>
          <button
            onClick={(e) => handleOpenEditModal(item, e)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
            title="Modifier le client"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-sm text-gray-400">Suivez le portefeuille clients, leur historique de facturation et soldes restants</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un client
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="flex bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un client par son nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau des clients */}
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
            data={clients}
            onRowClick={(item) => handleOpenHistory(item)}
          />
        )}
      </div>

      {/* Modal Ajout/Modification */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un client">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom / Entreprise *"
            placeholder="Nom complet ou raison sociale"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <Input
            label="Contact (Téléphone)"
            placeholder="Ex: +221 77 000 00 00"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <Input
            label="Adresse complète"
            placeholder="Ex: Plateau, Dakar"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
          />
          <Input
            label="Adresse Email"
            type="email"
            placeholder="Ex: contact@entreprise.sn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            label="Politique tarifaire *"
            value={typePrix}
            onChange={(e) => setTypePrix(e.target.value)}
            options={[
              { value: "standard", label: "Standard (Prix de vente par défaut)" },
              { value: "preferentiel", label: "Préférentiel (10% de réduction automatique)" },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Créer le client</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Historique Ventes */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={`Historique des achats - ${selectedClient?.nom}`}
        size="lg"
      >
        <div className="space-y-4">
          {loadingVentes ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : clientVentes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facture</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Camion</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientVentes.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900">{v.numeroFacture}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{formatDate(v.date)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{v.camion?.immatriculation}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{v.produit?.nom}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{v.quantite} {v.produit?.unite}(s)</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900">{formatMontant(v.montantTotal)}</td>
                      <td className="px-4 py-2 text-sm">
                        <Badge variant={v.statutPaiement === "paye" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}>
                          {v.statutPaiement === "paye" ? "Payé" : "En attente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">
              Aucune vente enregistrée pour ce client.
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button onClick={() => setSelectedClient(null)}>Fermer</Button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
