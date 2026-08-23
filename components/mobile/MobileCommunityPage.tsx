"use client";

import { useEffect, useState } from "react";

type Tab = "skills" | "social" | "spiritual";
const TABS: { key: Tab; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "social", label: "Social" },
  { key: "spiritual", label: "Spiritual" },
];

export default function MobileCommunityPage() {
  const [tab, setTab] = useState<Tab>("skills");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col px-4 pt-2 pb-4">
      {/* Eyebrow */}
      <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "#13c5dd" }}>
        CONNECT &amp; GROW
      </p>
      <h2 className="font-bold text-lg mb-3" style={{ color: "#1d2a4d" }}>
        Community
      </h2>

      {/* Tab pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold transition"
            style={{
              background: tab === t.key ? "#1d2a4d" : "white",
              color: tab === t.key ? "white" : "#1d2a4d",
              border: "1px solid " + (tab === t.key ? "#1d2a4d" : "rgba(0,0,0,0.08)"),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-32 animate-pulse"
              style={{ background: "rgba(0,0,0,0.04)" }}
            />
          ))}
        </div>
      ) : tab === "skills" ? (
        <SkillsContent />
      ) : tab === "social" ? (
        <SocialContent />
      ) : (
        <SpiritualContent />
      )}
    </div>
  );
}

function SkillsContent() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "#6b7a8d" }}>
        Share or discover skills in the community.
      </p>
      {[
        { title: "Graphic Design", type: "Offering", by: "Sarah M.", color: "#10b981" },
        { title: "Web Development", type: "Seeking", by: "James K.", color: "#f59e0b" },
        { title: "Cooking & Recipes", type: "Offering", by: "Grace N.", color: "#10b981" },
      ].map((s, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "#1d2a4d" }}
          >
            {s.title[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "#1d2a4d" }}>{s.title}</p>
            <p className="text-xs" style={{ color: "#6b7a8d" }}>by {s.by}</p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: s.color + "15", color: s.color }}
          >
            {s.type}
          </span>
        </div>
      ))}
    </div>
  );
}

function SocialContent() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "#6b7a8d" }}>
        Upcoming events and social gatherings.
      </p>
      {[
        { title: "Youth Meetup", date: "Sat, Aug 30", loc: "Online", color: "#8b5cf6" },
        { title: "Community Lunch", date: "Sun, Sep 7", loc: "Johannesburg", color: "#13c5dd" },
      ].map((e, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: e.color }}
          >
            📅
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "#1d2a4d" }}>{e.title}</p>
            <p className="text-xs" style={{ color: "#6b7a8d" }}>{e.date} · {e.loc}</p>
          </div>
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "#d4eef5", color: "#13c5dd" }}
          >
            RSVP
          </button>
        </div>
      ))}
    </div>
  );
}

function SpiritualContent() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "#6b7a8d" }}>
        Prayer groups and spiritual growth.
      </p>
      {[
        { title: "Morning Devotion Group", members: 24, icon: "🌅" },
        { title: "Couples Prayer Circle", members: 12, icon: "💑" },
        { title: "Youth Bible Study", members: 18, icon: "📚" },
      ].map((g, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="text-2xl">{g.icon}</div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "#1d2a4d" }}>{g.title}</p>
            <p className="text-xs" style={{ color: "#6b7a8d" }}>{g.members} members</p>
          </div>
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "#d4eef5", color: "#13c5dd" }}
          >
            Join
          </button>
        </div>
      ))}
    </div>
  );
}
