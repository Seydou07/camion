"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
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
    label: "Ventes",
    href: "/ventes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/clients",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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
  } else if (segments[0] === "ventes") {
    crumbs.push({ label: "Ventes", href: "/ventes" });
  } else if (segments[0] === "clients") {
    crumbs.push({ label: "Clients", href: "/clients" });
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
  if (pathname === "/ventes") return "Gestion des ventes";
  if (pathname === "/clients") return "Gestion des clients";
  if (pathname === "/rapports") return "Rapports et analyses";
  if (pathname === "/historique") return "Historique des activités";
  if (pathname === "/parametres") return "Paramètres";
  return "TruckManager";
}

function NavItem({ item, isActive }: { item: typeof menuItems[0]; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative",
        isActive
          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <span className={cn(
        "transition-colors duration-300",
        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
      )}>
        {item.icon}
      </span>
      {item.label}
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-semibold tracking-wide">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[270px] bg-white border-r border-slate-100/80 flex flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/30 transition-shadow">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight">TruckManager</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestion de flotte</p>
            </div>
          </Link>
        </div>

        {/* Section label */}
        <div className="px-6 pt-2 pb-2">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Menu principal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return <NavItem key={item.href} item={item} isActive={isActive} />;
          })}

          {/* Separator */}
          <div className="pt-5 pb-2 px-3">
            <div className="border-t border-slate-100" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] mt-4">Système</p>
          </div>

          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return <NavItem key={item.href} item={item} isActive={isActive} />;
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-slate-100/80 mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-sky-500/15">
              {session.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {session.user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-semibold">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all duration-200 cursor-pointer"
              title="Se déconnecter"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-2xl border-b border-slate-100/60">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">{pageTitle}</h2>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 mt-1">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "text-xs font-semibold transition-colors",
                        index === breadcrumbs.length - 1
                          ? "text-sky-500"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
            </div>

            {/* Header right */}
            <div className="flex items-center gap-3">
              {/* Search button */}
              <button className="p-2.5 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
              {/* Notifications */}
              <button className="relative p-2.5 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8 min-h-[calc(100vh-73px)]">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
