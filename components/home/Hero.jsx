export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1d2a4d 0%, #13c5dd 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-xs sm:text-sm font-semibold tracking-widest mb-4" style={{ color: "#13c5dd" }}>
            SKILLS · SOCIAL · SPIRITUAL
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Grow in every
            <br />
            area of life
          </h1>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-white/80 max-w-md mx-auto lg:mx-0">
            Prayer times, Bible reading, community groups, skills training, and more — all in one app.
          </p>

          {/* Download buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            <a
              href="/relate.apk"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
              </svg>
              <div className="text-left">
                <span className="block text-[10px] leading-none opacity-80">GET IT ON</span>
                <span className="block text-sm font-bold">Android</span>
              </div>
            </a>
            <div
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold cursor-not-allowed opacity-60"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
                <path d="M14.94 5.19A4.38 4.38 0 0012 3.5a4.4 4.4 0 00-3.15 1.32 4.17 4.17 0 00-1.2 3.09c0 1.2.5 2.3 1.33 3.08a4.27 4.27 0 003.15 1.35 4.34 4.34 0 003.18-1.38 4.19 4.19 0 001.21-3.09c0-1.2-.49-2.31-1.31-3.1l.03-.02v-.02zm-2.9 8.01a4.05 4.05 0 01-2.59-.98l-.12-.1a2.52 2.52 0 01-.07-3.52c.72-.71 1.77-1.09 2.85-1.09.33 0 .66.04.98.12l.17.04a2.35 2.35 0 011.46 2.19c0 .62-.26 1.21-.71 1.66-.47.45-1.09.7-1.75.7h-.22zm5.67 3.74c-.87.67-1.79 1.26-2.76 1.75-.97.49-1.97.75-3 .75s-2.03-.26-3-.75A12.18 12.18 0 013.43 16.9a11.45 11.45 0 01-2.27-3.45A10.4 10.4 0 010 11c0-1.72.6-3.41 1.16-5.09A12.28 12.28 0 014 2.46C5.96 1.47 7.96 1.2 10 1.2s4.04.27 6 1.26a12.28 12.28 0 012.84 3.45C19.4 7.59 20 9.28 20 11c0 1.23-.33 2.45-.69 3.2a11.45 11.45 0 01-2.27 3.45l.13.21z" />
              </svg>
              <div className="text-left">
                <span className="block text-[10px] leading-none opacity-80">DOWNLOAD ON THE</span>
                <span className="block text-sm font-bold">App Store</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/50">iOS coming soon</p>
        </div>

        {/* Phone mockup — Home Screen */}
        <div className="flex-shrink-0 relative">
          <div className="absolute -inset-8 rounded-full blur-3xl opacity-30" style={{ background: "#13c5dd" }} />
          <div className="relative w-56 sm:w-64 h-[32rem] sm:h-[36rem] rounded-[2.5rem] p-3 shadow-2xl" style={{ background: "#111" }}>
            <div className="w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col" style={{ background: "linear-gradient(to bottom, #eff5f9, #ffffff)" }}>
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 rounded-b-2xl z-10" style={{ background: "#111" }} />

              {/* Status bar area */}
              <div className="h-10" />

              {/* Scrollable content */}
              <div className="flex-1 overflow-hidden px-4 flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c4 0 8.68-3.13 12-10" />
                      <path d="M17 8c.67-1 1.33-2 2-3-1 .67-2 1.33-3 2" />
                    </svg>
                    <span className="font-bold text-sm" style={{ color: "#151f3a" }}>Relate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold" style={{ color: "#151f3a" }}>🔥 5</span>
                    <div className="w-6 h-6 rounded-full" style={{ background: "rgba(29,42,77,0.06)", border: "1px solid rgba(29,42,77,0.15)" }} />
                  </div>
                </div>

                {/* Verse of the Day card */}
                <div className="rounded-2xl p-3 relative overflow-hidden" style={{ background: "#151f3a", border: "1px solid rgba(19,197,221,0.4)" }}>
                  <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, #1d2a4d, #13c5dd)" }} />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <p className="text-[8px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>VERSE OF THE DAY</p>
                    <p className="text-[9px] italic mt-1 leading-relaxed" style={{ color: "#fff8e5" }}>
                      &ldquo;For God so loved the world that he gave his one and only Son.&rdquo;
                    </p>
                    <p className="text-[8px] font-bold mt-1" style={{ color: "#13c5dd" }}>John 3:16</p>
                  </div>
                </div>

                {/* Next Prayer card */}
                <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }}>
                  <div>
                    <p className="text-[7px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.8)" }}>NEXT PRAYER</p>
                    <p className="text-xs font-bold text-white mt-0.5">Dawn</p>
                    <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>3h 24m remaining</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#2a4070" }}>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-white leading-none">05:30</p>
                      <p className="text-[5px] font-bold tracking-wider" style={{ color: "#13c5dd" }}>NEXT</p>
                    </div>
                  </div>
                </div>

                {/* Prayer cards row */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold" style={{ color: "#151f3a" }}>Today&apos;s prayer times</p>
                    <span className="text-[7px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#1d2a4d" }}>Today</span>
                  </div>
                  <div className="flex gap-2 overflow-hidden">
                    {[
                      { name: "Dawn", time: "05:30", icon: "🌙" },
                      { name: "Sunrise", time: "08:00", icon: "☀️" },
                      { name: "Noon", time: "12:00", icon: "🌤" },
                    ].map((p) => (
                      <div key={p.name} className="flex-shrink-0 w-24 rounded-xl p-2.5" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm">{p.icon}</span>
                          <span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)" }}>{p.time}</span>
                        </div>
                        <p className="text-[9px] font-bold text-white">{p.name}</p>
                        <p className="text-[7px] mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>Begin with gratitude</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discover section */}
                <div>
                  <p className="text-[8px] font-bold tracking-widest mb-1" style={{ color: "#13c5dd" }}>DISCOVER</p>
                  <p className="text-[10px] font-bold" style={{ color: "#151f3a" }}>What&apos;s new</p>
                  <div className="flex gap-2 mt-1.5 overflow-hidden">
                    <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="h-10 relative" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }}>
                        <span className="absolute top-1 left-1.5 text-[5px] font-bold px-1 py-0.5 rounded text-white" style={{ background: "rgba(255,255,255,0.2)" }}>EVENT</span>
                      </div>
                      <div className="p-1.5">
                        <p className="text-[8px] font-bold" style={{ color: "#1d2a4d" }}>Youth Meetup</p>
                        <p className="text-[6px]" style={{ color: "#6b7a8d" }}>Sat, Aug 30</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="h-10 relative" style={{ background: "linear-gradient(135deg, #1d2a4d, #0fa3c4)" }}>
                        <span className="absolute top-1 left-1.5 text-[5px] font-bold px-1 py-0.5 rounded text-white" style={{ background: "rgba(255,255,255,0.2)" }}>SKILL</span>
                      </div>
                      <div className="p-1.5">
                        <p className="text-[8px] font-bold" style={{ color: "#1d2a4d" }}>Graphic Design</p>
                        <p className="text-[6px]" style={{ color: "#6b7a8d" }}>Sarah M.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explore section */}
                <div className="mb-2">
                  <p className="text-[10px] font-bold mb-1.5" style={{ color: "#151f3a" }}>Explore the app</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Bible", icon: "📖" },
                      { label: "Study", icon: "🎓" },
                      { label: "Plans", icon: "📅" },
                      { label: "Skills", icon: "💡" },
                      { label: "Social", icon: "👥" },
                      { label: "Prayer", icon: "🙏" },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <span className="text-[10px]">{item.icon}</span>
                        <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom tab bar */}
              <div className="flex justify-around items-center py-1.5 px-2" style={{ background: "#d4eef5" }}>
                {[
                  { label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4", active: true },
                  { label: "Requests", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", active: false },
                  { label: "Community", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", active: false },
                  { label: "Study", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", active: false },
                ].map((tab) => (
                  <div key={tab.label} className="flex flex-col items-center gap-0.5 py-0.5 px-2 rounded-xl" style={{ background: tab.active ? "#1d2a4d" : "transparent" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tab.active ? "white" : "#1d2a4d"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={tab.icon} />
                    </svg>
                    <span className="text-[6px] font-semibold" style={{ color: tab.active ? "white" : "#1d2a4d" }}>{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V20C240 0 480 40 720 30S1200 0 1440 20V60H0Z" fill="#eff5f9" />
        </svg>
      </div>
    </section>
  );
}
