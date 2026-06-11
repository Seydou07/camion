"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface DarkModeContextType {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const isDark = stored === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setReady(true);
  }, []);

  const sync = (v: boolean) => {
    setDarkMode(v);
    if (v) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", String(v));
  };

  const toggleDarkMode = () => sync(!darkMode);

  if (!ready) return <>{children}</>;

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode: sync, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
