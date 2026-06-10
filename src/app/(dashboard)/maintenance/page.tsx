"use client";

import { useEffect, useState } from "react";
import { Button, Select, DataTable, Toast, Skeleton, ConfirmModal, TableCard, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import MaintenanceFormModal from "@/components/maintenance/MaintenanceFormModal";
import MaintenanceDetailModal from "@/components/maintenance/MaintenanceDetailModal";

export default function MaintenancePage() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [cartesCarburant, setCartesCarburant] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filters
  const [filterStatut, setFilterStatut] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);

  // Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInterventions = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterStatut && filterStatut !== "tous") query.append("statut", filterStatut);

    fetch(`/api/reparations?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setInterventions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatut]);

  const filteredInterventions = (interventions || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.camion?.immatriculation?.toLowerCase() || "").includes(q) ||
      (item.reference?.toLowerCase() || "").includes(q) ||
      (item.type?.toLowerCase() || "").includes(q) ||
      (item.garage?.toLowerCase() || "").includes(q)
    );
  });

  const totalPages = Math.ceil(filteredInterventions.length / pageSize);
  const paginatedInterventions = filteredInterventions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fetchReferences = () => {
    fetch("/api/camions")
      .then((res) => res.json())
      .then((data) => setCamions(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    fetch("/api/cartes-carburant")
      .then((res) => res.json())
      .then((data) => setCartesCarburant(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [filterStatut]);

  const handleOpenAdd = () => {
    setSelectedIntervention(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIntervention(item);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (item: any) => {
    setSelectedIntervention(item);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    fetch(`/api/reparations?id=${deleteTarget}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToastMessage("Intervention supprimée avec succès");
          setToastType("success");
          setShowToast(true);
          fetchInterventions();
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
    switch (statut) {
      case "planifiee":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">Planifiée</span>;
      case "en_cours":
        return <span className="bg-fleet-blue/10 text-fleet-blue border border-fleet-blue/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">En Cours</span>;
      case "terminee":
        return <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">Terminée</span>;
      case "annulee":
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">Annulée</span>;
      default:
        return <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">{statut}</span>;
    }
  };

  const columns = [
    {
      key: "reference",
      header: "Référence",
      render: (item: any) => (
        <span className="font-bold text-slate-800 text-sm">
          {item.reference || `REP-${item.id.toString().padStart(4, "0")}`}
        </span>
      ),
    },
    {
      key: "camion",
      header: "Camion",
      render: (item: any) => (
        <span className="font-black text-fleet-blue bg-fleet-blue/10 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-fleet-blue/20">
          {item.camion?.immatriculation}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item: any) => <span className="capitalize font-bold text-slate-700 text-sm">{item.type}</span>,
    },
    {
      key: "date",
      header: "Date Prévue/Réalisée",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-600">{formatDate(item.date)}</span>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (item: any) => getStatusBadge(item.statut),
    },
    {
      key: "cout",
      header: "Coût Total",
      render: (item: any) => (
        <span className="font-black text-rose-500 text-sm">
          {item.cout?.toLocaleString() || 0} F
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenDetail(item)}
            className="p-2 text-fleet-blue hover:bg-fleet-blue hover:text-white rounded-lg transition-all"
            title="Détails"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleOpenEdit(item, e)}
            className="p-2 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDelete(item.id, e)}
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
      {/* Table */}
      <TableCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
          <div className="flex-1 flex flex-wrap items-center gap-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par camion, référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
              { value: "tous", label: "Tous" },
              { value: "planifiee", label: "Planifiée" },
              { value: "en_cours", label: "En cours" },
              { value: "terminee", label: "Terminée" },
              { value: "annulee", label: "Annulée" },
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
          <Button onClick={handleOpenAdd} className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle intervention
          </Button>
        </div>
        {loading ? (
          <div className="space-y-4 px-6 py-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedInterventions}
              emptyMessage="Aucune intervention trouvée."
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredInterventions.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </TableCard>

      {/* Modals */}
      {isFormOpen && (
        <MaintenanceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            setToastMessage("Intervention enregistrée avec succès");
            setToastType("success");
            setShowToast(true);
            fetchInterventions();
          }}
          initialData={selectedIntervention}
          camions={camions}
          cartesCarburant={cartesCarburant}
        />
      )}

      {isDetailOpen && (
        <MaintenanceDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          reparation={selectedIntervention}
        />
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Supprimer cette intervention ?"
        message="L'intervention de maintenance et toutes les pièces associées seront définitivement supprimées."
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
