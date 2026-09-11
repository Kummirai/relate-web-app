"use client";

import { Field, Input, TextArea, Select } from "./ui";
import type { PubBlock } from "@/lib/season";

const TYPE_LABELS: Record<string, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  quote: "Quote",
  image: "Image",
  list: "Bullet list",
  checklist: "Checklist",
  quiz: "Quiz",
  reflection: "Reflection",
  pray: "Prayer",
};

const linesToArray = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const arrayToLines = (v?: string[]) => (v || []).join("\n");

export default function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: PubBlock;
  onChange: (b: PubBlock) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<PubBlock>) => onChange({ ...block, ...patch });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Select
          className="w-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
          value={block.type}
          onChange={(e) => onChange({ ...block, type: e.target.value as PubBlock["type"] })}
        >
          {Object.entries(TYPE_LABELS).map(([t, label]) => (
            <option key={t} value={t}>{label}</option>
          ))}
        </Select>
        <button
          onClick={onRemove}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {block.type === "paragraph" && (
          <Field label="Text"><TextArea value={block.text || ""} onChange={(e) => set({ text: e.target.value })} /></Field>
        )}
        {block.type === "heading" && (
          <Field label="Heading"><Input value={block.text || ""} onChange={(e) => set({ text: e.target.value })} /></Field>
        )}
        {block.type === "quote" && (
          <>
            <Field label="Quote text"><TextArea value={block.text || ""} onChange={(e) => set({ text: e.target.value })} /></Field>
            <Field label="Attribution"><Input value={block.by || ""} onChange={(e) => set({ by: e.target.value })} /></Field>
          </>
        )}
        {block.type === "image" && (
          <>
            <Field label="Image URL"><Input value={block.uri || ""} onChange={(e) => set({ uri: e.target.value })} /></Field>
            <Field label="Caption"><Input value={block.caption || ""} onChange={(e) => set({ caption: e.target.value })} /></Field>
            {block.uri ? (
              <img src={block.uri} alt="preview" className="h-24 w-full rounded-lg object-cover" />
            ) : null}
          </>
        )}
        {(block.type === "list" || block.type === "checklist") && (
          <>
            {block.type === "checklist" ? (
              <Field label="Checklist title"><Input value={block.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
            ) : null}
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {block.type === "list" ? "Items" : "Checklist items"}
              </span>
              <div className="space-y-2">
                {(block.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        set({ items: (block.items || []).map((x, j) => (j === i ? e.target.value : x)) })
                      }
                      placeholder={`Item ${i + 1}`}
                    />
                    <button
                      onClick={() => set({ items: (block.items || []).filter((_, j) => j !== i) })}
                      className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!(block.items?.length) ? (
                  <p className="text-sm text-slate-400">No items yet — add the first one below.</p>
                ) : null}
                <button
                  onClick={() => set({ items: [...(block.items || []), ""] })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {block.type === "list" ? "+ Add item" : "+ Add checklist item"}
                </button>
              </div>
            </div>
          </>
        )}
        {block.type === "quiz" && (
          <>
            <Field label="Question"><TextArea value={block.question || ""} onChange={(e) => set({ question: e.target.value })} /></Field>
            <Field label="Options (one per line)">
              <TextArea value={arrayToLines(block.options)} onChange={(e) => set({ options: linesToArray(e.target.value) })} />
            </Field>
            <Field label="Correct answer (1-based number)">
              <Input
                type="number"
                min={1}
                value={(block.options?.length ? ((block.correctIndex ?? 0) + 1) : 1) || 1}
                onChange={(e) => set({ correctIndex: Math.max(0, Number(e.target.value) - 1) })}
              />
            </Field>
            <Field label="Explanation"><TextArea value={block.explain || ""} onChange={(e) => set({ explain: e.target.value })} /></Field>
          </>
        )}
        {block.type === "reflection" && (
          <>
            <Field label="Prompt"><TextArea value={block.prompt || ""} onChange={(e) => set({ prompt: e.target.value })} /></Field>
            <Field label="Placeholder"><Input value={block.placeholder || ""} onChange={(e) => set({ placeholder: e.target.value })} /></Field>
          </>
        )}
        {block.type === "pray" && (
          <>
            <Field label="Prayer title"><Input value={block.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prayer points
              </span>
              <div className="space-y-2">
                {(block.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        set({ items: (block.items || []).map((x, j) => (j === i ? e.target.value : x)) })
                      }
                      placeholder={`Prayer point ${i + 1}`}
                    />
                    <button
                      onClick={() => set({ items: (block.items || []).filter((_, j) => j !== i) })}
                      className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!(block.items?.length) ? (
                  <p className="text-sm text-slate-400">No prayer points yet — add the first one below.</p>
                ) : null}
                <button
                  onClick={() => set({ items: [...(block.items || []), ""] })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  + Add prayer point
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}