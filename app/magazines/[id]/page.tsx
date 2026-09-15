import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublication } from "@/lib/publications";
import { clubName } from "@/lib/catalog";
import { CoverImage } from "@/components/magazine/MagazineCard";
import BlockView from "@/components/magazine/BlockView";
import { formatWeekRange, shortWeekday } from "@/components/magazine/helpers";

const PUBLIC_BASE_URL = process.env.BETTER_AUTH_URL || "https://relate-iota.vercel.app";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const pub = await getPublication(id);
  if (!pub) return { title: "Magazine — Relate" };
  const title = pub.title ? `${pub.title} — Relate` : "Magazine — Relate";
  const url = `${PUBLIC_BASE_URL}/magazines/${id}`;
  const og = pub.cover ? [{ url: pub.cover, alt: pub.title || "Relate magazine" }] : undefined;
  return {
    title,
    description: pub.summary || undefined,
    openGraph: { title, description: pub.summary || undefined, type: "article", url, images: og },
    twitter: { card: og ? "summary_large_image" : "summary", title, description: pub.summary || undefined },
  };
}

export default async function MagazineReader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pub = await getPublication(id);
  if (!pub) notFound();

  const weeks = Array.isArray(pub.weeks) ? pub.weeks : [];
  const tags = Array.isArray(pub.tags) ? pub.tags : [];
  const blocks = Array.isArray(pub.blocks) ? pub.blocks : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:px-8">
      <nav className="mb-6 text-sm text-[#6b7280]">
        <Link href="/magazines" className="font-semibold text-[#15803d] hover:underline">
          Magazines
        </Link>
        <span className="mx-2">/</span>
        <span>{pub.title || pub.id}</span>
      </nav>

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm">
        <CoverImage pub={pub} className="h-64 sm:h-80" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#14532d]/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#14532d] ring-1 ring-[#14532d]/10">
              {clubName(pub.clubSlug)}
            </span>
            {pub.season?.label ? (
              <span className="rounded-full bg-[#16a34a]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#15803d]">
                {pub.season.label}
              </span>
            ) : null}
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                #{t}
              </span>
            ))}
          </div>

          {blocks.length > 0 ? (
            <div className="mt-5 space-y-1">{blocks.map((b, i) => <BlockView key={i} block={b} />)}</div>
          ) : null}
        </div>
      </div>

      {weeks.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-[#14532d]">The study guide</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            {weeks.length} weeks · one short read a day. Tap a day to open it.
          </p>
          <div className="mt-5 space-y-4">
            {weeks.map((week) => {
              const first = week.days?.[0]?.date;
              const last = week.days?.[week.days.length - 1]?.date;
              return (
                <div key={week.index} className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[#14532d]">
                      {week.title || `Week ${week.index}`}
                    </h3>
                    {first && last ? (
                      <span className="text-xs font-semibold text-[#6b7280]">{formatWeekRange(first, last)}</span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {week.days.map((day) => (
                      <Link
                        key={day.date}
                        href={`/magazines/${pub.id}/${week.index}/${day.date}`}
                        className="group flex flex-col items-center gap-0.5 rounded-xl bg-[#f0fdf4] px-0.5 py-2 transition hover:bg-[#14532d]"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#15803d] group-hover:text-[#bbf7d0]">
                          {shortWeekday(day.date)}
                        </span>
                        <span className="text-sm font-bold text-[#14532d] group-hover:text-white">{day.day}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}