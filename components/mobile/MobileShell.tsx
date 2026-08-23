"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

type Page = "home" | "community" | "requests" | "study";

const TABS: { key: Page; label: string; icon: string }[] = [
  { key: "home", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { key: "community", label: "Community", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "requests", label: "Requests", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { key: "study", label: "Study", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const DRAWER_LINKS = [
  { label: "Home", page: "home" as Page },
  { label: "Community", page: "community" as Page },
  { label: "Requests", page: "requests" as Page },
  { label: "Study", page: "study" as Page },
  { label: "Bible", href: "/bible" },
  { label: "Skills", href: "/skills" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Records", href: "/records", admin: true },
];

export default function MobileShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  const [active, setActive] = useState<Page>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  // Sync route to active page
  useEffect(() => {
    if (pathname === "/") setActive("home");
    else if (pathname === "/community") setActive("community");
    else if (pathname === "/requests") setActive("requests");
    else if (pathname === "/study") setActive("study");
  }, [pathname]);

  const navigate = (page: Page) => {
    setActive(page);
    setDrawerOpen(false);
    router.push(page === "home" ? "/" : `/${page}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:hidden" style={{ background: "#eff5f9" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: "#eff5f9" }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl"
          style={{ background: "rgba(0,0,0,0.04)" }}
        >
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
            <path d="M1 1h20M1 9h20M1 17h20" stroke="#1d2a4d" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-bold text-lg" style={{ color: "#1d2a4d" }}>
          Relate
        </span>
        <div className="w-10" />
      </header>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 left-0 w-72 h-full flex flex-col py-6 px-5 overflow-y-auto"
            style={{ background: "#eff5f9" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-xl" style={{ color: "#1d2a4d" }}>
                Relate
              </span>
              <button onClick={() => setDrawerOpen(false)} className="p-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="#1d2a4d" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* User info */}
            {session ? (
              <div className="mb-6 p-3 rounded-xl" style={{ background: "white" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: "#13c5dd" }}
                  >
                    {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#1d2a4d" }}>
                      {session.user?.name || session.user?.email || "User"}
                    </p>
                    <p className="text-xs" style={{ color: "#6b7a8d" }}>
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Nav links */}
            <nav className="flex flex-col gap-1">
              {DRAWER_LINKS.map((link) => {
                if (link.admin && !isAdmin) return null;
                const isPage = "page" in link;
                const isActive = isPage && active === link.page;
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      if (isPage) navigate(link.page);
                      else { setDrawerOpen(false); router.push(link.href!); }
                    }}
                    className="text-left px-4 py-3 rounded-xl text-sm font-medium transition"
                    style={{
                      color: isActive ? "#13c5dd" : "#1d2a4d",
                      background: isActive ? "white" : "transparent",
                    }}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Auth button */}
            <div className="mt-auto pt-6">
              {session ? (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "#13c5dd" }}
                  >
                    Sign Out
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => { setDrawerOpen(false); router.push("/signin"); }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#13c5dd" }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 px-2 z-30 border-t"
        style={{ background: "#d4eef5", borderColor: "rgba(0,0,0,0.06)" }}
      >
        {TABS.map((tab) => {
          const active2 = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition"
              style={{
                background: active2 ? "#1d2a4d" : "transparent",
                minWidth: 64,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active2 ? "white" : "#1d2a4d"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={tab.icon} />
              </svg>
              <span
                className="text-[10px] font-semibold"
                style={{ color: active2 ? "white" : "#1d2a4d" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
