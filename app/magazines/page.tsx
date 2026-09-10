import Link from "next/link";
import { listPublications } from "@/lib/publications";
import { CLUBS } from "@/lib/catalog";
import MagazineCard from "@/components/magazine/MagazineCard";

export const metadata = { title: "Magazines — Relate" };

export default async function MagazinesPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const { club } = await searchParams;
  const active = club || "all";
  const pubs = await listPublications({ club: active === "all" ? undefined : active });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#15803d]">Library</p>
        <h1 className="font-display text-4xl font-bold text-[#14532d]">Magazines</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Seasonal study guides and bulletins for every club. Pick your stage of life and start reading.
        </p>
      </div>

      {/* Club filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[{ slug: "all", name: "All" }, { slug: "relate", name: "Relate" }, ...CLUBS].map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={isActive ? "/magazines" : `/magazines?club=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#14532d] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-[#6b7280] hover:border-[#16a34a]/50 hover:text-[#14532d]"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {pubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <p className="text-sm text-[#6b7280]">
            {active === "all" ? "No magazines released yet — check back soon." : "No magazines for this club yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pubs.map((pub) => (
            <MagazineCard key={pub.id} pub={pub} />
          ))}
        </div>
      )}
    </div>
  );
}