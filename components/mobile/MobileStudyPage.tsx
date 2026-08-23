"use client";

import { useState } from "react";

const CATEGORIES = [
  { key: "foundations", label: "Foundations", icon: "🏛️" },
  { key: "marriage", label: "Marriage", icon: "💑" },
  { key: "parenting", label: "Parenting", icon: "👨‍👩‍👧" },
  { key: "leadership", label: "Leadership", icon: "👑" },
  { key: "finances", label: "Finances", icon: "💰" },
  { key: "youth", label: "Youth", icon: "🌟" },
];

const SERIES = [
  {
    title: "Foundations of Faith",
    category: "foundations",
    lessons: 12,
    done: 8,
    cover: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&h=250&fit=crop",
  },
  {
    title: "Love & Respect",
    category: "marriage",
    lessons: 8,
    done: 3,
    cover: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=250&fit=crop",
  },
  {
    title: "Raising Godly Children",
    category: "parenting",
    lessons: 10,
    done: 10,
    cover: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&h=250&fit=crop",
  },
  {
    title: "Kingdom Leadership",
    category: "leadership",
    lessons: 6,
    done: 0,
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop",
  },
  {
    title: "Biblical Stewardship",
    category: "finances",
    lessons: 7,
    done: 5,
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
  },
  {
    title: "Purpose-Driven Youth",
    category: "youth",
    lessons: 9,
    done: 0,
    cover: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=250&fit=crop",
  },
];

export default function MobileStudyPage() {
  const [cat, setCat] = useState<string | null>(null);

  const filtered = cat ? SERIES.filter((s) => s.category === cat) : SERIES;
  const inProgress = SERIES.filter((s) => s.done > 0 && s.done < s.lessons);
  const completed = SERIES.filter((s) => s.done === s.lessons);

  return (
    <div className="flex flex-col px-4 pt-2 pb-4">
      {/* Eyebrow */}
      <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "#13c5dd" }}>
        GROW IN THE WORD
      </p>
      <h2 className="font-bold text-lg mb-3" style={{ color: "#1d2a4d" }}>
        Bible Study
      </h2>

      {/* Category pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setCat(null)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition"
          style={{
            background: cat === null ? "#1d2a4d" : "white",
            color: cat === null ? "white" : "#1d2a4d",
            border: "1px solid " + (cat === null ? "#1d2a4d" : "rgba(0,0,0,0.08)"),
          }}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1"
            style={{
              background: cat === c.key ? "#1d2a4d" : "white",
              color: cat === c.key ? "white" : "#1d2a4d",
              border: "1px solid " + (cat === c.key ? "#1d2a4d" : "rgba(0,0,0,0.08)"),
            }}
          >
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Continue studying rail */}
      {inProgress.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#13c5dd" }}>
            CONTINUE STUDYING
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
            {inProgress.map((s, i) => {
              const pct = Math.round((s.done / s.lessons) * 100);
              return (
                <div
                  key={i}
                  className="flex-shrink-0 w-52 rounded-2xl overflow-hidden"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div
                    className="h-24 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${s.cover})` }}
                  >
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90" style={{ color: "#13c5dd" }}>
                      Continue · {pct}%
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs mb-1" style={{ color: "#1d2a4d" }}>{s.title}</p>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#13c5dd" }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "#6b7a8d" }}>
                      {s.done} of {s.lessons} lessons
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed rail */}
      {completed.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#10b981" }}>
            ACHIEVEMENTS
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
            {completed.map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-40 rounded-2xl p-3 text-center"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="text-2xl">🏆</span>
                <p className="font-bold text-xs mt-1" style={{ color: "#1d2a4d" }}>{s.title}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "#10b98115", color: "#10b981" }}>
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All series */}
      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#13c5dd" }}>
        ALL SERIES
      </p>
      <div className="flex flex-col gap-3">
        {filtered.map((s, i) => {
          const pct = Math.round((s.done / s.lessons) * 100);
          const isDone = s.done === s.lessons;
          return (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="h-32 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${s.cover})` }}
              >
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
                {isDone && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90" style={{ color: "#10b981" }}>
                    ✅ Completed
                  </span>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-bold text-sm text-white">{s.title}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "#6b7a8d" }}>
                    {s.lessons} lessons · {s.done}/{s.lessons} done
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isDone ? "#10b981" : "#13c5dd" }} />
                </div>
                <div className="mt-3">
                  {isDone ? (
                    <button
                      className="w-full py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: "#d4eef5", color: "#13c5dd" }}
                    >
                      Review
                    </button>
                  ) : s.done > 0 ? (
                    <button
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: "#13c5dd" }}
                    >
                      Continue · {pct}%
                    </button>
                  ) : (
                    <button
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: "#1d2a4d" }}
                    >
                      Start Study
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
