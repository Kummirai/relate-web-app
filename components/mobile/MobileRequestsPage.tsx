"use client";

import { useState } from "react";

type Filter = "all" | "open" | "in_progress" | "resolved";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

const HELP_TYPES = ["Social support", "Counselling", "Provision", "Financial", "Other"];
const TYPE_COLORS: Record<string, string> = {
  "Social support": "#10b981",
  Counselling: "#8b5cf6",
  Provision: "#f59e0b",
  Financial: "#13c5dd",
  Other: "#6b7a8d",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#13c5dd",
  resolved: "#10b981",
  closed: "#6b7a8d",
};

export default function MobileRequestsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <div className="flex flex-col px-4 pt-2 pb-4">
      {/* Eyebrow */}
      <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "#13c5dd" }}>
        SUPPORT &amp; CARE
      </p>
      <h2 className="font-bold text-lg mb-3" style={{ color: "#1d2a4d" }}>
        Prayer Requests
      </h2>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition"
            style={{
              background: filter === f.key ? "#1d2a4d" : "white",
              color: filter === f.key ? "white" : "#1d2a4d",
              border: "1px solid " + (filter === f.key ? "#1d2a4d" : "rgba(0,0,0,0.08)"),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }}
      >
        <p className="text-white font-bold text-sm mb-1">Need help?</p>
        <p className="text-white/80 text-xs mb-3">It stays between you and our support team</p>
        <a
          href="/requests"
          className="inline-block px-5 py-2 rounded-full text-sm font-bold no-underline"
          style={{ background: "white", color: "#1d2a4d" }}
        >
          Ask for Help
        </a>
      </div>

      {/* Request list — placeholder data */}
      <div className="flex flex-col gap-3">
        {[
          {
            title: "Prayer for healing",
            type: "Social support",
            status: "open",
            date: "2 hours ago",
            message: "Please pray for my mother who is in hospital...",
          },
          {
            title: "Career guidance needed",
            type: "Counselling",
            status: "in_progress",
            date: "1 day ago",
            message: "I need guidance on transitioning to a new career...",
          },
          {
            title: "Family reconciliation",
            type: "Counselling",
            status: "resolved",
            date: "3 days ago",
            message: "Thank you for your prayers, things are better now.",
          },
        ]
          .filter((r) => filter === "all" || r.status === filter)
          .map((r, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: (TYPE_COLORS[r.type] || "#6b7a8d") + "15",
                    color: TYPE_COLORS[r.type] || "#6b7a8d",
                  }}
                >
                  {r.type}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: (STATUS_COLORS[r.status] || "#6b7a8d") + "15",
                    color: STATUS_COLORS[r.status] || "#6b7a8d",
                  }}
                >
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: "#1d2a4d" }}>{r.title}</p>
              <p className="text-xs mb-2 line-clamp-2" style={{ color: "#6b7a8d" }}>
                {r.message}
              </p>
              <p className="text-[10px]" style={{ color: "#6b7a8d" }}>{r.date}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
