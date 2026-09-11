"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select, TextArea } from "./ui";
import BlockEditor from "./BlockEditor";
import ReadEditor from "./ReadEditor";
import { ReadPreview, DayPreviewModal } from "./ReadPreview";
import { buildWeeks, emptyReading } from "@/lib/season";
import { CLUBS, SERIES, SEASON_NAMES, PUBLICATION_KINDS, BLOCK_TYPES } from "@/lib/catalog";
import type { PubBlock, ReadingStructure } from "@/lib/season";

type WeekDraft = {
  topic: string;
  intro: PubBlock[];
  days: {
    title: string;
    verseText: string;
    verseBy: string;
    blocks: PubBlock[];
    reading?: ReadingStructure;
  }[];
};

type DayPreviewData = {
  title: string;
  weekday: string;
  date: string;
  verse?: { text: string; by?: string } | null;
  blocks: PubBlock[];
};

type Draft = {
  id: string;
  kind: string;
  series: string;
  clubSlug: string;
  title: string;
  status: string;
  year: number;
  month: string;
  issue: string;
  theme: string;
  cover: string;
  coverLines: string[];
  summary: string;
  tags: string[];
  season: { name: string; year: number; start: string; end: string } | null;
  blocks: PubBlock[];
  weeks: WeekDraft[] | null;
  publishedAt: string | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function blankDraft(): Draft {
  return {
    id: "",
    kind: "magazine",
    series: "Relate",
    clubSlug: "",
    title: "",
    status: "draft",
    year: new Date().getFullYear(),
    month: "January",
    issue: "",
    theme: "",
    cover: "",
    coverLines: ["", "", ""],
    summary: "",
    tags: [],
    season: null,
    blocks: [],
    weeks: null,
    publishedAt: null,
  };
}

function emptyDay() {
  return { title: "", verseText: "", verseBy: "", blocks: [] as PubBlock[], reading: undefined as ReadingStructure | undefined };
}

function emptyWeek(): WeekDraft {
  return { topic: "", intro: [], days: Array.from({ length: 7 }, emptyDay) };
}

function blocksForPayload(day: WeekDraft["days"][number]): PubBlock[] {
  const blocks = [...day.blocks];
  const r = day.reading;
  if (
    r &&
    (r.intro?.hook ||
      r.intro?.thesis ||
      (r.body?.length ?? 0) > 0 ||
      r.conclusion?.restate ||
      r.conclusion?.whyItMatters ||
      r.conclusion?.closing)
  ) {
    blocks.unshift({ type: "reading", structure: r });
  }
  return blocks;
}

function blankBlock(type: string): PubBlock {
  const base: PubBlock = { type: type as PubBlock["type"] };
  if (type === "paragraph" || type === "heading" || type === "quote") base.text = "";
  if (type === "quote") base.by = "";
  if (type === "image") { base.uri = ""; base.caption = ""; }
  if (type === "list" || type === "checklist") { base.title = ""; base.items = []; }
  if (type === "quiz") { base.question = ""; base.options = []; base.correctIndex = 0; base.explain = ""; }
  if (type === "reflection") { base.prompt = ""; base.placeholder = ""; }
  if (type === "pray") { base.title = ""; base.items = []; }
  return base;
}

export default function MagazineEditor({
  initial,
  cloneSource,
}: {
  initial?: Record<string, any> | null;
  cloneSource?: Record<string, any> | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => {
    const prefill = initial || cloneSource || null;
    if (!prefill) return blankDraft();
    const d = blankDraft();
    d.id = initial.id || "";
    d.kind = initial.kind || "magazine";
    d.series = initial.series || "";
    d.clubSlug = initial.clubSlug || "";
    d.title = initial.title || "";
    d.status = initial.status || "draft";
    d.year = initial.year || new Date().getFullYear();
    d.month = initial.month || "January";
    d.issue = initial.issue || "";
    d.theme = initial.theme || "";
    d.cover = initial.cover || "";
    d.coverLines = Array.isArray(initial.coverLines)
      ? [...initial.coverLines, "", ""].slice(0, 3)
      : ["", "", ""];
    d.summary = initial.summary || "";
    d.tags = Array.isArray(initial.tags) ? [...initial.tags] : [];
    d.blocks = Array.isArray(initial.blocks) ? initial.blocks.map((b: any) => ({ ...b })) : [];
    d.publishedAt = initial.publishedAt ? String(initial.publishedAt) : null;
    if (initial.season) {
      d.season = {
        name: initial.season.name || "Season",
        year: initial.season.year || d.year,
        start: initial.season.start || "",
        end: initial.season.end || "",
      };
      d.weeks = (initial.weeks || []).map((w: any) => ({
        topic: w.theme || w.title?.split("—")[1]?.trim() || "",
        intro: Array.isArray(w.intro) ? w.intro.map((b: any) => ({ ...b })) : [],
        days: (w.days || []).map((day: any) => {
          const copies = Array.isArray(day.blocks) ? day.blocks.map((b: any) => ({ ...b })) : [];
          const readingBlock = copies.find((b: any) => b?.type === "reading");
          return {
            title: day.title || "",
            verseText: day.verse?.text || "",
            verseBy: day.verse?.by || "",
            blocks: copies.filter((b: any) => b?.type !== "reading"),
            reading: readingBlock?.structure || undefined,
          };
        }),
      }));
    }
    return d;
  });

  const seasonWeeks = useMemo(
    () =>
      draft.season && draft.season.start && draft.season.end
        ? buildWeeks(draft.season.start, draft.season.end)
        : [],
    [draft.season],
  );

  // Keep the weeks buffer aligned with the canonical calendar.
  useEffect(() => {
    if (!seasonWeeks.length) return;
    setDraft((prev) => {
      const weeks = Array.isArray(prev.weeks) ? [...prev.weeks] : [];
      for (let i = 0; i < seasonWeeks.length; i++) {
        if (!weeks[i]) weeks[i] = emptyWeek();
        const target = seasonWeeks[i].days.length;
        while (weeks[i].days.length < target) weeks[i].days.push(emptyDay());
        weeks[i].days = weeks[i].days.slice(0, target);
      }
      return { ...prev, weeks: weeks.slice(0, seasonWeeks.length) };
    });
  }, [seasonWeeks]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewDay, setPreviewDay] = useState<DayPreviewData | null>(null);

  const previewAccent = CLUBS.find((c) => c.slug === draft.clubSlug)?.color || "#151f3a";

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const toggleSeason = () => {
    if (draft.season) {
      set({ season: null, weeks: null });
    } else {
      const now = new Date();
      const start = `2026-09-01`;
      const next = new Date(now.setFullYear(now.getFullYear() + 1));
      const startIso = `${next.getFullYear()}-09-01`;
      const endIso = `${next.getFullYear()}-11-30`;
      void start;
      set({ season: { name: "Spring", year: next.getFullYear(), start: startIso, end: endIso }, weeks: [] });
    }
  };

  const moveBlock = (arr: PubBlock[], i: number, dir: -1 | 1, apply: (a: PubBlock[]) => void) => {
    const next = [...arr];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    apply(next);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload = {
      ...draft,
      tags: draft.tags.map((t) => t.trim()).filter(Boolean),
      coverLines: draft.coverLines.map((l) => l.trim()).filter(Boolean),
      weeks: draft.season && Array.isArray(draft.weeks) ? draft.weeks.map((w) => ({
        topic: w.topic,
        intro: w.intro,
        days: w.days.map((day) => ({
          title: day.title,
          verseText: day.verseText,
          verseBy: day.verseBy,
          blocks: blocksForPayload(day),
        })),
      })) : null,
      season: draft.season || null,
      blocks: draft.blocks,
    };
    try {
      const isEdit = !!initial;
      const res = await fetch(isEdit ? `/api/admin/publications/${initial!.id}` : "/api/admin/publications", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (isEdit ? "Update failed" : "Create failed"));
      setSaved(true);
      router.push("/admin/magazines");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Metadata */}
      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold text-[#1d2a4d]">Identity & cover</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Publication id" hint="URL slug, e.g. rooted-kids-spring-2026">
            <Input value={draft.id} onChange={(e) => set({ id: e.target.value })} placeholder="series-club-season-year" disabled={!!initial} />
          </Field>
          <Field label="Kind">
            <Select value={draft.kind} onChange={(e) => set({ kind: e.target.value })}>
              {PUBLICATION_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
          </Field>
          <Field label="Series">
            <Select value={draft.series} onChange={(e) => set({ series: e.target.value })}>
              <option value="">None</option>
              {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Club" hint="Who is this magazine for?">
            <Select value={draft.clubSlug} onChange={(e) => set({ clubSlug: e.target.value })}>
              <option value="">Relate (everyone)</option>
              {CLUBS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Rooted — Spring 2026" />
          </Field>
          {draft.season ? (
            <>
              <Field label="Season year">
                <Input type="number" value={draft.year} onChange={(e) => set({ year: Number(e.target.value) })} />
              </Field>
              <Field label="Month">
                <Select value={draft.month} onChange={(e) => set({ month: e.target.value })}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Year">
                <Input type="number" value={draft.year} onChange={(e) => set({ year: Number(e.target.value) })} />
              </Field>
              <Field label="Month">
                <Select value={draft.month} onChange={(e) => set({ month: e.target.value })}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
            </>
          )}
          <Field label="Issue line">
            <Input value={draft.issue} onChange={(e) => set({ issue: e.target.value })} placeholder="Season of Spring 2026" />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Cover image URL" hint="Paste a direct image URL (Unsplash, etc.)">
            <Input value={draft.cover} onChange={(e) => set({ cover: e.target.value })} placeholder="https://images.unsplash.com/…" />
          </Field>
          <div className="flex items-end gap-3">
            <Field label="Theme">
              <Input value={draft.theme} onChange={(e) => set({ theme: e.target.value })} placeholder="Season theme" />
            </Field>
            {draft.cover ? (
              <img src={draft.cover} alt="cover preview" className="h-[72px] w-[52px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : null}
          </div>
          {draft.coverLines.map((line, i) => (
            <Field key={i} label={`Cover line ${i + 1}`}>
              <Input value={line} onChange={(e) => set({ coverLines: draft.coverLines.map((l, j) => (j === i ? e.target.value : l)) })} />
            </Field>
          ))}
          <Field label="Summary">
            <TextArea value={draft.summary} onChange={(e) => set({ summary: e.target.value })} />
          </Field>
          <Field label="Tags" hint="Comma separated, e.g. RELATE, SPRING, FAMILIES">
            <Input value={draft.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </Field>
        </div>
      </Card>

      {/* Season / study guide */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1d2a4d]">Season & study guide</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {draft.season
                ? "A daily calendar (7 days per week) is generated from the dates below."
                : "Turn this into a seasonal study guide with weeks and daily reads."}
            </p>
          </div>
          <Button variant={draft.season ? "ghost" : "sun"} onClick={toggleSeason}>
            {draft.season ? "Remove season" : "Add season"}
          </Button>
        </div>

        {draft.season ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Season name">
              <Select value={draft.season.name} onChange={(e) => set({ season: { ...draft.season!, name: e.target.value } })}>
                {SEASON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Season year">
              <Input type="number" value={draft.season.year} onChange={(e) => set({ season: { ...draft.season!, year: Number(e.target.value) } })} />
            </Field>
            <Field label="Start date">
              <Input type="date" value={draft.season.start} onChange={(e) => set({ season: { ...draft.season!, start: e.target.value } })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={draft.season.end} onChange={(e) => set({ season: { ...draft.season!, end: e.target.value } })} />
            </Field>
            <div className="md:col-span-4">
              <Badge tone="sky">{seasonWeeks.length} weeks · {seasonWeeks.reduce((n, w) => n + w.days.length, 0)} days</Badge>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Cover sections */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1d2a4d]">Sections</h3>
            <p className="mt-0.5 text-sm text-slate-500">The magazine front matter — paragraphs, headings, quotes, images, lists…</p>
          </div>
          <AddBlockButton onAdd={(t) => set({ blocks: [...draft.blocks, blankBlock(t)] })} />
        </div>
        {draft.blocks.length === 0 ? (
          <p className="text-sm text-slate-400">No sections yet. Add a paragraph, image or a quote to start the issue.</p>
        ) : (
          <div className="space-y-3">
            {draft.blocks.map((b, i) => (
              <div key={i} className="relative">
                <BlockEditor
                  block={b}
                  onChange={(nb) => set({ blocks: draft.blocks.map((x, j) => (j === i ? nb : x)) })}
                  onRemove={() => set({ blocks: draft.blocks.filter((_, j) => j !== i) })}
                />
                <div className="absolute -top-2 right-3 flex gap-1">
                  <MoveButton disabled={i === 0} onClick={() => moveBlock(draft.blocks, i, -1, (a) => set({ blocks: a }))}>↑</MoveButton>
                  <MoveButton disabled={i === draft.blocks.length - 1} onClick={() => moveBlock(draft.blocks, i, 1, (a) => set({ blocks: a }))}>↓</MoveButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weeks */}
      {draft.season && Array.isArray(draft.weeks) ? (
        <Card>
          <h3 className="mb-1 font-display text-lg font-semibold text-[#1d2a4d]">Weeks & daily reads</h3>
          <p className="mb-4 text-sm text-slate-500">
            Each week has a topic, an introduction, and seven calendar-locked days. Dates and weekdays are auto-filled from the season.
          </p>
          <div className="space-y-6">
            {seasonWeeks.map((sw, wIdx) => {
              const wk = draft.weeks![wIdx];
              return (
                <div key={wIdx} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge tone="sky">Week {sw.index}</Badge>
                    <span className="text-xs font-medium text-slate-400">
                      {sw.days[0]?.date} → {sw.days[sw.days.length - 1]?.date}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Week topic">
                      <Input value={wk?.topic || ""} onChange={(e) => updateWeek(wIdx, { topic: e.target.value })} placeholder="e.g. The hidden root" />
                    </Field>
                    <div className="flex items-end">
                      <AddBlockButton
                        label="+ Intro block"
                        onAdd={(t) => updateWeek(wIdx, { intro: [...(wk?.intro || []), blankBlock(t)] })}
                      />
                    </div>
                  </div>
                  {wk?.intro?.length ? (
                    <div className="mt-3 space-y-3">
                      {wk.intro.map((b, bi) => (
                        <BlockEditor
                          key={bi}
                          block={b}
                          onChange={(nb) => updateWeek(wIdx, { intro: wk.intro.map((x, j) => (j === bi ? nb : x)) })}
                          onRemove={() => updateWeek(wIdx, { intro: wk.intro.filter((_, j) => j !== bi) })}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {sw.days.map((cd, dIdx) => {
                      const day = wk?.days?.[dIdx] || emptyDay();
                      return (
                        <details key={dIdx} className="rounded-xl border border-slate-200 bg-white">
                          <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700">
                            <span>
                              <span className="mr-2 inline-block w-10 text-xs font-bold text-[#13c5dd]">{cd.weekday.slice(0, 3)}</span>
                              {cd.date}
                            </span>
                            <span className="truncate text-xs font-normal text-slate-400">{day.title || "Untitled"}</span>
                          </summary>
                          <div className="border-t border-slate-100 p-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <Field label="Day title"><Input value={day.title} onChange={(e) => updateDay(wIdx, dIdx, { title: e.target.value })} /></Field>
                              <Field label="Verse text"><Input value={day.verseText} onChange={(e) => updateDay(wIdx, dIdx, { verseText: e.target.value })} placeholder="For God so loved the world…" /></Field>
                              <Field label="Verse reference"><Input value={day.verseBy} onChange={(e) => updateDay(wIdx, dIdx, { verseBy: e.target.value })} placeholder="John 3:16" /></Field>
                            </div>
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wide text-[#0fa3c4]">Read content</span>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    setPreviewDay({
                                      title: day.title,
                                      weekday: cd.weekday,
                                      date: cd.date,
                                      verse:
                                        day.verseText || day.verseBy
                                          ? { text: day.verseText, by: day.verseBy || undefined }
                                          : null,
                                      blocks: blocksForPayload(day),
                                    })
                                  }
                                >
                                  Preview day
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <ReadEditor
                                  value={day.reading ?? emptyReading()}
                                  onChange={(reading) => updateDay(wIdx, dIdx, { reading })}
                                />
                                <ReadPreview structure={day.reading ?? emptyReading()} accent={previewAccent} />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Extra blocks (images, quotes, lists…)
                              </span>
                              <AddBlockButton
                                label="+ Block"
                                onAdd={(t) => updateDay(wIdx, dIdx, { blocks: [...(day.blocks || []), blankBlock(t)] })}
                              />
                            </div>
                            {day.blocks?.length ? (
                              <div className="mt-2 space-y-2">
                                {day.blocks.map((b, bi) => (
                                  <BlockEditor
                                    key={bi}
                                    block={b}
                                    onChange={(nb) => updateDay(wIdx, dIdx, { blocks: day.blocks.map((x, j) => (j === bi ? nb : x)) })}
                                    onRemove={() => updateDay(wIdx, dIdx, { blocks: day.blocks.filter((_, j) => j !== bi) })}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col items-start gap-3">
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {saved ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Saved.</p> : null}
        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Create magazine"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/admin/magazines")}>Cancel</Button>
        </div>
      </div>

      <DayPreviewModal open={!!previewDay} onClose={() => setPreviewDay(null)} day={previewDay} accent={previewAccent} />
    </div>
  );

  function updateWeek(wIdx: number, patch: Partial<WeekDraft>) {
    setDraft((prev) => {
      if (!Array.isArray(prev.weeks)) return prev;
      const weeks = prev.weeks.map((w, i) => (i === wIdx ? { ...w, ...patch } : w));
      return { ...prev, weeks };
    });
  }

  function updateDay(wIdx: number, dIdx: number, patch: Partial<WeekDraft["days"][number]>) {
    setDraft((prev) => {
      if (!Array.isArray(prev.weeks) || !prev.weeks[wIdx]) return prev;
      const weeks = prev.weeks.map((w, i) =>
        i === wIdx
          ? { ...w, days: w.days.map((d, j) => (j === dIdx ? { ...d, ...patch } : d)) }
          : w,
      );
      return { ...prev, weeks };
    });
  }
}

function AddBlockButton({ onAdd, label = "+ Add block" }: { onAdd: (type: string) => void; label?: string }) {
  const [type, setType] = useState("paragraph");
  return (
    <div className="flex items-center gap-2">
      <Select
        className="w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {BLOCK_TYPES.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
      </Select>
      <Button variant="ghost" onClick={() => onAdd(type)}>{label}</Button>
    </div>
  );
}

function MoveButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}