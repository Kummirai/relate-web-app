"use client";

import { useEffect } from "react";
import { emptyReading } from "@/lib/season";
import type { PubBlock, ReadingStructure } from "@/lib/season";

/**
 * App-styled previews of a study day's READ content.
 *
 * `ReadPreview` is a live phone-frame rendering of the structured READ
 * (intro → body → conclusion) that updates as the writer types. `DayPreviewModal`
 * shows the whole day read-only — VERSE, READ, REFLECT and RESPOND — mirroring
 * how the mobile reader (frontend/src/app/library/[slug]/day.tsx) renders it.
 */

const EYEBROW = "#13c5dd";

function emptyText() {
  return emptyReading();
}

function isInteractive(b: PubBlock) {
  return b.type === "checklist" || b.type === "quiz" || b.type === "reflection" || b.type === "pray";
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
}

function SectionHead({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) {
  return (
    <div className="mb-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: EYEBROW }}>
        {eyebrow}
      </p>
      <h4 className="mt-1 text-lg font-bold leading-tight" style={{ color: accent }}>
        {title}
      </h4>
    </div>
  );
}

function ReadingText({ structure }: { structure: ReadingStructure }) {
  const s = structure ?? emptyText();
  const intro = s.intro ?? emptyText().intro;
  const body = s.body ?? [];
  const conclusion = s.conclusion ?? emptyText().conclusion;
  return (
    <div>
      {intro.hook ? <p className="mb-1.5 text-[13px] leading-5 text-slate-700">{intro.hook}</p> : null}
      {intro.thesis ? <p className="mb-1.5 text-[13px] leading-5 text-slate-700">{intro.thesis}</p> : null}
      {body.map((item, j) => (
        <div key={j} className="mb-1.5">
          {item.topic ? <p className="text-[13px] leading-5 text-slate-700">{item.topic}</p> : null}
          {item.support.length ? (
            <p className="mt-1 text-[13px] leading-5 text-slate-500">{item.support.join(" ")}</p>
          ) : null}
        </div>
      ))}
      {conclusion.restate ? <p className="mb-1.5 text-[13px] leading-5 text-slate-700">{conclusion.restate}</p> : null}
      {conclusion.whyItMatters ? (
        <p className="mb-1.5 text-[13px] leading-5 text-slate-700">{conclusion.whyItMatters}</p>
      ) : null}
      {conclusion.closing ? (
        <p className="mb-1.5 text-[13px] italic leading-5 text-slate-700">{conclusion.closing}</p>
      ) : null}
    </div>
  );
}

function Block({ b }: { b: PubBlock }) {
  switch (b.type) {
    case "paragraph":
      return <p className="mb-1.5 text-[13px] leading-5 text-slate-700">{b.text}</p>;
    case "heading":
      return <h4 className="mb-1 mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">{b.text}</h4>;
    case "quote":
      return (
        <blockquote className="mb-1.5 border-l-4 pl-3 text-[13px] italic leading-5 text-slate-700" style={{ borderLeftColor: EYEBROW }}>
          {b.text}
          {b.by ? <footer className="mt-1 text-[11px] not-italic text-slate-400">— {b.by}</footer> : null}
        </blockquote>
      );
    case "list":
      return (
        <ul className="mb-1.5 space-y-1">
          {(b.items || []).map((item, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-5 text-slate-700">
              <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: EYEBROW }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "reading":
      return <ReadingText structure={b.structure ?? emptyText()} />;
    case "checklist":
      return (
        <div className="mb-1.5 rounded-xl bg-slate-50 p-3">
          {b.title ? <p className="mb-2 text-[12px] font-bold text-slate-700">{b.title}</p> : null}
          <ul className="space-y-1.5">
            {(b.items || []).map((item, i) => (
              <li key={i} className="flex gap-2 text-[12px] text-slate-600">
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-slate-300 bg-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "quiz":
      return (
        <div className="mb-1.5 rounded-xl bg-slate-50 p-3">
          <p className="mb-2 text-[12px] font-bold text-slate-700">{b.question}</p>
          <ul className="space-y-1.5">
            {(b.options || []).map((opt, i) => (
              <li key={i} className="flex gap-2 text-[12px] text-slate-600">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300 bg-white" />
                {opt}
              </li>
            ))}
          </ul>
        </div>
      );
    case "reflection":
      return (
        <div className="mb-1.5 rounded-xl bg-slate-50 p-3">
          <p className="text-[12px] italic text-slate-600">“{b.prompt}”</p>
          <div className="mt-2 flex h-10 items-center rounded-lg border border-dashed border-slate-300 px-2 text-[11px] text-slate-400">
            {b.placeholder || "Write your answer…"}
          </div>
        </div>
      );
    case "pray":
      return (
        <div className="mb-1.5 rounded-xl bg-slate-50 p-3">
          <p className="mb-2 text-[12px] font-bold text-slate-700">{b.title || "Pray"}</p>
          <ul className="space-y-1.5">
            {(b.items || []).map((item, i) => (
              <li key={i} className="flex gap-2 text-[12px] text-slate-600">
                <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: EYEBROW }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    default:
      return null;
  }
}

/** Live phone-frame preview of the structured READ section for one day. */
export function ReadPreview({ structure, accent }: { structure: ReadingStructure; accent: string }) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <SectionHead eyebrow="READ" title="The reading" accent={accent} />
      </div>
      <div className="px-4 pb-4">
        <ReadingText structure={structure} />
      </div>
    </div>
  );
}

/** Read-only collection of data needed to render a day in the preview. */
export type DayPreviewData = {
  title: string;
  weekday: string;
  date: string;
  verse?: { text: string; by?: string } | null;
  blocks: PubBlock[];
};

/** Full-day preview: VERSE → READ → REFLECT → RESPOND, read-only. */
export function DayPreview({ day, accent }: { day: DayPreviewData; accent: string }) {
  const readBlocks = day.blocks.filter((b) => !isInteractive(b));
  const reflectBlocks = day.blocks.filter((b) => b.type === "checklist" || b.type === "quiz" || b.type === "reflection");
  const prayBlocks = day.blocks.filter((b) => b.type === "pray");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          {day.weekday || "—"} · {day.date ? formatDate(day.date) : "no date"}
        </p>
        <h3 className="flex-1 truncate text-sm font-bold text-slate-800">{day.title || "Untitled day"}</h3>
      </div>

      <div className="px-4 py-4">
        <SectionHead eyebrow="VERSE" title="Today's verse" accent={accent} />
        <div className="mb-6 rounded-xl border-l-4 bg-white p-3.5 ring-1 ring-slate-100" style={{ borderLeftColor: accent }}>
          <p className="text-[14px] leading-6">“{day.verse?.text || "No verse set"}”</p>
          {day.verse?.by ? <p className="mt-1.5 text-[11px] text-slate-400">— {day.verse.by}</p> : null}
        </div>

        <SectionHead eyebrow="READ" title="The reading" accent={accent} />
        {readBlocks.length === 0 ? (
          <p className="text-[13px] text-slate-400">No reading content yet.</p>
        ) : (
          readBlocks.map((b, i) => <Block key={i} b={b} />)
        )}

        {reflectBlocks.length ? (
          <div className="mt-6">
            <SectionHead eyebrow="REFLECT" title="Think it over" accent={accent} />
            {reflectBlocks.map((b, i) => <Block key={i} b={b} />)}
          </div>
        ) : null}

        {prayBlocks.length ? (
          <div className="mt-6">
            <SectionHead eyebrow="RESPOND" title="Respond & share" accent={accent} />
            {prayBlocks.map((b, i) => <Block key={i} b={b} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Full-day preview modal: VERSE → READ → REFLECT → RESPOND, read-only. */
export function DayPreviewModal({
  open,
  onClose,
  day,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  day: DayPreviewData | null;
  accent: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !day) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="mx-auto my-8 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <DayPreview day={day} accent={accent} />
        <button
          onClick={onClose}
          className="w-full border-t border-slate-100 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close preview
        </button>
      </div>
    </div>
  );
}