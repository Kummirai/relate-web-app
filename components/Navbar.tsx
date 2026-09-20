"use client";

import { Roboto } from "next/font/google";
import { LuMenu, LuX, LuChevronDown, LuLogIn } from "react-icons/lu";
import { FaGraduationCap } from "react-icons/fa6";
import Link from "next/link";
import { useState } from "react";

const roboto = Roboto({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type NavItem = { link: string; path: string };
type NavGroup = { link: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    link: "Magazines",
    items: [
      { link: "All Magazines", path: "/magazines" },
      { link: "Relate", path: "/magazines?club=relate" },
      { link: "Sprout Kids", path: "/magazines?club=sprout-kids" },
      { link: "Surge Youth", path: "/magazines?club=surge" },
      { link: "Pulse", path: "/magazines?club=pulse" },
      { link: "Prime", path: "/magazines?club=prime" },
      { link: "Anchor", path: "/magazines?club=anchor" },
    ],
  },
  {
    link: "Explore",
    items: [
      { link: "Clubs", path: "/magazines" },
      { link: "Study Guides", path: "/magazines" },
      { link: "Calendar", path: "/magazines" },
    ],
  },
];

export default function Navbar({ session, overlay = false }: { session?: { user?: { name?: string | null; role?: string | null } } | null; overlay?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const admin = session?.user?.role === "admin";
  const userName = session?.user?.name ?? "";

  // Light bar on normal pages; transparent over dark heroes when overlay is set.
  const shell = overlay ? "absolute inset-x-0 top-0 z-30" : "bg-white border-b border-gray-100";
  const ink = overlay ? "text-white" : "text-navy";
  const inkSoft = overlay ? "text-white/60" : "text-slate-gray";
  const hover = overlay ? "hover:text-cyan-light" : "hover:text-cyan-dark";

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <section className={shell}>
      <div className="max-w-6xl mx-auto px-4 md:px-0 flex items-center justify-between gap-4">
        <Link href="/" className={`${ink} flex items-center gap-2 py-3 md:py-4`}>
          <FaGraduationCap className={`text-4xl md:text-5xl text-cyan self-center`} />
          <div className="leading-none">
            <h1 className={`text-[1.7rem] md:text-[2rem] font-extrabold ${roboto.className} tracking-tight leading-none`}>
              Relate
              <span className="text-cyan font-black">World</span>
            </h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.35em] ${inkSoft} mt-1.5`}>
              Grow · Belong · Become
            </p>
          </div>
        </Link>

        <nav className="hidden lg:block">
          <ul className={`flex items-center gap-3 xl:gap-5 py-3 ${ink} whitespace-nowrap`}>
            <li>
              <Link href="/" className={`block text-sm xl:text-base ${hover} transition-colors`}>
                Home
              </Link>
            </li>
            {navGroups.map((group) => (
              <li key={group.link} className="relative group">
                <span className={`flex items-center gap-1 text-sm xl:text-base ${hover} transition-colors cursor-default`}>
                  {group.link}
                  <LuChevronDown className="text-xs mt-0.5 group-hover:rotate-180 transition-transform" />
                </span>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-44">
                    {group.items.map((item) => (
                      <Link
                        key={item.link}
                        href={item.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-alice-blue hover:text-cyan-dark transition-colors"
                      >
                        {item.link}
                      </Link>
                    ))}
                    {admin && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <Link href="/admin" className="block px-4 py-2 text-sm font-semibold text-navy hover:bg-alice-blue hover:text-cyan-dark transition-colors">
                          Admin Console
                        </Link>
                        <Link href="/records" className="block px-4 py-2 text-sm text-gray-700 hover:bg-alice-blue hover:text-cyan-dark transition-colors">
                          Records
                        </Link>
                        <Link href="/records/streaks" className="block px-4 py-2 text-sm text-gray-700 hover:bg-alice-blue hover:text-cyan-dark transition-colors">
                          Restore Streaks
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
            <li>
              {session ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm xl:text-base font-semibold text-navy hover:text-cyan-dark transition-colors"
                  title={userName}
                >
                  <span className="size-8 rounded-full bg-alice-blue border border-gray-200 flex items-center justify-center text-[11px] font-bold text-navy">
                    {userName ? userName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : <LuLogIn />}
                  </span>
                  Account
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan text-navy px-4 py-1.5 text-sm font-semibold hover:bg-cyan-dark transition-colors"
                >
                  <LuLogIn /> Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/profile" className="hidden lg:inline-flex text-sm font-semibold text-navy hover:text-cyan-dark transition-colors">
              Account
            </Link>
          ) : (
            <Link
              href="/signin"
              className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-cyan text-navy px-4 py-2 text-sm font-semibold hover:bg-cyan-dark transition-colors"
            >
              <LuLogIn /> Sign in
            </Link>
          )}            <button onClick={() => setMenuOpen(true)} className={`lg:hidden ${ink} p-2`} aria-label="Open menu">
            <LuMenu className="text-3xl" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col lg:hidden overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link href="/" className="text-navy flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <FaGraduationCap className="text-4xl text-cyan self-center" />
              <div className="leading-none">
                <h1 className={`text-2xl font-extrabold ${roboto.className} tracking-tight leading-none`}>
                  Relate<span className="text-cyan font-black">World</span>
                </h1>
                <p className="text-[9px] uppercase tracking-[0.35em] text-slate-gray mt-1.5">Grow · Belong · Become</p>
              </div>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="text-navy p-2" aria-label="Close menu">
              <LuX className="text-3xl" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col items-center justify-center gap-5 py-8">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-navy text-2xl font-medium hover:text-cyan-dark transition-colors">
              Home
            </Link>
            {navGroups.map((group) => (
              <div key={group.link} className="w-full max-w-xs">
                <button
                  onClick={() => toggleGroup(group.link)}
                  className="w-full flex items-center justify-center gap-2 text-navy text-2xl font-medium hover:text-cyan-dark transition-colors"
                >
                  {group.link}
                  <LuChevronDown className={`text-lg transition-transform duration-200 ${expandedGroups[group.link] ? "rotate-180" : ""}`} />
                </button>
                {expandedGroups[group.link] && (
                  <div className="flex flex-col items-center gap-3 mt-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.link}
                        href={item.path}
                        onClick={() => setMenuOpen(false)}
                        className="text-slate-gray text-lg hover:text-cyan-dark transition-colors"
                      >
                        {item.link}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {admin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-cyan-dark text-xl font-semibold">
                Admin Console
              </Link>
            )}
            <Link
              href={session ? "/profile" : "/signin"}
              onClick={() => setMenuOpen(false)}
              className="mt-4 bg-cyan text-navy px-10 py-3 text-lg font-semibold rounded-lg"
            >
              {session ? "My Account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </section>
  );
}
