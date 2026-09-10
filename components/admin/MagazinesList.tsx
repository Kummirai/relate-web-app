"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "./ui";
import { clubName } from "@/lib/catalog";

type Row = {
  _id: string;
  id: string;
  kind: string;
  series?: string;
  clubSlug?: string;
  title: string;
  year?: number;
  season?: { name?: string; year?: number; label?: string };
  status: string;
  updatedAt?: string;
};

export default function MagazinesList() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    try {
      const res = await fetch(`/api/admin/publications${params}`);
      const json = await res.json();
      setRows(json.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = filter ? `?status=${filter}` : "";
      try {
        const res = await fetch(`/api/admin/publications${params}`);
        const json = await res.json();
        if (!cancelled) setRows(json.data || []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const toggleStatus = async (row: Row) => {
    setBusy(row.id);
    const next = row.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/publications/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
    setBusy(null);
    reload();
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    setBusy(row.id);
    await fetch(`/api/admin/publications/${row.id}`, { method: "DELETE" }).catch(() => {});
    setBusy(null);
    reload();
  };

  const clone = (row: Row) => {
    router.push(`/admin/magazines/new?clone=${row.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Library</p>
          <h1 className="font-display text-3xl font-bold text-[#1d2a4d]">Magazines</h1>
          <p className="mt-1 text-sm text-[#6b7a8d]">Drafts and published issues, newest first.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <Link
            href="/admin/magazines/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#1d2a4d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a4070]"
          >
            + New magazine
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#6b7a8d]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-12 text-center">
          <p className="text-sm text-[#6b7a8d]">No magazines yet. Create the first one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Publication</th>
                <th className="px-4 py-3 font-semibold">Club</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Season</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/magazines/${row.id}`} className="font-semibold text-[#1d2a4d] hover:text-[#13c5dd]">
                      {row.title}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {row.series || "—"} · {row.id} {row.kind === "bulletin" ? "· bulletin" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{clubName(row.clubSlug)}</td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    {row.season?.label || row.season?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={row.status === "published" ? "green" : "amber"}>
                      {row.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(row)}
                        disabled={busy === row.id}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          row.status === "published"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        {row.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => clone(row)}
                        disabled={busy === row.id}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Clone
                      </button>
                      <button
                        onClick={() => remove(row)}
                        disabled={busy === row.id}
                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}