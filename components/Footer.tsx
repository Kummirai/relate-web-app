"use client";

import Link from "next/link";
import { FaGraduationCap, FaFacebook, FaInstagramSquare } from "react-icons/fa6";
import { LuMapPin, LuPhone, LuMail } from "react-icons/lu";

export default function Footer() {
    return (
        <footer className="bg-navy text-white px-4">
            <div className="max-w-6xl mx-auto py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FaGraduationCap className="text-4xl text-cyan" />
                            <div className="leading-none">
                                <p className="text-2xl font-extrabold tracking-tight leading-none">
                                    Relate<span className="text-cyan font-black">World</span>
                                </p>
                                <p className="text-[9px] uppercase tracking-[0.35em] text-white/60 mt-1.5">Grow · Belong · Become</p>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Skills, social and spiritual growth — all in one community. Free clubs for every age and season of life.
                        </p>
                        <div className="flex items-center gap-3 mt-5 text-white/80">
                            <FaFacebook className="text-xl hover:text-cyan transition-colors cursor-pointer" />
                            <FaInstagramSquare className="text-xl hover:text-cyan transition-colors cursor-pointer" />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Quick Links</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/" className="text-white/80 hover:text-cyan transition-colors">Home</Link></li>
                            <li><Link href="/magazines" className="text-white/80 hover:text-cyan transition-colors">Magazines</Link></li>
                            <li><Link href="/signin" className="text-white/80 hover:text-cyan transition-colors">Sign in</Link></li>
                            <li><Link href="/signup" className="text-white/80 hover:text-cyan transition-colors">Create account</Link></li>
                            <li><Link href="/relate.apk" className="text-white/80 hover:text-cyan transition-colors">Download the App</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm text-white/80">
                            <li className="flex items-center gap-2.5">
                                <LuPhone className="text-cyan shrink-0" />
                                <a href="https://wa.me/27782677436" className="hover:text-cyan transition-colors">+27 78 267 7436</a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuMail className="text-cyan shrink-0" />
                                <a href="mailto:info@relateworld.app" className="hover:text-cyan transition-colors">info@relateworld.app</a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuMapPin className="text-cyan shrink-0" />
                                Weekly club meetups · Saturdays &amp; evenings
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">The App</h4>
                        <p className="text-sm text-white/70 leading-relaxed mb-4">
                            Prayer times, daily verses, reading guides and your club — in your pocket.
                        </p>
                        <a
                            href="/relate.apk"
                            className="inline-flex items-center gap-2 bg-cyan text-navy px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-cyan-dark transition-colors"
                        >
                            Get the APK
                        </a>
                    </div>
                </div>

                <div className="border-t border-white/15 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-white/50">© {new Date().getFullYear()} Relate. All rights reserved.</p>
                    <p className="text-xs text-white/50">100% free to join · Powered by community</p>
                </div>
            </div>
        </footer>
    );
}
