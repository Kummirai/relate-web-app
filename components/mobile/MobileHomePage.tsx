"use client";

import { useEffect, useState } from "react";

const VOTD_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
];

const PRAYER_TIMES = [
  { key: "morning", label: "Morning Prayer", icon: "🌅", time: "06:00", caption: "Start your day with God" },
  { key: "midday", label: "Midday Prayer", icon: "☀️", time: "12:00", caption: "Pause and refocus" },
  { key: "evening", label: "Evening Prayer", icon: "🌇", time: "18:00", caption: "Reflect on God's goodness" },
  { key: "night", label: "Night Prayer", icon: "🌙", time: "21:00", caption: "Rest in His peace" },
];

const EXPLORE_ITEMS = [
  { label: "Bible", desc: "Read the Word", icon: "📖", href: "/bible" },
  { label: "Bible Study", desc: "Grow in truth", icon: "🎓", href: "/study" },
  { label: "Reading Plans", desc: "Daily devotionals", icon: "📅", href: "/reading-plans" },
  { label: "Community", desc: "Connect & grow", icon: "👥", href: "/community" },
  { label: "Skills", desc: "Learn & serve", icon: "💡", href: "/skills" },
  { label: "Prayer Requests", desc: "Share your heart", icon: "🙏", href: "/requests" },
];

export default function MobileHomePage() {
  const [bgIdx, setBgIdx] = useState(0);

  useEffect(() => {
    setBgIdx(new Date().getDay() % VOTD_BACKGROUNDS.length);
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-4">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c4 0 8.68-3.13 12-10" />
            <path d="M17 8c.67-1 1.33-2 2-3-1 .67-2 1.33-3 2" />
          </svg>
          <span className="font-bold text-2xl" style={{ color: "#1d2a4d" }}>Relate</span>
        </div>
        <p className="text-xs font-semibold tracking-widest" style={{ color: "#13c5dd" }}>
          SKILLS · SOCIAL · SPIRITUAL
        </p>
        <p className="text-sm mt-1" style={{ color: "#6b7a8d" }}>
          Grow in every area of life
        </p>
      </div>

      {/* Verse of the Day */}
      <div
        className="relative rounded-2xl overflow-hidden h-48 flex flex-col justify-end p-5"
        style={{ backgroundImage: `url(${VOTD_BACKGROUNDS[bgIdx]})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest text-white/70 mb-1">VERSE OF THE DAY</p>
          <p className="text-white text-sm font-medium leading-relaxed">
            &ldquo;For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.&rdquo;
          </p>
          <p className="text-white/80 text-xs mt-2 font-semibold">— John 3:16</p>
        </div>
      </div>

      {/* Prayer Times */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: "#1d2a4d" }}>Today&apos;s Prayer Times</h3>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#d4eef5", color: "#13c5dd" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {PRAYER_TIMES.map((p) => (
            <div
              key={p.key}
              className="flex-shrink-0 w-40 rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#d4eef5", color: "#13c5dd" }}>
                  {p.time}
                </span>
              </div>
              <p className="font-bold text-sm" style={{ color: "#1d2a4d" }}>{p.label}</p>
              <p className="text-xs" style={{ color: "#6b7a8d" }}>{p.caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community */}
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ color: "#1d2a4d" }}>Stay Connected</h3>
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.593-.828-6.322-2.213l-.44-.368-2.89.967.967-2.89-.368-.44A9.965 9.965 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-white">Join WhatsApp Community</p>
            <p className="text-xs text-white/80">Pray together, grow together</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M7 4l6 6-6 6" />
          </svg>
        </div>
      </div>

      {/* Explore */}
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ color: "#1d2a4d" }}>Explore the App</h3>
        <div className="grid grid-cols-3 gap-3">
          {EXPLORE_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center no-underline"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="font-bold text-xs" style={{ color: "#1d2a4d" }}>{item.label}</p>
              <p className="text-[10px]" style={{ color: "#6b7a8d" }}>{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Support */}
      <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }}>
        <p className="text-white font-bold text-sm mb-1">We&apos;re Here For You</p>
        <p className="text-white/80 text-xs mb-3">Need prayer, counselling, or support?</p>
        <a
          href="/requests"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-bold no-underline"
          style={{ background: "white", color: "#1d2a4d" }}
        >
          Get Help
        </a>
      </div>
    </div>
  );
}
