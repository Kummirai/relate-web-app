import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublication } from "@/lib/publications";
import BlockView from "@/components/magazine/BlockView";
import {
  formatDayHeader,
  fullDateLabel,
  formatWeekRange,
  shortWeekday,
} from "@/components/magazine/helpers";

export default async function DayReader({
  params,
}: {
  params: Promise<{ id: string; week: string; day: string }>;
}) {
  const { id, week: weekParam, day: dayParam } = await params;
  const pub = await getPublication(id);
  if (!pub) notFound();

  const weekIndex = Number(weekParam);
  const weeks = Array.isArray(pub.weeks) ? pub.weeks : [];
  const week = weeks.find((w) => w.index === weekIndex);
  if (!week) notFound();
  const day = week.days.find((d) => d.date === dayParam);
  if (!day) notFound();

  const dayIdx = week.days.indexOf(day);
  const prev = dayIdx > 0 ? week.days[dayIdx - 1] : null;
  const next = dayIdx < week.days.length - 1 ? week.days[dayIdx + 1] : null;
  const first = week.days[0]?.date;
  const last = week.days[week.days.length - 1]?.date;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:px-8">
      <nav className="mb-6 flex items-center justify-between text-sm text-[#6b7280]">
        <Link href={`/magazines/${pub.id}`} className="font-semibold text-[#15803d] hover:underline">
          ← {pub.title || "Back"}
        </Link>
        <span className="text-xs font-semibold text-slate-400">Day {day.day} of the season</span>
      </nav>

      {/* Verse / header card */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 text-center text-white shadow-sm"
        style={{ background: "linear-gradient(150deg, #14532d 0%, #166534 55%, #15803d 100%)" }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#16a34a]/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#ffc42e]/15 blur-3xl" />
        <p className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-[#bbf7d0]">
          {week.title}
        </p>
        <h1 className="relative z-10 mt-2 font-display text-2xl font-bold sm:text-3xl">{day.title}</h1>
        <p className="relative z-10 mt-2 text-sm font-medium text-white/70">
          {formatDayHeader(day.date)}
        </p>
        {day.verse?.text ? (
          <blockquote className="relative z-10 mx-auto mt-5 max-w-md">
            <p className="font-display text-xl italic leading-relaxed text-white">&ldquo;{day.verse.text}&rdquo;</p>
            {day.verse.by ? (
              <p className="mt-2 text-sm font-bold tracking-wide text-[#ffc42e]">{day.verse.by}</p>
            ) : null}
          </blockquote>
        ) : null}
      </div>

      {/* Week strip */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803d]">Week {week.index}</span>
          {first && last ? (
            <span className="text-xs font-medium text-[#6b7280]">{formatWeekRange(first, last)}</span>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {fullDateLabel(day.date)}
        </span>
      </div>

      {/* Day chips */}
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {week.days.map((d) => (
          <Link
            key={d.date}
            href={`/magazines/${pub.id}/${week.index}/${d.date}`}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-center transition ${
              d.date === day.date
                ? "bg-[#14532d]"
                : "bg-white hover:bg-[#f0fdf4]"
            }`}
          >
            <span className={`text-[9px] font-bold uppercase ${d.date === day.date ? "text-[#bbf7d0]" : "text-[#15803d]"}`}>
              {shortWeekday(d.date)}
            </span>
            <span className={`text-sm font-bold ${d.date === day.date ? "text-white" : "text-[#14532d]"}`}>
              {d.day}
            </span>
          </Link>
        ))}
      </div>

      {/* Content */}
      <article className="mt-6 rounded-3xl border border-white/70 bg-white px-6 py-6 shadow-sm sm:px-8">
        {day.blocks.length === 0 ? (
          <p className="text-sm italic text-slate-400">This day has no written read yet.</p>
        ) : (
          day.blocks.map((b, i) => <BlockView key={i} block={b} />)
        )}
      </article>

      {/* Prev / next */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={`/magazines/${pub.id}/${week.index}/${prev.date}`}
            className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm transition hover:border-[#16a34a]/40"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              ← {shortWeekday(prev.date)}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#14532d]">{prev.title || "Previous day"}</p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/magazines/${pub.id}/${week.index}/${next.date}`}
            className="rounded-2xl border border-white/70 bg-white p-4 text-right shadow-sm transition hover:border-[#16a34a]/40"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">{shortWeekday(next.date)} →</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#14532d]">{next.title || "Next day"}</p>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}