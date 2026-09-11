"use client";

import { Field, Input, TextArea } from "./ui";
import { emptyReading } from "@/lib/season";
import type { ReadingStructure } from "@/lib/season";

const linesToArray = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const arrayToLines = (v?: string[]) => (v || []).join("\n");

/**
 * Structured editor for a day's READ section: an introduction paragraph
 * (hook + thesis), repeatable body paragraphs (topic sentence + supporting
 * details), and a conclusion paragraph (restatement, application, closing).
 * Emits/consumes the `reading` block's `structure` shape.
 */
export default function ReadEditor({
  value,
  onChange,
}: {
  value: ReadingStructure;
  onChange: (v: ReadingStructure) => void;
}) {
  const intro = value.intro ?? emptyReading().intro;
  const body = value.body ?? [];
  const conclusion = value.conclusion ?? emptyReading().conclusion;

  const setIntro = (patch: Partial<ReadingStructure["intro"]>) =>
    onChange({ ...value, intro: { ...intro, ...patch }, body, conclusion });

  const setConclusion = (patch: Partial<ReadingStructure["conclusion"]>) =>
    onChange({ ...value, intro, body, conclusion: { ...conclusion, ...patch } });

  const setBodyItem = (i: number, patch: Partial<ReadingStructure["body"][number]>) =>
    onChange({ ...value, intro, conclusion, body: body.map((b, j) => (j === i ? { ...b, ...patch } : b)) });

  const addBodyItem = () =>
    onChange({ ...value, intro, conclusion, body: [...body, { topic: "", support: [], closing: "" }] });

  const removeBodyItem = (i: number) =>
    onChange({ ...value, intro, conclusion, body: body.filter((_, j) => j !== i) });

  const moveBodyItem = (i: number, dir: -1 | 1) => {
    const next = [...body];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...value, intro, conclusion, body: next });
  };

  return (
    <div className="space-y-4">
      {/* 1 · Introduction */}
      <div className="rounded-xl border border-l-[3px] border-slate-200 border-l-[#13c5dd] bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#13c5dd] text-[10px] font-bold text-white">1</span>
          <p className="text-xs font-bold uppercase tracking-wide text-[#1d2a4d]">Introduction paragraph</p>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <Field label="Hook" hint="The opening line that grabs attention">
            <TextArea value={intro.hook} onChange={(e) => setIntro({ hook: e.target.value })} placeholder="Start with a question, a story or a vivid image…" />
          </Field>
          <Field label="Thesis" hint="The main point of today's reading">
            <TextArea value={intro.thesis} onChange={(e) => setIntro({ thesis: e.target.value })} placeholder="What today's reading is really about…" />
          </Field>
        </div>
      </div>

      {/* 2 · Body paragraphs */}
      <div className="rounded-xl border border-l-[3px] border-slate-200 border-l-[#13c5dd] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#13c5dd] text-[10px] font-bold text-white">2</span>
            <p className="text-xs font-bold uppercase tracking-wide text-[#1d2a4d]">Body paragraphs</p>
          </div>
          <button
            onClick={addBodyItem}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Add paragraph
          </button>
        </div>
        {body.length === 0 ? (
          <p className="text-sm text-slate-400">No body paragraphs yet.</p>
        ) : (
          <div className="space-y-3">
            {body.map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Paragraph {i + 1}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveBodyItem(i, -1)}
                      disabled={i === 0}
                      className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBodyItem(i, 1)}
                      disabled={i === body.length - 1}
                      className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeBodyItem(i)}
                      className="rounded px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <Field label="Topic sentence">
                    <Input value={item.topic} onChange={(e) => setBodyItem(i, { topic: e.target.value })} placeholder="The point this paragraph makes…" />
                  </Field>
                  <Field label="Supporting details" hint="One per line">
                    <TextArea value={arrayToLines(item.support)} onChange={(e) => setBodyItem(i, { support: linesToArray(e.target.value) })} placeholder={"Evidence, example or explanation…\nA second supporting detail…"} />
                  </Field>
                  <Field label="Concluding sentence" hint="A sentence that wraps up this paragraph">
                    <TextArea value={item.closing || ""} onChange={(e) => setBodyItem(i, { closing: e.target.value })} placeholder="Tie the paragraph back to today's point…" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3 · Conclusion */}
      <div className="rounded-xl border border-l-[3px] border-slate-200 border-l-[#13c5dd] bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#13c5dd] text-[10px] font-bold text-white">3</span>
          <p className="text-xs font-bold uppercase tracking-wide text-[#1d2a4d]">Conclusion paragraph</p>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <Field label="Restate the point">
            <TextArea value={conclusion.restate} onChange={(e) => setConclusion({ restate: e.target.value })} placeholder="Bring the reading back to its main point…" />
          </Field>
          <Field label="Why it matters">
            <TextArea value={conclusion.whyItMatters} onChange={(e) => setConclusion({ whyItMatters: e.target.value })} placeholder="So what? Why does this matter today…" />
          </Field>
          <Field label="Closing thought">
            <TextArea value={conclusion.closing} onChange={(e) => setConclusion({ closing: e.target.value })} placeholder="A line to carry through the day…" />
          </Field>
        </div>
      </div>
    </div>
  );
}