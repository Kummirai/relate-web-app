import { LuChevronRight } from "react-icons/lu";
import Link from "next/link";

type Publication = {
    id?: string;
    title?: string;
    summary?: string;
    cover?: string;
    kind?: string;
    clubSlug?: string;
    season?: { label?: string; name?: string; year?: number };
    updatedAt?: Date | string;
};

const TAG_STYLES = "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ice-blue text-navy";

/**
 * Community news strip fed by the backend's real published magazines/bulletins.
 * Falls back to a friendly empty state when nothing is published yet.
 */
export default function NewsHighlights({ publications = [] }: { publications?: Publication[] }) {
    const posts = publications.slice(0, 3);

    return (
        <section className="py-16 md:py-20 bg-alice-blue/60 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan mb-1">Fresh from the community</p>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-navy">Latest Guides &amp; News</h2>
                    </div>
                    <Link
                        href="/magazines"
                        className="text-sm text-cyan-dark font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        View all <LuChevronRight />
                    </Link>
                </div>

                {posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
                        <p className="text-sm text-slate-gray">New magazines and bulletins will appear here once published.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {posts.map((p, i) => (
                            <Link
                                key={p.id ?? i}
                                href={`/magazines/${p.id}`}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                            >
                                {p.cover && (
                                    <div className="h-40 overflow-hidden bg-alice-blue">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={p.cover} alt={p.title ?? "Publication"} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1">
                    <span className={TAG_STYLES + " mb-3 self-start"}>
                        {p.kind === "bulletin" ? "Bulletin" : p.season?.label || "Reading Guide"}
                    </span>
                                    <h3 className="text-base font-bold text-navy mb-2 leading-snug">{p.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-3 flex-1 line-clamp-3">{p.summary}</p>
                                    <p className="text-xs text-gray-400 mt-auto">
                                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
