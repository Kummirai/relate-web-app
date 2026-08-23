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
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
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
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
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
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

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
          {FEATURES.map((feat, i) => (
            <div
              key={feat.id}
              className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}
            >
              {/* Phone mockup */}
              <div className="flex-shrink-0 relative">
                <div
                  className="w-48 sm:w-56 h-[26rem] sm:h-[30rem] rounded-[2rem] p-2.5 shadow-xl"
                  style={{ background: "#111" }}
                >
                  <div
                    className="w-full h-full rounded-[1.5rem] overflow-hidden relative flex flex-col items-center justify-center px-5 text-center"
                    style={{ background: feat.gradient }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 rounded-b-xl" style={{ background: "#111" }} />
                    <div className="mb-3 opacity-80">{feat.icon}</div>
                    <p className="text-white font-bold text-base mb-1">Relate</p>
                    <p className="text-white/60 text-[9px] tracking-widest mb-5">SKILLS · SOCIAL · SPIRITUAL</p>
                    <div className="w-full space-y-1.5">
                      <div className="w-full h-6 rounded-md bg-white/15" />
                      <div className="w-full h-6 rounded-md bg-white/10" />
                      <div className="w-4/5 h-6 rounded-md bg-white/10" />
                    </div>
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
          ))}
        </div>
      </div>
    </section>
  );
}
