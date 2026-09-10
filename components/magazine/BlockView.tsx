import { formatShortRange } from "@/lib/season";
import type { PubBlock } from "@/lib/season";

/**
 * Renders a stored block for the public site (read-only). Interactive block
 * types (checklist, quiz, reflection, pray) render their static prompt so the
 * reader can fill them in offline — submissions live in the app.
 */
export default function BlockView({ block }: { block: PubBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="pt-2 font-display text-2xl font-bold text-[#1d2a4d]">
          {block.text}
        </h3>
      );
    case "quote":
      return (
        <figure className="my-4 rounded-2xl border-l-4 border-[#13c5dd] bg-white px-5 py-4 shadow-sm">
          <blockquote className="text-lg italic leading-relaxed text-[#1d2a4d]">
            &ldquo;{block.text}&rdquo;
          </blockquote>
          {block.by ? (
            <figcaption className="mt-2 text-sm font-semibold text-[#0fa3c4]">— {block.by}</figcaption>
          ) : null}
        </figure>
      );
    case "image":
      return (
        <figure className="my-4 overflow-hidden rounded-2xl shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.uri} alt={block.caption || ""} className="w-full" />
          {block.caption ? (
            <figcaption className="border-t border-slate-100 bg-white px-4 py-2 text-sm text-[#6b7a8d]">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "list":
      return (
        <ul className="my-3 space-y-2">
          {(block.items || []).map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#13c5dd]" />
              <span className="text-[15px] leading-relaxed text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "checklist":
      return (
        <div className="my-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Try this</p>
          {block.title ? <h4 className="mb-2 font-display text-lg font-bold text-[#1d2a4d]">{block.title}</h4> : null}
          <ul className="space-y-2">
            {(block.items || []).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#13c5dd]/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "quiz":
      return (
        <div className="my-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Remembers</p>
          <p className="text-[16px] font-semibold text-[#1d2a4d]">{block.question}</p>
          <div className="mt-3 space-y-2">
            {(block.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[#eff5f9] px-4 py-2.5 text-sm text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0fa3c4] ring-1 ring-slate-200">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </div>
            ))}
          </div>
        </div>
      );
    case "reflection":
      return (
        <div className="my-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Reflect</p>
          <p className="text-[16px] text-slate-700">{block.prompt}</p>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-[#eff5f9] px-4 py-3 text-sm text-slate-400">
            {block.placeholder || "Write your thoughts here…"}
          </div>
        </div>
      );
    case "pray":
      return (
        <div className="my-4 rounded-2xl border-l-4 border-[#ffc42e] bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#e6a800]">Pray</p>
          {block.title ? <h4 className="font-display text-lg font-bold text-[#1d2a4d]">{block.title}</h4> : null}
          <ul className="mt-2 space-y-2">
            {(block.items || []).map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffc42e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "paragraph":
    default:
      return (
        <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{block.text}</p>
      );
  }
}

export function formatVerse(verseBy?: string): string {
  return verseBy || "";
}

export function seasonLabel(start?: string, end?: string): string {
  if (!start || !end) return "";
  return formatShortRange(start, end);
}