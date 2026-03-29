"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tabTitle, setTabTitle] = useState("Home");
  const navItems = [
    { id: 1, title: "Home", path: "/" },
    { id: 2, title: "Bible Study", path: "/study" },
    { id: 3, title: "Prayer Request", path: "/request" },
    { id: 4, title: "Records", path: "/records" },
    { id: 5, title: "About", path: "/about" },
    { id: 6, title: "Contact", path: "/contact" },
  ];

  const handleSelectTab = (title) => {
    console.log(title);

    setTabTitle(title);
  };

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
          <Link href="/" className="font-semibold text-2xl text-zinc-950">
            {/* <svg
              width="151"
              height="36"
              viewBox="0 0 151 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M38.786 14.72q.696-.912 1.896-1.536t2.712-.624q1.728 0 3.144.864 1.44.84 2.256 2.376t.816 3.528-.816 3.576q-.816 1.56-2.256 2.448-1.416.864-3.144.864-1.512 0-2.688-.6-1.176-.624-1.92-1.536v8.208H36.05V12.776h2.736zm8.04 4.608q0-1.368-.576-2.352-.552-1.008-1.488-1.512a3.86 3.86 0 0 0-1.968-.528q-1.032 0-1.968.528-.912.528-1.488 1.536-.552 1.008-.552 2.376t.552 2.4q.576 1.008 1.488 1.536.936.528 1.968.528 1.056 0 1.968-.528.936-.552 1.488-1.584.576-1.032.576-2.4m8.226-4.632q.6-1.008 1.584-1.56 1.008-.576 2.376-.576v2.832h-.696q-1.608 0-2.448.816-.816.816-.816 2.832V26h-2.736V12.776h2.736zm18.595 4.368q0 .744-.096 1.344H63.447q.12 1.584 1.176 2.544t2.592.96q2.208 0 3.12-1.848h2.952q-.6 1.824-2.184 3-1.56 1.152-3.888 1.152-1.896 0-3.408-.84a6.3 6.3 0 0 1-2.352-2.4q-.84-1.56-.84-3.6t.816-3.576q.84-1.56 2.328-2.4 1.512-.84 3.456-.84 1.872 0 3.336.816a5.75 5.75 0 0 1 2.28 2.304q.816 1.464.816 3.384M70.79 18.2q-.024-1.512-1.08-2.424t-2.616-.912q-1.416 0-2.424.912-1.008.888-1.2 2.424zm8.284-3.456q.696-.96 1.896-1.56 1.224-.624 2.712-.624 1.752 0 3.168.84t2.232 2.4q.816 1.536.816 3.528t-.816 3.576q-.816 1.56-2.256 2.448-1.416.864-3.144.864-1.536 0-2.736-.6-1.176-.6-1.872-1.536V26H76.34V8.24h2.736zm8.04 4.584q0-1.368-.576-2.352-.552-1.008-1.488-1.512a3.86 3.86 0 0 0-1.968-.528q-1.032 0-1.968.528-.912.528-1.488 1.536-.552 1.008-.552 2.376t.552 2.4q.576 1.008 1.488 1.536.936.528 1.968.528 1.056 0 1.968-.528.936-.552 1.488-1.584.576-1.032.576-2.4m17.466-6.552V26h-2.736v-1.56q-.648.816-1.704 1.296a5.4 5.4 0 0 1-2.208.456q-1.56 0-2.808-.648-1.224-.648-1.944-1.92-.696-1.272-.696-3.072v-7.776h2.712v7.368q0 1.776.888 2.736.888.936 2.424.936t2.424-.936q.912-.96.912-2.736v-7.368zm5.002-1.752q-.744 0-1.248-.504a1.7 1.7 0 0 1-.504-1.248q0-.744.504-1.248a1.7 1.7 0 0 1 1.248-.504q.72 0 1.224.504t.504 1.248-.504 1.248a1.67 1.67 0 0 1-1.224.504m1.344 1.752V26h-2.736V12.776zm6.328-4.536V26h-2.736V8.24zm6.784 6.768v7.32q0 .744.336 1.08.36.312 1.2.312h1.68V26h-2.16q-1.848 0-2.832-.864t-.984-2.808v-7.32h-1.56v-2.232h1.56V9.488h2.76v3.288h3.216v2.232zm17.714-2.232V26h-2.736v-1.56q-.648.816-1.704 1.296a5.4 5.4 0 0 1-2.208.456q-1.56 0-2.808-.648-1.224-.648-1.944-1.92-.696-1.272-.696-3.072v-7.776h2.712v7.368q0 1.776.888 2.736.888.936 2.424.936t2.424-.936q.912-.96.912-2.736v-7.368zm5.002-1.752q-.744 0-1.248-.504a1.7 1.7 0 0 1-.504-1.248q0-.744.504-1.248a1.7 1.7 0 0 1 1.248-.504q.72 0 1.224.504t.504 1.248-.504 1.248a1.67 1.67 0 0 1-1.224.504m1.344 1.752V26h-2.736V12.776z"
                fill="#000"
              />
              <path
                d="m7.25 10.86 6 3.366 6-3.367m-12 20.176v-6.721l-6-3.367m24 0-6 3.367v6.72M1.61 14.42l11.64 6.54 11.64-6.54M13.25 34V20.947m12 5.18v-10.36c0-.454-.124-.9-.358-1.293a2.63 2.63 0 0 0-.975-.947l-9.333-5.18a2.73 2.73 0 0 0-2.667 0l-9.333 5.18a2.63 2.63 0 0 0-.976.947 2.54 2.54 0 0 0-.358 1.293v10.36c0 .454.124.9.358 1.293s.57.72.976.947l9.333 5.18a2.73 2.73 0 0 0 2.667 0l9.333-5.18a2.63 2.63 0 0 0 .975-.947 2.53 2.53 0 0 0 .358-1.293"
                stroke="#000"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg> */}
            {/* <img src="/logo.png" alt="logo" className="h-5" /> */}
            Relate
          </Link>

          <div className="hidden md:flex items-center  border border-zinc-100 rounded-full px-1 py-1 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => handleSelectTab(item.title)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${item.title === tabTitle ? "bg-white border border-zinc-200 font-medium text-zinc-800 hover:text-zinc-600" : "text-zinc-500 hover:text-zinc-400"}`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          <button className="hidden md:flex items-center gap-2.5 bg-linear-to-r from-zinc-950 to-zinc-500 text-zinc-50 hover:text-zinc-200 text-sm font-medium pl-5 pr-2 py-2 rounded-full cursor-pointer border-0">
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
