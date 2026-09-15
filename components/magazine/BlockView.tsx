import { emptyReading, formatShortRange } from "@/lib/season";
import type { PubBlock, ReadingMedia, ReadingStructure } from "@/lib/season";

/**
 * Renders a stored block for the public site (read-only). Interactive block
 * types (checklist, quiz, reflection, pray) render their static prompt so the
 * reader can fill them in offline — submissions live in the app.
 */
export default function BlockView({ block }: { block: PubBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="pt-2 font-display text-2xl font-bold text-[#14532d]">
          {block.text}
        </h3>
      );
    case "quote":
      return (
        <figure className="my-4 rounded-2xl border-l-4 border-[#16a34a] bg-white px-5 py-4 shadow-sm">
          <blockquote className="text-lg italic leading-relaxed text-[#14532d]">
            &ldquo;{block.text}&rdquo;
          </blockquote>
          {block.by || block.source ? (
            <figcaption className="mt-2 text-sm font-semibold text-[#15803d]">
              {block.by ? `— ${block.by}` : ""}
              {block.source ? ` · ${block.source}` : ""}
            </figcaption>
          ) : null}
        </figure>
      );
    case "image":
      return (
<figure className="my-4 overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.uri} alt={block.caption || ""} className="w-full" />
          {block.caption ? (
            <figcaption className="border-t border-slate-100 bg-white px-4 py-2 text-sm text-[#6b7280]">
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
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" />
              <span className="text-[15px] leading-relaxed text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "checklist":
      return (
        <div className="my-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#15803d]">Try this</p>
          {block.title ? <h4 className="mb-2 font-display text-lg font-bold text-[#14532d]">{block.title}</h4> : null}
          <ul className="space-y-2">
            {(block.items || []).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#16a34a]/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "quiz":
      return (
        <div className="my-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#15803d]">Remembers</p>
          <p className="text-[16px] font-semibold text-[#14532d]">{block.question}</p>
          <div className="mt-3 space-y-2">
            {(block.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[#f0fdf4] px-4 py-2.5 text-sm text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#15803d] ring-1 ring-slate-200">
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
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#15803d]">Reflect</p>
          <p className="text-[16px] text-slate-700">{block.prompt}</p>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-[#f0fdf4] px-4 py-3 text-sm text-slate-400">
            {block.placeholder || "Write your thoughts here…"}
          </div>
        </div>
      );
    case "pray":
      return (
        <div className="my-4 rounded-2xl border-l-4 border-[#ffc42e] bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#e6a800]">Pray</p>
          {block.title ? <h4 className="font-display text-lg font-bold text-[#14532d]">{block.title}</h4> : null}
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
case "reading":
      return <ReadingBlockView structure={block.structure} />;
    case "paragraph":
    default:
      return (
        <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{block.text}</p>
      );
  }
}

function ReadingMediaView({ media }: { media: ReadingMedia }) {
  if (media.type === "image") {
    return (
      <figure className="my-4 overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.uri} alt={media.caption || ""} className="w-full" />
        {media.caption ? (
          <figcaption className="border-t border-slate-100 bg-white px-4 py-2 text-sm text-[#6b7280]">
            {media.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  return (
    <figure className="my-4 rounded-2xl border-l-4 border-[#16a34a] bg-white px-5 py-4 shadow-sm">
      <blockquote className="text-lg italic leading-relaxed text-[#14532d]">
        &ldquo;{media.text}&rdquo;
      </blockquote>
      {media.by || media.source ? (
        <figcaption className="mt-2 text-sm font-semibold text-[#15803d]">
          {media.by ? `— ${media.by}` : ""}
          {media.source ? ` · ${media.source}` : ""}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Renders a stored reading block: intro → body → conclusion, with inline media. */
function ReadingBlockView({ structure }: { structure?: ReadingStructure }) {
  const s = structure ?? emptyReading();
  const intro = s.intro ?? emptyReading().intro;
  const body = Array.isArray(s.body) ? s.body : [];
  const conclusion = s.conclusion ?? emptyReading().conclusion;
  const media = (m?: ReadingMedia[]) =>
    (m || []).map((x, j) => <ReadingMediaView key={j} media={x} />);
  return (
    <div>
      {media(intro.beforeHook)}
      {intro.hook ? <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{intro.hook}</p> : null}
      {media(intro.afterHook)}
      {intro.thesis ? <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{intro.thesis}</p> : null}
      {media(intro.afterThesis)}
      {body.map((item, j) => (
        <div key={j}>
          {media(item.beforeTopic)}
          {item.topic ? <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{item.topic}</p> : null}
          {media(item.afterTopic)}
          {item.support?.length ? (
            <p className="my-3 text-[15px] italic leading-relaxed text-slate-500">{item.support.join(" ")}</p>
          ) : null}
          {media(item.afterSupport)}
          {item.closing ? <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{item.closing}</p> : null}
          {media(item.afterClosing)}
        </div>
      ))}
      {media(conclusion.beforeRestate)}
      {conclusion.restate ? <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{conclusion.restate}</p> : null}
      {media(conclusion.afterRestate)}
      {conclusion.whyItMatters ? (
        <p className="my-3 text-[16px] leading-[1.85] text-slate-700">{conclusion.whyItMatters}</p>
      ) : null}
      {media(conclusion.afterWhyItMatters)}
      {conclusion.closing ? (
        <p className="my-3 text-[15px] italic leading-relaxed text-slate-700">{conclusion.closing}</p>
      ) : null}
      {media(conclusion.afterClosing)}
    </div>
  );
}

export function formatVerse(verseBy?: string): string {
  return verseBy || "";
}

export function seasonLabel(start?: string, end?: string): string {
  if (!start || !end) return "";
  return formatShortRange(start, end);
}