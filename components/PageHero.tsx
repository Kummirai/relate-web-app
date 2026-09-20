"use client";

import type { ReactNode } from "react";

import Navbar from "./Navbar";

type Chip = { dot?: boolean; label: string };
type MetaItem = { label: string; value: ReactNode };

type PageHeroProps = {
    title: string;
    tagline?: string;
    description?: string;
    watermark?: string;
    chips?: Chip[];
    actions?: ReactNode;
    meta?: MetaItem[];
    metaEnd?: ReactNode;
    titleSize?: string;
    extra?: ReactNode;
    /** Optional full-bleed photo background (fades to dark on the left for text legibility). */
    bgImage?: string;
    /** Optional pill pinned to the far right of the chips row (like the homepage carousel). */
    chipsEnd?: ReactNode;
    /** The root layout renders the navbar on light pages; heroes embed an overlay variant. */
    session?: { user?: { name?: string | null; role?: string | null } } | null;
};

export default function PageHero({ title, tagline, description, watermark, chips = [], actions, meta, metaEnd, titleSize = "clamp(3rem, 10vw, 7.5rem)", extra, bgImage, chipsEnd, session }: PageHeroProps) {
    const showMetaBar = (meta?.length ?? 0) > 0 || metaEnd;

    return (
        <section
            className={"relative min-h-screen w-full overflow-hidden"}
            style={
                bgImage
                    ? {
                        backgroundImage: `linear-gradient(100deg, rgba(21,31,58,0.97) 0%, rgba(21,31,58,0.9) 45%, rgba(21,31,58,0.55) 75%, rgba(21,31,58,0.35) 100%), url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }
                    : { background: "linear-gradient(115deg, #1d2a4d 0%, #151f3a 55%, #2a4070 100%)" }
            }
        >
            <Navbar overlay session={session} />

            {/* Ambient decoration */}
            <div className={"absolute -top-32 -right-24 size-96 rounded-full blur-3xl opacity-30 bg-cyan"} />
            <div className={"absolute bottom-10 -left-24 size-96 rounded-full blur-3xl opacity-20 bg-cyan"} />
            <div className={"absolute -right-20 -top-28 size-[30rem] rounded-full border border-cyan/30"} />
            <div className={"absolute -right-12 -top-20 size-[21rem] rounded-full border border-cyan/20"} />
            {watermark && (
                <div className={"absolute bottom-0 right-4 hidden pb-0.5 select-none md:block"}>
                    <span
                        className={"block font-black leading-none tracking-tighter text-cyan"}
                        style={{ fontSize: "clamp(9rem, 24vw, 16rem)", opacity: 0.14 }}
                    >
                        {watermark}
                    </span>
                </div>
            )}

            <div className={"relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 min-h-screen flex flex-col justify-center py-24"}>
                <div className={"flex flex-col gap-5 md:gap-6"}>
                    <div className={"flex flex-wrap items-center gap-3"}>
                        {chips.map((chip, i) => (
                            <span
                                key={i}
                                className={"inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest text-white/90 font-medium"}
                            >
                                {chip.dot && <span className={"size-2 rounded-full bg-cyan"} />}
                                {chip.label}
                            </span>
                        ))}
                        {chipsEnd && (
                            <span className={"ml-auto inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-[11px] tracking-wide text-white/90 font-medium"}>
                                {chipsEnd}
                            </span>
                        )}
                        {chips.length === 0 && !chipsEnd && <span aria-hidden className={"h-[30px]"} />}
                    </div>

                    <h1 className={"font-black tracking-tight leading-none text-white"} style={{ fontSize: titleSize }}>
                        {title}
                    </h1>
                    {tagline && (
                        <p className={"text-xl md:text-2xl font-medium text-cyan-light"}>{tagline}</p>
                    )}
                    {description && (
                        <p className={"max-w-xl text-sm md:text-base text-white/80 leading-relaxed"}>{description}</p>
                    )}

                    {actions && (
                        <div className={"flex flex-wrap items-center gap-3 mt-2"}>{actions}</div>
                    )}

                    {showMetaBar && (
                        <div className={"mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm"}>
                            {meta?.map((m) => (
                                <div key={m.label}>
                                    <span className={"block text-[11px] uppercase tracking-widest text-white/70 mb-0.5"}>{m.label}</span>
                                    <span className={"font-semibold text-white"}>{m.value}</span>
                                </div>
                            ))}
                            {metaEnd && <div className={"ml-auto flex flex-wrap items-center gap-x-8 gap-y-2"}>{metaEnd}</div>}
                        </div>
                    )}

                    {extra}
                </div>
            </div>
        </section>
    );
}
