"use client";

import { useEffect, useState, useMemo } from "react";
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
import { formatMontant, formatDate, statutPaiementColors, statutPaiementLabels } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function VentesPage() {
  const [ventes, setVentes] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterCamion, setFilterCamion] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formCamionId, setFormCamionId] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formProduitId, setFormProduitId] = useState("");
  const [formPrixUnitaire, setFormPrixUnitaire] = useState("");
  const [formStatutPaiement, setFormStatutPaiement] = useState("en_attente");
  const [formDate, setFormDate] = useState("");
  
  // Pont-Bascule (Weighbridge) Fields
  const [formPoidsBrut, setFormPoidsBrut] = useState("");
  const [formTare, setFormTare] = useState("");

  // Auto calculations
  const poidsNet = useMemo(() => {
    const brut = parseFloat(formPoidsBrut) || 0;
    const tare = parseFloat(formTare) || 0;
    return Math.max(0, brut - tare);
  }, [formPoidsBrut, formTare]);

  const montantTotal = useMemo(() => {
    const prix = parseFloat(formPrixUnitaire) || 0;
    return poidsNet * prix;
  }, [poidsNet, formPrixUnitaire]);

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const fetchVentes = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterCamion) query.append("camionId", filterCamion);
    if (filterClient) query.append("clientId", filterClient);
    if (filterStatut) query.append("statutPaiement", filterStatut);
    if (dateDebut) query.append("dateDebut", dateDebut);
    if (dateFin) query.append("dateFin", dateFin);

    fetch(`/api/ventes?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setVentes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchDropdownData = () => {
    fetch("/api/camions?statut=en_service")
      .then((res) => res.json())
      .then((data) => setCamions(data));

    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data));

    fetch("/api/produits")
      .then((res) => res.json())
      .then((data) => setProduits(data));
  };

  useEffect(() => {
    fetchVentes();
  }, [filterCamion, filterClient, filterStatut, dateDebut, dateFin]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleOpenAddModal = () => {
    setFormCamionId("");
    setFormClientId("");
    setFormProduitId("");
    setFormPoidsBrut("");
    setFormTare("");
    setFormPrixUnitaire("");
    setFormStatutPaiement("en_attente");
    setFormDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleProduitChange = (prodId: string) => {
    setFormProduitId(prodId);
    if (!prodId) {
      setFormPrixUnitaire("");
      return;
    }
    const prod = produits.find((p) => String(p.id) === prodId);
    if (prod) {
      const client = clients.find((c) => String(c.id) === formClientId);
      const reduction = client?.typePrix === "preferentiel" ? 0.9 : 1;
      setFormPrixUnitaire(String(Math.round(prod.prixVente * reduction)));
    }
  };

  // Re-calculate price when client changes if product is already selected
  useEffect(() => {
    if (formProduitId && formClientId) {
       handleProduitChange(formProduitId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (poidsNet <= 0) {
      setToastMessage("Le poids net doit être supérieur à 0");
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      camionId: parseInt(formCamionId),
      clientId: parseInt(formClientId),
      produitId: parseInt(formProduitId),
      quantite: poidsNet,
      prixUnitaire: parseFloat(formPrixUnitaire),
      statutPaiement: formStatutPaiement,
      date: formDate,
    };

    fetch("/api/ventes", {
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
          setToastMessage("Vente enregistrée avec succès");
          setToastType("success");
          setShowToast(true);
          setIsModalOpen(false);
          fetchVentes();
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

  const generateFacturePDF = (vente: any) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text("TRUCKMANAGER BTP", 14, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Transport de matériaux & Vente de granulats", 14, 31);
    doc.text("Zone Industrielle Rufisque, Dakar, Sénégal", 14, 36);
    doc.text("Tél : +221 33 800 00 00 · Email : contact@truckmanager.sn", 14, 41);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15);
    doc.text(`FACTURE N° : ${vente.numeroFacture}`, 130, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date d'émission : ${formatDate(vente.date)}`, 130, 31);
    doc.text(`Statut de paiement : ${statutPaiementLabels[vente.statutPaiement]}`, 130, 36);

    doc.setDrawColor(240);
    doc.line(14, 48, 196, 48);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FACTURÉ À :", 14, 58);
    doc.setFont("helvetica", "bold");
    doc.text(vente.client.nom, 14, 64);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact : ${vente.client.contact || "-"}`, 14, 70);
    doc.text(`Email : ${vente.client.email || "-"}`, 14, 75);
    doc.text(`Adresse : ${vente.client.adresse || "-"}`, 14, 80);

    doc.setFont("helvetica", "bold");
    doc.text("DÉTAILS TRANSPORT :", 130, 58);
    doc.setFont("helvetica", "normal");
    doc.text(`Camion : ${vente.camion.immatriculation} (${vente.camion.marque})`, 130, 64);
    doc.text(`Chauffeur : ${vente.camion.chauffeurNom || "-"}`, 130, 70);

    const tableBody = [
      [
        vente.produit.nom,
        `${vente.quantite} ${vente.produit.unite}(s)`,
        `${formatMontant(vente.prixUnitaire)}`,
        `${formatMontant(vente.montantTotal)}`,
      ],
    ];

    autoTable(doc, {
      startY: 92,
      head: [["Désignation Matériaux", "Quantité / Volume", "Prix Unitaire", "Montant HT"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [14, 165, 233] },
      styles: { fontSize: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("Total Facture :", 130, finalY);
    doc.setFontSize(14);
    doc.setTextColor(14, 165, 233);
    doc.text(formatMontant(vente.montantTotal), 165, finalY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Merci pour votre confiance !", 14, 280);

    doc.save(`Facture-${vente.numeroFacture}.pdf`);
  };

  const columns = [
    {
      key: "numeroFacture",
      header: "N° Facture",
      render: (item: any) => <span className="font-bold text-slate-800">{item.numeroFacture || "-"}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (item: any) => (
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(item.date)}
        </div>
      ),
    },
    {
      key: "camion",
      header: "Véhicule",
      render: (item: any) => (
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center font-bold text-xs">
              {item.camion.immatriculation.substring(0, 2)}
           </div>
           <span className="font-semibold text-slate-700">{item.camion.immatriculation}</span>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (item: any) => (
        <span className="font-medium text-slate-600">{item.client.nom}</span>
      ),
    },
    {
      key: "quantite",
      header: "Poids Net",
      render: (item: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100">
           {item.quantite} {item.produit.unite}(s)
        </span>
      ),
    },
    {
      key: "montantTotal",
      header: "Montant",
      render: (item: any) => <span className="font-black text-slate-800 tracking-tight">{formatMontant(item.montantTotal)}</span>,
    },
    {
      key: "statutPaiement",
      header: "Paiement",
      render: (item: any) => (
        <Badge variant={statutPaiementColors[item.statutPaiement]}>
          {statutPaiementLabels[item.statutPaiement]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (item: any) => (
        <button
          onClick={() => generateFacturePDF(item)}
          className="p-2 rounded-xl text-slate-400 hover:bg-sky-50 hover:text-sky-500 transition-all border border-transparent hover:border-sky-100 shadow-sm"
          title="Télécharger la facture"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 page-enter">
      {/* Header section with gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
             </div>
             Opérations de Vente
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-2">Enregistrez les pesées et générez les factures (Workflow Pont-Bascule)</p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle Pesée
        </Button>
      </div>

      {/* Modern Filters */}
      <div className="card-modern p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <Select
          label="Filtrer par Camion"
          value={filterCamion}
          onChange={(e) => setFilterCamion(e.target.value)}
          placeholder="Tous les véhicules"
          options={camions.map((c) => ({ value: String(c.id), label: c.immatriculation }))}
        />
        <Select
          label="Filtrer par Client"
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          placeholder="Tous les clients"
          options={clients.map((c) => ({ value: String(c.id), label: c.nom }))}
        />
        <Select
          label="État du Paiement"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          placeholder="Tous"
          options={[
            { value: "paye", label: "Payé" },
            { value: "en_attente", label: "En attente" },
            { value: "annule", label: "Annulé" },
          ]}
        />
        <Input label="Date Début" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <Input label="Date Fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
      </div>

      {/* Modern Data Table */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl opacity-80" />
            <Skeleton className="h-12 w-full rounded-2xl opacity-60" />
            <Skeleton className="h-12 w-full rounded-2xl opacity-40" />
          </div>
        ) : ventes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
               </svg>
            </div>
            <p className="text-slate-500 font-bold">Aucune vente trouvée.</p>
            <p className="text-slate-400 text-sm mt-1">Commencez par enregistrer une nouvelle pesée.</p>
          </div>
        ) : (
          <div className="p-1">
             <DataTable columns={columns} data={ventes} />
          </div>
        )}
      </div>

      {/* Modal Weighbridge Workflow */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrement Pont-Bascule">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Informations Générales */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/60 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                   </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Détails de la mission</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <Select
                 label="Client *"
                 value={formClientId}
                 onChange={(e) => setFormClientId(e.target.value)}
                 placeholder="Sélectionner le client"
                 options={clients.map((c) => ({ value: String(c.id), label: `${c.nom} (${c.typePrix})` }))}
                 required
               />
               <Select
                 label="Véhicule (en service) *"
                 value={formCamionId}
                 onChange={(e) => setFormCamionId(e.target.value)}
                 placeholder="Sélectionner le camion"
                 options={camions.map((c) => ({ value: String(c.id), label: `${c.immatriculation} - ${c.marque}` }))}
                 required
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <Select
                 label="Produit / Matériau *"
                 value={formProduitId}
                 onChange={(e) => handleProduitChange(e.target.value)}
                 placeholder="Ex: Granite Concassé"
                 options={produits.map((p) => ({ value: String(p.id), label: `${p.nom} (par ${p.unite})` }))}
                 required
               />
               <Input
                 label="Date du chargement *"
                 type="date"
                 value={formDate}
                 onChange={(e) => setFormDate(e.target.value)}
                 required
               />
             </div>
          </div>

          {/* Section 2: Pesée (Weighbridge) */}
          <div className="bg-sky-50/30 p-5 rounded-2xl border border-sky-100/50 space-y-4">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-md bg-sky-500 text-white flex items-center justify-center">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                     </svg>
                   </div>
                   <h3 className="text-sm font-bold text-slate-800">Données du Pont-Bascule</h3>
                </div>
                <Badge variant="info">Calcul Automatique</Badge>
             </div>
             
             <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Poids Brut (T) *"
                  type="number"
                  step="0.01"
                  placeholder="Camion plein"
                  value={formPoidsBrut}
                  onChange={(e) => setFormPoidsBrut(e.target.value)}
                  required
                />
                <Input
                  label="Tare (T) *"
                  type="number"
                  step="0.01"
                  placeholder="Camion vide"
                  value={formTare}
                  onChange={(e) => setFormTare(e.target.value)}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                     Poids Net (Qté)
                  </label>
                  <div className="px-4 py-2 bg-white rounded-xl border border-sky-200 text-sm font-black text-sky-600 h-[46px] flex items-center justify-center shadow-inner">
                    {poidsNet > 0 ? `${poidsNet.toFixed(2)} T` : "0.00 T"}
                  </div>
                </div>
             </div>
          </div>

          {/* Section 3: Facturation */}
          <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Facturation</h3>
             </div>

             <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Prix Unitaire (F) *"
                  type="number"
                  value={formPrixUnitaire}
                  onChange={(e) => setFormPrixUnitaire(e.target.value)}
                  required
                />
                <Select
                  label="Statut paiement *"
                  value={formStatutPaiement}
                  onChange={(e) => setFormStatutPaiement(e.target.value)}
                  options={[
                    { value: "en_attente", label: "En attente" },
                    { value: "paye", label: "Payé" },
                  ]}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                     Montant Total
                  </label>
                  <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-sm font-black text-white h-[46px] flex items-center justify-center shadow-lg shadow-slate-900/20">
                    {montantTotal > 0 ? formatMontant(montantTotal) : "0 F"}
                  </div>
                </div>
             </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting} className="bg-sky-500 hover:bg-sky-600 text-white border-none shadow-lg shadow-sky-500/30 min-w-[200px]">
               Enregistrer & Facturer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toasts */}
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
