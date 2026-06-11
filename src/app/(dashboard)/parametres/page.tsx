"use client";

import { useEffect, useState } from "react";
import { Input, Button } from "@/components/ui";
import { Toast } from "@/components/ui";
import { useDarkMode } from "@/contexts/DarkModeContext";

export default function ParametresPage() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Alert thresholds
  const [alertsVidangeKm, setAlertsVidangeKm] = useState("1000");
  const [alertsAssuranceJours, setAlertsAssuranceJours] = useState("30");
  const [alertsVisiteJours, setAlertsVisiteJours] = useState("30");
  const [savingAlerts, setSavingAlerts] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data["alerts_vidange_km"]) setAlertsVidangeKm(data["alerts_vidange_km"]);
        if (data["alerts_assurance_jours"]) setAlertsAssuranceJours(data["alerts_assurance_jours"]);
        if (data["alerts_visite_jours"]) setAlertsVisiteJours(data["alerts_visite_jours"]);
      })
      .catch(() => {});
  }, []);

  const handleSaveAlerts = async () => {
    setSavingAlerts(true);
    try {
      const res = await fetch("/api/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alerts_vidange_km: alertsVidangeKm,
          alerts_assurance_jours: alertsAssuranceJours,
          alerts_visite_jours: alertsVisiteJours,
        }),
      });
      if (res.ok) {
        setToast({ message: "Seuils d'alerte mis à jour", type: "success" });
      } else {
        setToast({ message: "Erreur lors de la sauvegarde", type: "error" });
      }
    } catch {
      setToast({ message: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setSavingAlerts(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 page-enter pb-12">
      {/* Appearance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Thème de l'application</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choisissez entre le thème clair et le thème sombre.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-amber-100 text-amber-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {darkMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {darkMode ? "Mode sombre" : "Mode clair"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {darkMode ? "Thème sombre pour une utilisation nocturne" : "Thème clair par défaut"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Alert thresholds */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Seuils d'alerte</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configurez les seuils qui déclenchent les alertes sur le tableau de bord et les fiches véhicules.</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Vidange */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Vidange moteur</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Intervalle kilométrique par défaut entre deux vidanges.</p>
              </div>
            </div>
            <Input
              label="Intervalle de vidange (km)"
              type="number"
              value={alertsVidangeKm}
              onChange={(e) => setAlertsVidangeKm(e.target.value)}
            />
          </div>

          {/* Assurance */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Assurance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nombre de jours avant expiration pour déclencher une alerte.</p>
              </div>
            </div>
            <Input
              label="Seuil d'alerte (jours)"
              type="number"
              value={alertsAssuranceJours}
              onChange={(e) => setAlertsAssuranceJours(e.target.value)}
            />
          </div>

          {/* Visite technique */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Visite technique</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nombre de jours avant expiration pour déclencher une alerte.</p>
              </div>
            </div>
            <Input
              label="Seuil d'alerte (jours)"
              type="number"
              value={alertsVisiteJours}
              onChange={(e) => setAlertsVisiteJours(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveAlerts}
            loading={savingAlerts}
            className="bg-fleet-blue hover:bg-fleet-blue-dark border-none shadow-lg shadow-fleet-blue/30 text-white"
          >
            Sauvegarder les seuils
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
