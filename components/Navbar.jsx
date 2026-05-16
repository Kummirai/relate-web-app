"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { DropdownMenuAvatar } from "./DropdownMenuAvatar";

export default function Navbar({ session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tabTitle, setTabTitle] = useState("Home");
  const navItems = [
    { id: 1, title: "Home", path: "/" },
    { id: 2, title: "Bible", path: "/bible" },
    { id: 3, title: "Bible Study", path: "/study" },
    { id: 4, title: "Skills", path: "/skills" },
    { id: 5, title: "Records", path: "/records" },
    { id: 6, title: "About", path: "/about" },
    { id: 7, title: "Contact", path: "/contact" },
  ];

  const handleSelectTab = (title) => {
    setTabTitle(title);
  };

  const adminEmails = process.env.ADMIN_EMAILS;

  return (
    <>
      <style>
        {`
                    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
                    *{
                        font-family: "Geist", sans-serif;
                    }
                `}
      </style>
      <header>
        <nav className="max-w-6xl mx-auto py-6 flex items-center justify-between relative">
          <Link href="/" className="font-semibold text-2xl" style={{ color: "#1d2a4d" }}>
            Relate
          </Link>

          <div className="hidden md:flex items-center rounded-full px-1 py-1 gap-2" style={{ border: "1px solid #13c5dd" }}>
            {navItems.map((item) => {
              const isAdmin = session?.user.role === "admin";

              if (item.title === "Records" && !isAdmin) return null;

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => handleSelectTab(item.title)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    item.title === tabTitle
                      ? "bg-white border font-medium" 
                      : "hover:opacity-70"
                  }`}
                  style={{
                    color: item.title === tabTitle ? "#13c5dd" : "#1d2a4d",
                    borderColor: item.title === tabTitle ? "#13c5dd" : "transparent",
                  }}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
          {!session ? (
            <button className="hidden md:flex items-center gap-2.5 text-white text-sm font-medium pl-5 pr-2 py-2 rounded-full cursor-pointer border-0 hover:opacity-90 transition" style={{ backgroundColor: "#13c5dd" }}>
              <Link href="/signin">Log In</Link>
              <span className="size-7 rounded-full bg-white flex items-center justify-center">
                <svg
                  width="12"
                  height="10"
                  viewBox="0 0 12 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M.6 4.602h10m-4-4 4 4-4 4"
                    stroke="#1d2a4d"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          ) : (
            <DropdownMenuAvatar />
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 cursor-pointer bg-transparent border-0 p-1"
          >
            <span
              className={`block w-6 h-0.5 transition-transform`}
              style={{ backgroundColor: "#1d2a4d", transform: menuOpen ? "rotate(45deg) translateY(5px)" : "none" }}
            ></span>
            <span
              className={`block w-6 h-0.5 transition-opacity`}
              style={{ backgroundColor: "#1d2a4d", opacity: menuOpen ? 0 : 1 }}
            ></span>
            <span
              className={`block w-6 h-0.5 transition-transform`}
              style={{ backgroundColor: "#1d2a4d", transform: menuOpen ? "rotate(-45deg) translateY(-5px)" : "none" }}
            ></span>
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 w-full flex flex-col p-5 gap-1 md:hidden z-50" style={{ backgroundColor: "#eff5f9" }}>
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className="px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#1d2a4d" }}
                >
                  {item.title}
                </Link>
              ))}
              <button className="flex items-center justify-center gap-2.5 text-white text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer border-0 mt-3 w-fit" style={{ backgroundColor: "#13c5dd" }}>
                Log In
                <span className="size-7 rounded-full bg-white flex items-center justify-center">
                  <svg
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M.6 4.602h10m-4-4 4 4-4 4"
                      stroke="#1d2a4d"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 cursor-pointer bg-transparent border-0 p-1"
          >
            <span
              className={`block w-6 h-0.5 bg-zinc-800 transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-zinc-800 transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-zinc-800 transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            ></span>
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 w-full bg-white border-t border-zinc-200 flex flex-col p-5 gap-1 md:hidden z-50">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`px-4 py-2.5 rounded-lg text-sm ${item.title === "Products" ? "bg-zinc-50 font-medium text-zinc-800" : "text-zinc-500 hover:bg-zinc-50"}`}
                >
                  {item.title}
                </Link>
              ))}
              <button className="flex items-center justify-center gap-2.5 bg-linear-to-r from-zinc-950 to-zinc-500 text-zinc-50 text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer border-0 mt-3 w-fit">
                Log In
                <span className="size-7 rounded-full bg-white flex items-center justify-center">
                  <svg
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M.6 4.602h10m-4-4 4 4-4 4"
                      stroke="#3f3f47"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
