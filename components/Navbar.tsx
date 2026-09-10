"use client"

import {Roboto} from "next/font/google"
import {FaRegClock} from "react-icons/fa6"
import {BsTelephone} from "react-icons/bs"
import {FaFacebook, FaInstagramSquare} from "react-icons/fa"
import {LuMenu, LuX, LuChevronDown} from "react-icons/lu"
import {FaHeart} from "react-icons/fa6"
import Link from "next/link"
import {useState} from "react"

const roboto = Roboto({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

type NavItem = {link: string; path: string}
type NavGroup = {link: string; items: NavItem[]}

const navGroups: NavGroup[] = [
    {
        link: "Magazines", items: [
        {link: "All Magazines", path: "/magazines"},
        {link: "Relate", path: "/magazines?club=relate"},
        {link: "Sprout Kids", path: "/magazines?club=sprout-kids"},
        {link: "Surge Youth", path: "/magazines?club=surge"},
        {link: "Pulse", path: "/magazines?club=pulse"},
        {link: "Prime", path: "/magazines?club=prime"},
        {link: "Anchor", path: "/magazines?club=anchor"},
    ]},
    {
        link: "Explore", items: [
        {link: "Clubs", path: "/magazines"},
        {link: "Study Guides", path: "/magazines"},
        {link: "Calendar", path: "/magazines"},
    ]},
]

const flatLinks = [
    {link: "Home", path: "/"},
    ...navGroups.flatMap(g => g.items),
]

export default function Navbar({session}: {session?: {user?: {name?: string | null; role?: string | null}} | null}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const admin = session?.user?.role === "admin"

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => ({...prev, [name]: !prev[name]}))
    }

    return (
        <section className={"bg-green-700"}>
            <div className={"max-w-6xl mx-auto py-4 md:py-6 flex items-center justify-between px-4 md:px-0"}>
                <Link href={"/"} className={"text-gray-50 flex items-center gap-2"}>
                    <FaHeart className={"text-4xl md:text-5xl text-yellow-400 self-center"}/>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-semibold ${roboto.className} leading-5`}>RELATE</h1>
                        <p className={"text-xs md:text-sm text-gray-50"}>Family App</p>
                    </div>
                </Link>
                <nav
                    className={"hidden lg:flex items-center gap-6 xl:gap-10 text-gray-50 bg-green-600 py-2 px-4 xl:px-5"}>
                    <div className={"flex items-center gap-2 text-sm"}>
                        <FaRegClock className={"text-2xl xl:text-4xl shrink-0"}/>
                        <p className={"flex flex-col leading-4 xl:leading-5"}>
                            <span>Daily Prayer</span><span>Dawn to Dusk</span>
                        </p>
                    </div>
                    <div className={"flex items-center gap-2 text-sm"}>
                        <BsTelephone className={"text-2xl xl:text-4xl shrink-0"}/>
                        <p className={"flex flex-col leading-4 xl:leading-5"}>
                            <span>WhatsApp</span>                            <span>+27 78 267 7436</span>
                        </p>
                    </div>
                    <div className={"flex items-center gap-3"}>
                        {admin && (
                            <Link href={"/admin"} className={"text-xs font-semibold bg-white/15 px-3 py-1 rounded-full hover:bg-white/25 transition-colors"}>
                                Admin
                            </Link>
                        )}
                        <FaFacebook className={"text-xl xl:text-2xl"}/>
                        <FaInstagramSquare className={"text-xl xl:text-2xl"}/>
                    </div>
                </nav>
                <button onClick={() => setMenuOpen(true)}
                        className={"lg:hidden text-white p-2"}>
                    <LuMenu className={"text-3xl"}/>
                </button>
            </div>

            <header
                className={"max-w-6xl mx-auto hidden lg:flex items-center justify-between bg-green-800/40 backdrop-blur-xl relative z-50"}>
                <nav>
                    <ul className={"flex items-center gap-3 xl:gap-5 p-5 text-white whitespace-nowrap"}>
                        <li>
                            <Link href={"/"}
                                  className={"block text-sm xl:text-base hover:text-yellow-400 transition-colors"}>Home</Link>
                        </li>
                        {navGroups.map(group => (
                            <li key={group.link} className={"relative group"}>
                                <span
                                    className={"flex items-center gap-1 text-sm xl:text-base hover:text-yellow-400 transition-colors cursor-default"}>
                                    {group.link}
                                    <LuChevronDown className={"text-xs mt-0.5 group-hover:rotate-180 transition-transform"}/>
                                </span>
                                <div
                                    className={"absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"}>
                                    <div className={"bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-44"}>
                                        {group.items.map(item => (
                                            <Link key={item.path} href={item.path}
                                                  className={"block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"}>
                                                {item.link}
                                            </Link>
                                        ))}
                                        <div className={"border-t border-gray-100 my-1"}/>
                                        {admin && (
                                            <>
                                                <Link href={"/admin/magazines"}
                                                      className={"block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"}>
                                                    Manage Magazines
                                                </Link>
                                                <Link href={"/records"}
                                                      className={"block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"}>
                                                    Records
                                                </Link>
                                                <Link href={"/records/streaks"}
                                                      className={"block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"}>
                                                    Restore Streaks
                                                </Link>
                                                <Link href={"/admin/social-joins"}
                                                      className={"block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"}>
                                                    Social Joins
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                        <li>
                            <Link href={session ? "/magazines" : "/signin"}
                                  className={"block text-sm xl:text-base hover:text-yellow-400 transition-colors"}>
                                {session ? "Sign Out" : "Sign In"}
                            </Link>
                        </li>
                    </ul>
                </nav>
                <Link href={"/relate.apk"}
                      className={"p-5 h-full bg-yellow-400 text-green-900 font-semibold text-sm xl:text-base shrink-0"}>
                    Download the App
                </Link>
            </header>

            {menuOpen && (
                <div className={"fixed inset-0 z-50 bg-green-700 flex flex-col lg:hidden overflow-y-auto"}>
                    <div className={"flex items-center justify-between px-4 py-4"}>
                        <Link href={"/"} className={"text-gray-50 flex items-center gap-2"} onClick={() => setMenuOpen(false)}>
                            <FaHeart className={"text-4xl text-yellow-400 self-center"}/>
                            <div>
                                <h1 className={`text-2xl font-semibold ${roboto.className} leading-5`}>RELATE</h1>
                                <p className={"text-xs text-gray-50"}>Family App</p>
                            </div>
                        </Link>
                        <button onClick={() => setMenuOpen(false)} className={"text-white p-2"}>
                            <LuX className={"text-3xl"}/>
                        </button>
                    </div>

                    <nav className={"flex-1 flex flex-col items-center justify-center gap-5 py-8"}>
                        <Link href={"/"} onClick={() => setMenuOpen(false)}
                              className={"text-white text-2xl font-medium hover:text-yellow-400 transition-colors"}>
                            Home
                        </Link>
                        {navGroups.map(group => (
                            <div key={group.link} className={"w-full max-w-xs"}>
                                <button
                                    onClick={() => toggleGroup(group.link)}
                                    className={"w-full flex items-center justify-center gap-2 text-white text-2xl font-medium hover:text-yellow-400 transition-colors"}>
                                    {group.link}
                                    <LuChevronDown
                                        className={`text-lg transition-transform duration-200 ${expandedGroups[group.link] ? "rotate-180" : ""}`}/>
                                </button>
                                {expandedGroups[group.link] && (
                                    <div className={"flex flex-col items-center gap-3 mt-3"}>
                                        {group.items.map(item => (
                                            <Link key={item.path} href={item.path}
                                                  onClick={() => setMenuOpen(false)}
                                                  className={"text-white/80 text-lg hover:text-yellow-400 transition-colors"}>
                                                {item.link}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {admin && (
                            <Link href={"/admin"} onClick={() => setMenuOpen(false)}
                                  className={"text-white text-2xl font-medium hover:text-yellow-400 transition-colors"}>
                                Admin
                            </Link>
                        )}
                        <Link href={session ? "/magazines" : "/signin"} onClick={() => setMenuOpen(false)}
                              className={"text-white text-2xl font-medium hover:text-yellow-400 transition-colors"}>
                            {session ? "Sign Out" : "Sign In"}
                        </Link>
                        {session ? null : (
                            <Link href={"/signup"} onClick={() => setMenuOpen(false)}
                                  className={"mt-4 bg-yellow-400 text-green-900 px-10 py-3 text-lg font-semibold"}>
                                Create Account
                            </Link>
                        )}
                        <Link href={"/relate.apk"} onClick={() => setMenuOpen(false)}
                              className={"mt-4 bg-yellow-400 text-green-900 px-10 py-3 text-lg font-semibold"}>
                            Download the App
                        </Link>
                    </nav>

                    <div className={"flex items-center justify-center gap-3 text-white pb-8"}>
                        <FaFacebook className={"text-2xl"}/>
                        <FaInstagramSquare className={"text-2xl"}/>
                    </div>
                </div>
            )}
        </section>
    )
}