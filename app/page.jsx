import Link from "next/link";
import { FaBookOpen } from "react-icons/fa";
import { listPublications } from "@/lib/publications";
import { CLUBS } from "@/lib/catalog";
import MagazineCard from "@/components/magazine/MagazineCard";

export const metadata = {
  title: "Relate — Grow in Every Area of Life",
  description:
    "Prayer times, Bible reading, community groups, skills training, magazines and more. Download the Relate app.",
};

export default async function Home() {
  const latest = await listPublications({ limit: 3 });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1428 0%, #1d2a4d 45%, #2a4070 100%)" }}
      >
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#13c5dd]/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-[#ffc42e]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><circle cx=%222%22 cy=%222%22 r=%221%22 fill=%22white%22 fill-opacity=%220.06%22/></svg>')]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28 lg:py-32">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#67e3f5] ring-1 ring-white/20">
            <FaBookOpen className="h-3.5 w-3.5" />
            Magazines · Prayer · Community
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Grow in every
            <br />
            area of <span className="text-[#ffc42e]">life</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Prayer times, daily Bible reading, seasonal study guides, community groups and skills
            training — all in one place.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/magazines"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ffc42e] px-6 py-3.5 text-sm font-bold text-[#1d2a4d] transition hover:bg-[#ffd24f]"
            >
              Start reading
            </Link>
            <a
              href="/relate.apk"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"
            >
              Download the app
            </a>
          </div>
          <p className="mt-3 text-xs text-white/50">Android APK · iOS coming soon</p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
            {[
              { n: `${CLUBS.length}`, label: "Clubs" },
              { n: `${latest.length}`, label: "Magazines" },
              { n: "91", label: "Day season guide" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 sm:px-8 sm:py-4"
              >
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">{s.n}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 sm:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest magazines */}
      {latest.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0fa3c4]">Fresh off the press</p>
              <h2 className="font-display text-3xl font-bold text-[#1d2a4d]">Latest magazines</h2>
            </div>
            <Link href="/magazines" className="text-sm font-semibold text-[#0fa3c4] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((pub) => (
              <MagazineCard key={pub.id} pub={pub} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Browse by club */}
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0fa3c4]">Find your people</p>
            <h2 className="font-display text-3xl font-bold text-[#1d2a4d]">Browse by club</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7a8d]">
              Every club has its own magazines, chat and daily reading.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CLUBS.map((c) => (
              <Link
                key={c.slug}
                href={`/magazines?club=${c.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-[#eff5f9] px-4 py-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
                  style={{ background: c.color }}
                >
                  {c.name.charAt(0)}
                </div>
                <p className="text-sm font-bold text-[#1d2a4d] group-hover:text-[#0fa3c4]">{c.name}</p>
                {c.tagline ? <p className="mt-1 text-xs text-[#6b7a8d]">{c.tagline}</p> : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="px-4 py-16 text-center sm:px-6 md:py-24"
        style={{ background: "linear-gradient(135deg, #1d2a4d 0%, #151f3a 100%)" }}
      >
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Put it in your pocket</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
          Prayer times, streaks, club chat and offline reading in the Relate app.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/relate.apk"
            className="inline-flex items-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#25D366" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
            </svg>
            <span className="text-left">
              <span className="block text-[10px] leading-none opacity-80">GET IT ON</span>
              <span className="block text-sm font-bold">Android</span>
            </span>
          </a>
        </div>
        <p className="mt-3 text-xs text-white/40">iOS coming soon</p>
      </section>
    </div>
  );
}