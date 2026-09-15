"use client";

import { Field, Input, TextArea, Select } from "./ui";
import type { ReadingMedia } from "@/lib/season";

const selectCls =
  "w-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700";

/** A blank image or quote media item of the given type. */
export function emptyMedia(type: "image" | "quote"): ReadingMedia {
  return type === "image"
    ? { type: "image", uri: "", caption: "" }
    : { type: "quote", text: "", by: "", source: "" };
}

function MediaItem({
  media,
  onChange,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  media: ReadingMedia;
  onChange: (m: ReadingMedia) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const switchType = (type: string) => {
    const t = type as ReadingMedia["type"];
    if (t === media.type) return;
    onChange(emptyMedia(t));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Select className={selectCls} value={media.type} onChange={(e) => switchType(e.target.value)}>
          <option value="image">Image</option>
          <option value="quote">Quote</option>
        </Select>
        <div className="flex gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="rounded px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {media.type === "image" ? (
          <>
            <Field label="Image URL">
              <Input
                value={media.uri}
                onChange={(e) => onChange({ ...media, uri: e.target.value })}
                placeholder="https://images.unsplash.com/…"
              />
            </Field>
            <Field label="Caption">
              <Input
                value={media.caption || ""}
                onChange={(e) => onChange({ ...media, caption: e.target.value })}
                placeholder="A line under the image…"
              />
            </Field>
            {media.uri ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={media.uri} alt="preview" className="h-24 w-full rounded-lg object-cover" />
            ) : null}
          </>
        ) : (
          <>
            <Field label="Quote text">
              <TextArea
                value={media.text}
                onChange={(e) => onChange({ ...media, text: e.target.value })}
                placeholder="The words being quoted…"
              />
            </Field>
            <Field label="Author">
              <Input
                value={media.by || ""}
                onChange={(e) => onChange({ ...media, by: e.target.value })}
                placeholder="Who said or wrote it…"
              />
            </Field>
            <Field label="Source" hint="Where the quote comes from — book, chapter or verse reference">
              <Input
                value={media.source || ""}
                onChange={(e) => onChange({ ...media, source: e.target.value })}
                placeholder="e.g. Psalm 23:1"
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A labelled slot in a reading structure that holds zero or more image/quote
 * media items. Renders an empty-state line and "+ Image / + Quote" actions
 * until the first item is added.
 */
export function ReadingMediaSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: ReadingMedia[];
  onChange: (v: ReadingMedia[]) => void;
}) {
  const items = value ?? [];
  const add = (type: "image" | "quote") => onChange([...items, emptyMedia(type)]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const set = (i: number, m: ReadingMedia) => onChange(items.map((x, j) => (j === i ? m : x)));

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
        <div className="flex gap-1">
          <button
            onClick={() => add("image")}
            className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0fa3c4] ring-1 ring-slate-200 hover:bg-slate-50"
          >
            + Image
          </button>
          <button
            onClick={() => add("quote")}
            className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0fa3c4] ring-1 ring-slate-200 hover:bg-slate-50"
          >
            + Quote
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs italic text-slate-400">No media here yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((m, i) => (
            <MediaItem
              key={i}
              media={m}
              onChange={(nm) => set(i, nm)}
              onRemove={() => remove(i)}
              onMove={(d) => move(i, d)}
              canMoveUp={i > 0}
              canMoveDown={i < items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}