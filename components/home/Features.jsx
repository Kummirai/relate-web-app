const FEATURES = [
  {
    id: "prayer",
    eyebrow: "PRAYER & DEVOTION",
    title: "Deepen your spiritual life",
    description:
      "Set personalized prayer times throughout the day, read the Bible with multiple versions, explore verse of the day, and follow guided reading plans.",
    items: [
      "Custom prayer times with reminders",
      "Bible reader (KJV, ASV, WEB)",
      "Verse of the Day",
      "Guided reading plans",
      "Prayer streaks & history",
    ],
    gradient: "linear-gradient(135deg, #13c5dd 0%, #1d2a4d 100%)",
  },
  {
    id: "community",
    eyebrow: "COMMUNITY",
    title: "Connect and grow together",
    description:
      "Join WhatsApp communities for couples or singles, share and discover skills, attend events, and submit prayer requests to the support team.",
    items: [
      "WhatsApp community groups",
      "Skills sharing (offer & seek)",
      "Events & RSVPs",
      "Prayer request support",
      "Prayer groups & sessions",
    ],
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #1d2a4d 100%)",
  },
  {
    id: "growth",
    eyebrow: "GROWTH & LEARNING",
    title: "Invest in yourself",
    description:
      "Take Bible study courses, develop new skills, manage your finances with the financial suite, and track your personal growth journey.",
    items: [
      "Bible study courses",
      "Skills training & resources",
      "Financial suite & reporting",
      "Bible Talk TV integration",
      "Progress tracking",
    ],
    gradient: "linear-gradient(135deg, #10b981 0%, #1d2a4d 100%)",
  },
];

