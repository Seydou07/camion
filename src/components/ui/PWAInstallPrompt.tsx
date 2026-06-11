"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a small delay for better UX
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detect when app gets installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch {
      // user cancelled or error
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Don't show again for 24h
    localStorage.setItem("pwa-dismiss-time", Date.now().toString());
  };

  // Don't render if already installed or dismissed recently
  if (isInstalled || !showBanner) return null;

  // Check dismiss timeout
  const dismissTime = localStorage.getItem("pwa-dismiss-time");
  if (dismissTime && Date.now() - parseInt(dismissTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md",
        "animate-fade-in-up"
      )}
    >
      <div
        className={cn(
          "rounded-2xl p-5 shadow-2xl border backdrop-blur-xl",
          darkMode
            ? "bg-slate-800/95 border-slate-700 shadow-black/40"
            : "bg-white/95 border-slate-200 shadow-slate-900/15"
        )}
      >
        {/* Header with icon */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fleet-blue to-fleet-blue-dark flex items-center justify-center shadow-lg shadow-fleet-blue/25 flex-shrink-0">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-base font-bold",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              Installer FleetGuardian
            </h3>
            <p
              className={cn(
                "text-sm mt-0.5 leading-snug",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              Accédez rapidement à votre flotte depuis l&apos;écran d&apos;accueil
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "p-1.5 rounded-xl transition-colors flex-shrink-0 cursor-pointer",
              darkMode
                ? "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
              darkMode
                ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            disabled={installing}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer",
              "bg-gradient-to-r from-fleet-blue to-fleet-blue-dark text-white",
              "hover:shadow-lg hover:shadow-fleet-blue/30 hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-md",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "flex items-center justify-center gap-2"
            )}
          >
            {installing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Installation...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Installer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
