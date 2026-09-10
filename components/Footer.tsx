"use client"

import Link from "next/link"
import {Roboto} from "next/font/google";
import {FaFacebook, FaInstagramSquare, FaTwitter, FaAndroid} from "react-icons/fa";
import {LuMapPin, LuPhone, LuMail, LuClock} from "react-icons/lu";

const roboto = Roboto({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function Footer() {
    return (
        <footer className={"bg-green-950 text-green-200 px-4"}>
            <div className={"max-w-6xl mx-auto py-16"}>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"}>
                    <div>
                        <h3 className={`text-2xl font-semibold text-white ${roboto.className} mb-4`}>RELATE</h3>
                        <p className={"text-sm leading-relaxed mb-4"}>
                            Prayer times, daily Bible reading, seasonal study guides and family clubs — growing in faith together.
                        </p>
                        <div className={"flex items-center gap-3"}>
                            <FaFacebook className={"hover:text-yellow-400 cursor-pointer transition-colors"}/>
                            <FaTwitter className={"hover:text-yellow-400 cursor-pointer transition-colors"}/>
                            <FaInstagramSquare className={"hover:text-yellow-400 cursor-pointer transition-colors"}/>
                        </div>
                    </div>
                    <div>
                        <h4 className={"text-white font-semibold mb-4"}>Quick Links</h4>
                        <ul className={"space-y-2 text-sm"}>
                            {[
                                {label: "Magazines", path: "/magazines"},
                                {label: "Browse Clubs", path: "/magazines"},
                                {label: "Study Guides", path: "/magazines"},
                                {label: "Admin", path: "/admin"},
                                {label: "Sign In", path: "/signin"},
                                {label: "Create Account", path: "/signup"},
                            ].map((link, i) => (
                                <li key={i}>
                                    <Link href={link.path}
                                          className={"hover:text-yellow-400 transition-colors"}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className={"text-white font-semibold mb-4"}>Contact Info</h4>
                        <ul className={"space-y-3 text-sm"}>
                            <li className={"flex items-start gap-2"}>
                                <LuMapPin className={"mt-1 shrink-0 text-yellow-400"}/>
                                <span>Our community is online, everywhere</span>
                            </li>
                            <li className={"flex items-center gap-2"}>
                                <LuPhone className={"shrink-0 text-yellow-400"}/>
                                <span>+27 78 267 7436</span>
                            </li>
                            <li className={"flex items-center gap-2"}>
                                <LuMail className={"shrink-0 text-yellow-400"}/>
                                <span>hello@relate.app</span>
                            </li>
                            <li className={"flex items-start gap-2"}>
                                <LuClock className={"mt-1 shrink-0 text-yellow-400"}/>
                                <span>Prayer reminders · Dawn to Dusk</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className={"text-white font-semibold mb-4"}>Get the App</h4>
                        <p className={"text-sm leading-relaxed mb-4"}>
                            Prayer times, streaks, club chat and offline reading — available on Android now.
                        </p>
                        <Link href={"/relate.apk"}
                              className={"inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-5 py-3 text-sm font-semibold hover:bg-yellow-500 transition-colors"}>
                            <FaAndroid className={"text-xl"}/>
                            Download for Android
                        </Link>
                    </div>
                </div>
            </div>
            <div className={"border-t border-green-800 py-6 text-center text-sm"}>
                <p>&copy; {new Date().getFullYear()} Relate. Grow together.</p>
            </div>
        </footer>
    )
}