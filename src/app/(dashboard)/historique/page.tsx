"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Badge,
  Skeleton,
  TableCard,
  DataTable,
  Pagination,
} from "@/components/ui";

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("tous");
  const [filterAction, setFilterAction] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        let filtered = data;
        if (filterEntity !== "tous") {
          filtered = data.filter((l: any) => l.entity === filterEntity);
        }
        if (filterAction !== "tous") {
          filtered = filtered.filter((l: any) => l.action === filterAction);
        }
        setLogs(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchHistory();
  }, [filterEntity, filterAction]);

  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "green";
      case "update":
        return "blue";
      case "delete":
        return "danger";
      default:
        return "gray";
    }
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      camion: "Camion",
      chauffeur: "Chauffeur",
      user: "Utilisateur",
      carburant: "Carburant",
      reparation: "Réparation",
      maintenance: "Maintenance",
      voyage: "Voyage",
    };
    return labels[entity] || entity;
  };

  const columns = [
    {
      key: "user",
      header: "Utilisateur",
      render: (item: any) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">
            {item.user?.name || "Système"}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {item.user?.email || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (item: any) => (
        <Badge variant={getActionColor(item.action)}>
          {item.action === "create" ? "Création" : item.action === "update" ? "Modification" : "Suppression"}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entité",
      render: (item: any) => (
        <span className="text-sm font-semibold text-slate-600">
          {getEntityLabel(item.entity)} {item.entityId ? `#${item.entityId}` : ""}
        </span>
      ),
    },
    {
      key: "details",
      header: "Détails",
      render: (item: any) => (
        <span className="text-sm text-slate-600 max-w-xs truncate" title={item.details || ""}>
          {item.details || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date et Heure",
      render: (item: any) => (
        <span className="text-sm text-slate-600">
          {new Date(item.createdAt).toLocaleString("fr-FR")}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Historique des Actions</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi de toutes les modifications effectuées dans l'application</p>
      </div>

      <TableCard>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1" />
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="tous">Toutes les entités</option>
            <option value="camion">Camions</option>
            <option value="chauffeur">Chauffeurs</option>
            <option value="user">Utilisateurs</option>
            <option value="carburant">Carburant</option>
            <option value="reparation">Réparations</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="tous">Toutes les actions</option>
            <option value="create">Créations</option>
            <option value="update">Modifications</option>
            <option value="delete">Suppressions</option>
          </select>
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
              data={paginatedLogs}
              columns={columns}
            />

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={logs.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </TableCard>
    </div>
  );
}