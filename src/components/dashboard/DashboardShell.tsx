"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Camions",
    href: "/camions",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: "Carburant",
    href: "/carburant",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    label: "Voyages",
    href: "/voyages",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l-6.002-3.001a1.125 1.125 0 00-1.006 0L3.998 16.446A.75.75 0 013 15.78V5.267c0-.282.158-.54.413-.66l5.083-2.4a1.125 1.125 0 011.008 0l5.502 2.61 5.58-2.64A.75.75 0 0121 3.267v10.513c0 .282-.158.54-.413.66l-4.084 1.933a1.125 1.125 0 01-1.008 0z" />
      </svg>
    ),
  },
  {
    label: "Chauffeurs",
    href: "/chauffeurs",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.198-.654-.044-.897L11.5 8.85m-2.227 3.518l-3.053 2.492c-.266.217-.654.198-.897-.044L3.83 12.5" />
      </svg>
    ),
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

const bottomMenuItems = [
  {
    label: "Historique",
    href: "/historique",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Breadcrumb mapping
function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/" },
  ];

  if (pathname === "/") return crumbs;

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "camions") {
    crumbs.push({ label: "Camions", href: "/camions" });
    if (segments[1]) {
      crumbs.push({ label: segments[1], href: `/camions/${segments[1]}` });
    }
  } else if (segments[0] === "carburant") {
    crumbs.push({ label: "Carburant", href: "/carburant" });
  } else if (segments[0] === "voyages") {
    crumbs.push({ label: "Voyages", href: "/voyages" });
  } else if (segments[0] === "chauffeurs") {
    crumbs.push({ label: "Chauffeurs", href: "/chauffeurs" });
  } else if (segments[0] === "utilisateurs") {
    crumbs.push({ label: "Utilisateurs", href: "/utilisateurs" });
  } else if (segments[0] === "maintenance") {
    crumbs.push({ label: "Maintenance", href: "/maintenance" });
  } else if (segments[0] === "rapports") {
    crumbs.push({ label: "Rapports", href: "/rapports" });
  } else if (segments[0] === "historique") {
    crumbs.push({ label: "Historique", href: "/historique" });
  } else if (segments[0] === "parametres") {
    crumbs.push({ label: "Paramètres", href: "/parametres" });
  }

  return crumbs;
}

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/camions") return "Gestion des camions";
  if (pathname.startsWith("/camions/")) return "Fiche camion";
  if (pathname === "/carburant") return "Suivi carburant";
  if (pathname === "/voyages") return "Suivi des voyages";
  if (pathname === "/chauffeurs") return "Gestion des chauffeurs";
  if (pathname === "/utilisateurs") return "Gestion des utilisateurs";
  if (pathname === "/maintenance") return "Planification de la maintenance";
  if (pathname === "/rapports") return "Rapports et analyses";
  if (pathname === "/historique") return "Historique des activités";
  if (pathname === "/parametres") return "Paramètres";
  return "TruckManager";
}

function NavItem({ item, isActive, darkMode }: { item: typeof menuItems[0]; isActive: boolean; darkMode: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 py-3 px-6 font-bold text-sm tracking-tight border-r-4 transition-all duration-300 group",
        isActive
          ? darkMode 
            ? "bg-fleet-blue/20 text-white border-fleet-blue" 
            : "bg-fleet-blue/10 text-fleet-blue border-fleet-blue"
          : darkMode
            ? "text-slate-400 border-transparent hover:bg-slate-700 hover:text-white"
            : "text-slate-500/60 border-transparent hover:bg-slate-50 hover:text-fleet-blue"
      )}
    >
      <span className={cn(
        "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
        isActive 
          ? darkMode ? "text-white" : "text-fleet-blue" 
          : darkMode ? "text-slate-400 group-hover:text-white" : "text-slate-400 group-hover:text-fleet-blue"
      )}>
        {item.icon}
      </span>
      <span className="flex-1 uppercase tracking-tight">{item.label}</span>
    </Link>
  );
}

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, setDarkMode } = useDarkMode();

  // Call all hooks BEFORE any conditional returns!
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // All dark mode logic is handled by DarkModeContext

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-fleet-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-semibold tracking-wide">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className={cn("min-h-screen flex", darkMode ? "bg-slate-950" : "bg-[#F8FAFC]")}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 bottom-0 border-r flex flex-col z-30 transition-all duration-300",
        sidebarOpen ? "left-0 w-[270px]" : "-left-[270px] w-[270px]",
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100/80"
      )}>
        {/* Logo */}
        <div className="px-6 py-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-fleet-blue text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <h1 className={cn("text-lg font-black tracking-tight leading-tight", darkMode ? "text-white" : "text-fleet-blue")}>FleetGuardian</h1>
              <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Gestion de flotte</p>
            </div>
          </Link>
        </div>

        {/* Section label */}
        <div className="px-6 pt-2 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Menu principal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return <NavItem key={item.href} item={item} isActive={isActive} darkMode={darkMode} />;
          })}

          {/* Separator */}
          <div className="pt-5 pb-2 px-3">
            <div className={cn("border-t", darkMode ? "border-slate-700" : "border-slate-100")} />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-4 text-slate-400">Système</p>
          </div>

          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return <NavItem key={item.href} item={item} isActive={isActive} darkMode={darkMode} />;
          })}
        </nav>

        {/* User section */}
        <div className={cn("px-4 py-4 border-t mt-auto", darkMode ? "border-slate-700" : "border-slate-100/80")}>
          <div className={cn("flex items-center gap-3 p-2 rounded-2xl transition-colors group", darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fleet-blue to-fleet-blue-dark text-white flex items-center justify-center text-sm font-black shadow-lg shadow-fleet-blue/15">
              {session.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold truncate", darkMode ? "text-white" : "text-slate-800")}>
                {session.user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-semibold">
                {session.user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Main content area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-[270px]" : "ml-0"
      )}>
        {/* Header */}
        <header className={cn("sticky top-0 z-20 backdrop-blur-2xl border-b", 
          darkMode ? "bg-slate-900/70 border-slate-800" : "bg-white/70 border-slate-100/60"
        )}>
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Header left: hamburger + page title */}
            <div className="flex items-center gap-4">
              {/* Hamburger button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn("p-2.5 rounded-2xl transition-all cursor-pointer",
                  darkMode 
                    ? "hover:bg-slate-700 text-slate-300 hover:text-white" 
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              </button>
              {/* Page title */}
              <h1 className={cn("text-lg font-bold", darkMode ? "text-white" : "text-slate-800")}>{pageTitle}</h1>
            </div>

            {/* Header right: dark mode toggle + user profile */}
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn("p-2.5 rounded-2xl transition-all cursor-pointer",
                  darkMode 
                    ? "hover:bg-slate-700 text-slate-300 hover:text-white" 
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                )}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              {/* User profile + logout */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fleet-blue to-fleet-blue-dark text-white flex items-center justify-center text-xs font-black shadow-lg shadow-fleet-blue/15">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <span className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-700")}>
                    {session.user?.name?.split(' ')[0] || "Admin"}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className={cn("p-2 rounded-xl transition-all duration-200 cursor-pointer",
                    darkMode 
                      ? "hover:bg-rose-500/20 text-slate-400 hover:text-rose-400" 
                      : "hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                  )}
                  title="Se déconnecter"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn("p-8 min-h-[calc(100vh-73px)]", darkMode ? "bg-slate-950" : "bg-[#F8FAFC]")}>
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