function PrayerMockup() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "linear-gradient(to bottom, #eff5f9, #ffffff)" }}>
      <div className="h-6" />
      <div className="px-3 flex flex-col gap-2.5 flex-1 overflow-hidden">
        {/* Header */}
        <p className="text-[7px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>PRAYER &amp; DEVOTION</p>
        <p className="text-[11px] font-bold" style={{ color: "#151f3a" }}>Today&apos;s prayer times</p>

        {/* Date nav */}
        <div className="flex items-center justify-between px-1 py-1 rounded-xl" style={{ background: "#d4eef5" }}>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "#eff5f9" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1d2a4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
          <p className="text-[8px] font-semibold" style={{ color: "#1d2a4d" }}>Aug 23, 2026</p>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "#eff5f9" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1d2a4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>

        {/* Prayer cards */}
        <div className="flex gap-1.5 overflow-hidden">
          {[
            { name: "Dawn", time: "05:30", icon: "🌙", caption: "Begin with gratitude", verse: "The Lord is my shepherd..." },
            { name: "Sunrise", time: "08:00", icon: "☀️", caption: "Begin with gratitude", verse: "This is the day the Lord..." },
            { name: "Noon", time: "12:00", icon: "🌤", caption: "Pause for guidance", verse: "Trust in the Lord with..." },
          ].map((p) => (
            <div key={p.name} className="flex-shrink-0 w-[72px] rounded-xl p-2 flex flex-col gap-1" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)", minHeight: 120 }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px]">{p.icon}</span>
                <span className="text-[6px] font-bold px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>{p.time}</span>
              </div>
              <p className="text-[8px] font-bold text-white">{p.name}</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.85)" }}>{p.caption}</p>
              <div className="mt-auto">
                <p className="text-[6px] italic" style={{ color: "rgba(255,255,255,0.7)" }}>{p.verse}</p>
              </div>
              <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ background: "#13c5dd" }} />
            </div>
          ))}
        </div>

        {/* Discover */}
        <p className="text-[7px] font-bold tracking-widest mt-1" style={{ color: "#13c5dd" }}>DISCOVER</p>
        <div className="flex gap-1.5 overflow-hidden">
          <div className="flex-shrink-0 w-24 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="h-7" style={{ background: "linear-gradient(135deg, #13c5dd, #1d2a4d)" }} />
            <div className="p-1.5">
              <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Youth Meetup</p>
              <p className="text-[5px]" style={{ color: "#6b7a8d" }}>Sat, Aug 30</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-24 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="h-7" style={{ background: "linear-gradient(135deg, #1d2a4d, #0fa3c4)" }} />
            <div className="p-1.5">
              <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Web Dev Skill</p>
              <p className="text-[5px]" style={{ color: "#6b7a8d" }}>James K.</p>
            </div>
          </div>
        </div>

        {/* Reading plans */}
        <div className="mt-1">
          <p className="text-[7px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>READING PLANS</p>
          <div className="flex gap-1.5 mt-1 overflow-hidden">
            {["Bible Reading", "Marriage", "Finance"].map((cat) => (
              <span key={cat} className="flex-shrink-0 text-[6px] font-bold px-2 py-1 rounded-full" style={{ background: "#d4eef5", color: "#13c5dd" }}>{cat}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex justify-around items-center py-1.5 px-2 mt-auto" style={{ background: "#d4eef5" }}>
        {["Home", "Requests", "Community", "Study"].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-0.5 px-2 rounded-xl" style={{ background: i === 0 ? "#1d2a4d" : "transparent" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: i === 0 ? "white" : "#1d2a4d", opacity: i === 0 ? 1 : 0.4 }} />
            <span className="text-[5px] font-semibold" style={{ color: i === 0 ? "white" : "#1d2a4d" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityMockup() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "linear-gradient(to bottom, #eff5f9, #ffffff)" }}>
      <div className="h-6" />
      <div className="px-3 flex flex-col gap-2.5 flex-1 overflow-hidden">
        {/* Header */}
        <p className="text-[7px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>CONNECT &amp; GROW</p>
        <p className="text-[11px] font-bold" style={{ color: "#151f3a" }}>Community</p>

        {/* Tab pills */}
        <div className="flex gap-1.5 overflow-hidden">
          {["Skills", "Social", "Spiritual"].map((t, i) => (
            <span key={t} className="flex-shrink-0 text-[7px] font-bold px-3 py-1 rounded-full" style={{ background: i === 0 ? "#1d2a4d" : "white", color: i === 0 ? "white" : "#1d2a4d", border: `1px solid ${i === 0 ? "#1d2a4d" : "rgba(0,0,0,0.08)"}` }}>{t}</span>
          ))}
        </div>

        {/* Skill cards */}
        {[
          { title: "Graphic Design", type: "Offering", by: "Sarah M.", color: "#10b981" },
          { title: "Web Development", type: "Seeking", by: "James K.", color: "#f59e0b" },
          { title: "Cooking & Recipes", type: "Offering", by: "Grace N.", color: "#10b981" },
        ].map((s) => (
          <div key={s.title} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: "#1d2a4d" }}>{s.title[0]}</div>
            <div className="flex-1">
              <p className="text-[8px] font-bold" style={{ color: "#1d2a4d" }}>{s.title}</p>
              <p className="text-[6px]" style={{ color: "#6b7a8d" }}>by {s.by}</p>
            </div>
            <span className="text-[5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: s.color + "15", color: s.color }}>{s.type}</span>
          </div>
        ))}

        {/* Events preview */}
        <p className="text-[7px] font-bold tracking-widest mt-1" style={{ color: "#13c5dd" }}>UPCOMING EVENTS</p>
        <div className="flex gap-1.5 overflow-hidden">
          <div className="flex-shrink-0 w-28 rounded-xl p-2" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[8px]" style={{ background: "#8b5cf6" }}>📅</div>
              <div>
                <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Youth Meetup</p>
                <p className="text-[5px]" style={{ color: "#6b7a8d" }}>Sat, Aug 30</p>
              </div>
            </div>
            <span className="text-[5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#d4eef5", color: "#13c5dd" }}>RSVP</span>
          </div>
          <div className="flex-shrink-0 w-28 rounded-xl p-2" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[8px]" style={{ background: "#13c5dd" }}>🍽</div>
              <div>
                <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Community Lunch</p>
                <p className="text-[5px]" style={{ color: "#6b7a8d" }}>Sun, Sep 7</p>
              </div>
            </div>
            <span className="text-[5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#d4eef5", color: "#13c5dd" }}>RSVP</span>
          </div>
        </div>

        {/* Prayer groups */}
        <p className="text-[7px] font-bold tracking-widest mt-1" style={{ color: "#13c5dd" }}>PRAYER GROUPS</p>
        <div className="flex gap-1.5 overflow-hidden">
          {[
            { name: "Morning Devotion", members: 24, icon: "🌅" },
            { name: "Couples Prayer", members: 12, icon: "💑" },
          ].map((g) => (
            <div key={g.name} className="flex-shrink-0 w-28 rounded-xl p-2 flex items-center gap-1.5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
              <span className="text-[10px]">{g.icon}</span>
              <div>
                <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>{g.name}</p>
                <p className="text-[5px]" style={{ color: "#6b7a8d" }}>{g.members} members</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex justify-around items-center py-1.5 px-2 mt-auto" style={{ background: "#d4eef5" }}>
        {["Home", "Requests", "Community", "Study"].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-0.5 px-2 rounded-xl" style={{ background: i === 2 ? "#1d2a4d" : "transparent" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: i === 2 ? "white" : "#1d2a4d", opacity: i === 2 ? 1 : 0.4 }} />
            <span className="text-[5px] font-semibold" style={{ color: i === 2 ? "white" : "#1d2a4d" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudyMockup() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "linear-gradient(to bottom, #eff5f9, #ffffff)" }}>
      <div className="h-6" />
      <div className="px-3 flex flex-col gap-2.5 flex-1 overflow-hidden">
        {/* Header */}
        <p className="text-[7px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>GROW IN THE WORD</p>
        <p className="text-[11px] font-bold" style={{ color: "#151f3a" }}>Bible Study</p>

        {/* Search bar */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6b7a8d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <p className="text-[6px]" style={{ color: "#6b7a8d" }}>Search series...</p>
        </div>

        {/* Continue studying */}
        <p className="text-[7px] font-bold tracking-widest" style={{ color: "#13c5dd" }}>KEEP GOING</p>
        <p className="text-[9px] font-bold" style={{ color: "#151f3a" }}>Continue Studying</p>
        <div className="flex gap-1.5 overflow-hidden">
          <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="h-10 relative" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&h=250&fit=crop)", backgroundSize: "cover", backgroundPosition: "center" }}>
              <span className="absolute top-1 right-1 text-[5px] font-bold px-1 py-0.5 rounded bg-white/90" style={{ color: "#13c5dd" }}>Continue · 67%</span>
            </div>
            <div className="p-1.5">
              <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Foundations of Faith</p>
              <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "67%", background: "#13c5dd" }} />
              </div>
              <p className="text-[5px] mt-0.5" style={{ color: "#6b7a8d" }}>8 of 12 lessons</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="h-10 relative" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=250&fit=crop)", backgroundSize: "cover", backgroundPosition: "center" }}>
              <span className="absolute top-1 right-1 text-[5px] font-bold px-1 py-0.5 rounded bg-white/90" style={{ color: "#13c5dd" }}>Continue · 38%</span>
            </div>
            <div className="p-1.5">
              <p className="text-[7px] font-bold" style={{ color: "#1d2a4d" }}>Love &amp; Respect</p>
              <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "38%", background: "#13c5dd" }} />
              </div>
              <p className="text-[5px] mt-0.5" style={{ color: "#6b7a8d" }}>3 of 8 lessons</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-1">
          <p className="text-[7px] font-bold tracking-widest" style={{ color: "#10b981" }}>ACHIEVEMENTS</p>
          <div className="flex gap-1.5 mt-1 overflow-hidden">
            <div className="flex-shrink-0 w-20 rounded-xl p-1.5 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[10px]">🏆</p>
              <p className="text-[6px] font-bold" style={{ color: "#1d2a4d" }}>Raising Children</p>
              <span className="text-[5px] font-bold px-1 py-0.5 rounded-full inline-block" style={{ background: "#10b98115", color: "#10b981" }}>Done</span>
            </div>
          </div>
        </div>

        {/* All series */}
        <p className="text-[7px] font-bold tracking-widest mt-1" style={{ color: "#13c5dd" }}>ALL SERIES</p>
        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="h-10 relative" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop)", backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
            <p className="absolute bottom-1 left-2 text-[8px] font-bold text-white">Biblical Stewardship</p>
          </div>
          <div className="p-2">
            <p className="text-[6px]" style={{ color: "#6b7a8d" }}>7 lessons · 5/7 done</p>
            <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "71%", background: "#13c5dd" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex justify-around items-center py-1.5 px-2 mt-auto" style={{ background: "#d4eef5" }}>
        {["Home", "Requests", "Community", "Study"].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-0.5 px-2 rounded-xl" style={{ background: i === 3 ? "#1d2a4d" : "transparent" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: i === 3 ? "white" : "#1d2a4d", opacity: i === 3 ? 1 : 0.4 }} />
            <span className="text-[5px] font-semibold" style={{ color: i === 3 ? "white" : "#1d2a4d" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS = {
  prayer: PrayerMockup,
  community: CommunityMockup,
  growth: StudyMockup,
};

export default function Features() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 lg:px-20" style={{ background: "#eff5f9" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold tracking-widest mb-2" style={{ color: "#13c5dd" }}>
            WHY RELATE?
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: "#1d2a4d" }}>
            Everything you need in one app
          </h2>
        </div>

        <div className="space-y-16 md:space-y-24">
          {FEATURES.map((feat, i) => {
            const MockupComponent = MOCKUPS[feat.id];
            return (
              <div
                key={feat.id}
                className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}
              >
                {/* Phone mockup with real content */}
                <div className="flex-shrink-0 relative">
                  <div
                    className="w-48 sm:w-56 h-[26rem] sm:h-[30rem] rounded-[2rem] p-2.5 shadow-xl"
                    style={{ background: "#111" }}
                  >
                    <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-b-xl z-10" style={{ background: "#111" }} />
                      <MockupComponent />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 text-center lg:text-left">
                  <p className="text-[10px] sm:text-xs font-bold tracking-widest mb-2" style={{ color: "#13c5dd" }}>
                    {feat.eyebrow}
                  </p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" style={{ color: "#1d2a4d" }}>
                    {feat.title}
                  </h3>
                  <p className="text-sm sm:text-base mb-6 max-w-lg mx-auto lg:mx-0" style={{ color: "#6b7a8d" }}>
                    {feat.description}
                  </p>
                  <ul className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                    {feat.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#1d2a4d" }}>
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#d4eef5" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
