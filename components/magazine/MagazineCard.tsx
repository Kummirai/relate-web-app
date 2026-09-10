import Link from "next/link";
import { formatWeekRange, coverGradient } from "./helpers";

type CoverPub = {
  id: string;
  title?: string;
  kind?: string;
  series?: string;
  clubSlug?: string;
  year?: number;
  issue?: string;
  cover?: string;
  coverLines?: string[];
  theme?: string;
  season?: { label?: string; start?: string; end?: string };
  summary?: string;
  status?: string;
};

export function CoverImage({ pub, className = "" }: { pub: CoverPub; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className || "h-52"}`}
      style={pub.cover ? undefined : { background: coverGradient(pub.theme || pub.title) }}
    >
      {pub.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pub.cover} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#67e3f5]">
              {(pub.series || "Relate") + (pub.year ? ` · ${pub.year}` : "")}
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
              {pub.kind === "bulletin" ? "Bulletin" : "Magazine"}
            </span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold leading-tight text-white">
              {pub.title || "Relate"}
            </h3>
            {(pub.coverLines || []).slice(0, 2).map((line, i) => (
              <p
                key={i}
                className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  i === 0 ? "text-[#ffc42e]" : "text-white/70"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MagazineCard({ pub }: { pub: CoverPub }) {
  const href = `/magazines/${pub.id}`;
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <CoverImage pub={pub} />
      <div className="p-4">
        {(pub.season?.label || pub.issue) ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0fa3c4]">
            {pub.season?.label || pub.issue}
          </p>
        ) : null}
        <h3 className="mt-1 font-display text-xl font-bold text-[#1d2a4d] group-hover:text-[#13c5dd]">
          {pub.title || pub.id}
        </h3>
        {pub.summary ? (
          <p className="mt-1 line-clamp-2 text-sm text-[#6b7a8d]">{pub.summary}</p>
        ) : null}
        {pub.season?.start && pub.season?.end ? (
          <p className="mt-2 text-xs font-semibold text-[#6b7a8d]">
            {formatWeekRange(pub.season.start, pub.season.end)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}