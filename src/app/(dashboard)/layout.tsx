"use client";

import { SessionProvider } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DarkModeProvider } from "@/contexts/DarkModeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DarkModeProvider>
        <DashboardShell>{children}</DashboardShell>
      </DarkModeProvider>
    </SessionProvider>
  );
}
