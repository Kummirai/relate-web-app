"use client";

import { useState } from "react";
import SlideUp from "@/components/SlideUp";
import {
  HiOutlineBookOpen, HiOutlineTrophy, HiOutlineCalendarDays, HiOutlineUsers,
  HiOutlineLightBulb, HiOutlineArrowRight, HiOutlineClock, HiOutlineMapPin,
  HiOutlineStar, HiOutlineQuestionMarkCircle, HiOutlineFlag, HiOutlineHeart,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const books = [
  { book: "Jonah", chapters: "1–4", season: "1", focus: "God's mercy to all nations, repentance, and the heart of a reluctant prophet" },
  { book: "Ephesians", chapters: "1–6", season: "1", focus: "Grace, salvation, unity in Christ, spiritual warfare, and walking in the Spirit" },
  { book: "Esther", chapters: "1–10", season: "2", focus: "God's providence, courage, faithfulness, and deliverance of His people" },
  { book: "Philemon", chapters: "1", season: "2", focus: "Forgiveness, reconciliation, and Christian brotherhood in action" },
];

const sessions = [
  { session: 1, date: "August 8, 2026", books: "Jonah 1–2", season: 1 },
  { session: 2, date: "August 22, 2026", books: "Jonah 3–4", season: 1 },
  { session: 3, date: "September 5, 2026", books: "Ephesians 1–2", season: 1 },
  { session: 4, date: "September 19, 2026", books: "Ephesians 3–4", season: 1 },
  { session: 5, date: "October 3, 2026", books: "Ephesians 5–6", season: 1 },
  { session: 6, date: "October 17, 2026", books: "Review (Jonah & Ephesians)", season: 1 },
  { session: 7, date: "March 6, 2027", books: "Esther 1–2", season: 2 },
  { session: 8, date: "March 20, 2027", books: "Esther 3–4", season: 2 },
  { session: 9, date: "April 3, 2027", books: "Esther 5–7", season: 2 },
  { session: 10, date: "April 17, 2027", books: "Esther 8–10", season: 2 },
  { session: 11, date: "May 1, 2027", books: "Philemon 1", season: 2 },
  { session: 12, date: "May 15, 2027", books: "Review (Esther & Philemon)", season: 2 },
];

const teams = [
  { name: "Faithful Warriors", played: 6, scores: [2, 2, 2, 2, 0, 2] },
  { name: "Scripture Seekers", played: 6, scores: [2, 0, 2, 2, 2, 2] },
  { name: "Light of the Word", played: 6, scores: [2, 0, 2, 0, 2, 2] },
  { name: "Bible Champions", played: 6, scores: [0, 2, 2, 2, 0, 2] },
  { name: "Grace Defenders", played: 6, scores: [2, 0, 2, 0, 2, 0] },
  { name: "Truth Bearers", played: 6, scores: [0, 2, 0, 2, 0, 2] },
  { name: "Living Stones", played: 6, scores: [2, 2, 0, 0, 2, 0] },
  { name: "Salt & Light", played: 6, scores: [0, 2, 0, 2, 0, 0] },
  { name: "Bread of Life", played: 6, scores: [2, 0, 0, 2, 0, 0] },
  { name: "New Creation", played: 6, scores: [0, 0, 2, 0, 2, 0] },
  { name: "Mighty Vessels", played: 6, scores: [0, 2, 0, 0, 0, 0] },
  { name: "Rising Disciples", played: 6, scores: [0, 0, 0, 2, 0, 0] },
];

const rankIcons = [
  <HiOutlineTrophy key="gold" className="text-lg" style={{ color: "#FFD700" }} />,
  <HiOutlineTrophy key="silver" className="text-lg" style={{ color: "#C0C0C0" }} />,
  <HiOutlineTrophy key="bronze" className="text-lg" style={{ color: "#CD7F32" }} />,
];

const sampleQuestions = [
  {
    q: "How many chapters are in the book of Jonah?",
    a: "4 chapters.",
  },
  {
    q: "What did God send to swallow Jonah?",
    a: "A great fish (whale).",
  },
  {
    q: "How many days was Jonah inside the fish?",
    a: "3 days and 3 nights.",
  },
  {
    q: "Fill in the blank: \"For it is by ____ you have been saved, through faith.\" (Ephesians 2:8)",
    a: "Grace.",
  },
  {
    q: "According to Ephesians 6, what is the first piece of the armor of God?",
    a: "The belt of truth.",
  },
  {
    q: "Who was the queen in the book of Esther?",
    a: "Queen Esther (also known as Hadassah).",
  },
  {
    q: "Who was the king in the book of Esther?",
    a: "King Xerxes (Ahasuerus).",
  },
  {
    q: "What did Haman plot to do to the Jews?",
    a: "He plotted to destroy and annihilate them.",
  },
  {
    q: "Who is the letter of Philemon written to?",
    a: "Philemon, a believer in Colossae.",
  },
  {
    q: "What does Paul ask Philemon to do for Onesimus?",
    a: "Welcome him back as a brother in Christ, not as a slave.",
  },
];

function HeroSection() {
  return (
    <section className="relative min-h-[55vh] md:min-h-[60vh] flex flex-col justify-evenly items-center text-center px-4 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1920&h=800&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(29,42,77,0.85) 0%, rgba(19,197,221,0.4) 100%)" }} />
      </div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #13c5dd 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="mb-4 flex justify-center">
          <div className="size-16 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: "rgba(19,197,221,0.2)", color: "#13c5dd" }}>
            <HiOutlineTrophy />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium text-white mb-3">
          Bible Quiz League
        </h1>
        <p className="text-sm md:text-base text-white/80 max-w-xl mx-auto mb-6">
          12 teams &middot; 3 players each &middot; 6 sessions per season &middot; Ages 10&ndash;15
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(19,197,221,0.3)", color: "#13c5dd" }}>Season 1: Aug&ndash;Oct 2026</span>
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(19,197,221,0.3)", color: "#13c5dd" }}>Season 2: Mar&ndash;May 2027</span>
        </div>
      </div>
    </section>
  );
}

function OverviewSection() {
  const stats = [
    { icon: <HiOutlineFlag />, label: "Teams", value: "12" },
    { icon: <HiOutlineUsers />, label: "Per Team", value: "3 Players" },
    { icon: <HiOutlineCalendarDays />, label: "Per Season", value: "6 Sessions" },
    { icon: <HiOutlineArrowRight className="rotate-180" />, label: "Seasons", value: "2 per Year" },
  ];

  return (
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-2">
            <HiOutlineStar className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-3xl font-medium" style={{ color: "#1d2a4d" }}>League at a Glance</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-lg p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "white" }}>
              <div className="flex justify-center mb-2 text-xl" style={{ color: "#13c5dd" }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold" style={{ color: "#13c5dd" }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: "#1d2a4d" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BooksSection() {
  const [scheduleFull, setScheduleFull] = useState(false);

  return (
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineBookOpen className="text-2xl md:text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-2xl md:text-3xl font-medium" style={{ color: "#1d2a4d" }}>What We&apos;re Studying</h2>
          <p className="text-xs md:text-sm mt-2 max-w-xl mx-auto" style={{ color: "#1d2a4d" }}>
            Study these books before each session to help your team win
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
          {books.map((b, i) => (
            <SlideUp key={i} delay={i * 80}>
              <div className="rounded-lg p-5 md:p-6 relative overflow-hidden" style={{ backgroundColor: b.season === "1" ? "#e9f7fa" : "#eef0f6" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: b.season === "1" ? "rgba(19,197,221,0.1)" : "rgba(29,42,77,0.06)" }} />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full text-white font-medium" style={{ backgroundColor: b.season === "1" ? "#13c5dd" : "#1d2a4d" }}>
                    Season {b.season}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1" style={{ color: "#1d2a4d" }}>{b.book}</h3>
                <p className="text-xs font-medium mb-2" style={{ color: "#13c5dd" }}>Chapters {b.chapters}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#1d2a4d" }}>{b.focus}</p>
              </div></SlideUp>
          ))}
        </div>

        <div className="mt-12 md:mt-14">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <HiOutlineCalendarDays className="text-lg md:text-xl" style={{ color: "#13c5dd" }} />
              <h3 className="text-lg md:text-xl font-bold" style={{ color: "#1d2a4d" }}>Session Schedule</h3>
            </div>
            <button
              onClick={() => setScheduleFull(!scheduleFull)}
              className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full transition-all hover:opacity-80 cursor-pointer border-0"
              style={{ backgroundColor: "#13c5dd", color: "white" }}
            >
              {scheduleFull ? "Minimal View" : "Full View"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg" style={{ boxShadow: "0 2px 12px rgba(29,42,77,0.08)" }}>
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1d2a4d" }}>
                  <th className={`p-2 md:p-3 text-white font-medium ${scheduleFull ? "" : "hidden"}`}>#</th>
                  <th className="p-2 md:p-3 text-white font-medium">Date</th>
                  <th className="p-2 md:p-3 text-white font-medium">Books</th>
                  <th className={`p-2 md:p-3 text-white font-medium ${scheduleFull ? "" : "hidden"}`}>Season</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.session} className="border-t" style={{ borderColor: "#eff5f9", color: "#1d2a4d" }}>
                    <td className={`p-2 md:p-3 font-bold ${scheduleFull ? "" : "hidden"}`}>{s.session}</td>
                    <td className="p-2 md:p-3">{s.date}</td>
                    <td className="p-2 md:p-3">{s.books}</td>
                    <td className={`p-2 md:p-3 ${scheduleFull ? "" : "hidden"}`}>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s.season === 1 ? "#13c5dd" : "#1d2a4d" }}>
                        Season {s.season}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeagueTableSection() {
  const [fullView, setFullView] = useState(false);

  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #eff5f9 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineTrophy className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-2xl md:text-3xl font-medium" style={{ color: "#1d2a4d" }}>Leaderboard</h2>
          <p className="text-xs md:text-sm mt-2" style={{ color: "#1d2a4d" }}>
            Updated after each quiz session
          </p>
          <button
            onClick={() => setFullView(!fullView)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full transition-all hover:opacity-80 cursor-pointer border-0"
            style={{ backgroundColor: "#13c5dd", color: "white" }}
          >
            {fullView ? "Minimal View" : "Full View"}
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 4px 20px rgba(29,42,77,0.1)" }}>
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr style={{ backgroundColor: "#1d2a4d" }}>
                <th className="p-2 md:p-3 text-white font-medium">#</th>
                <th className="p-2 md:p-3 text-white font-medium">Team</th>
                <th className="p-2 md:p-3 text-white font-medium text-center">P</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S1</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S2</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S3</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S4</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S5</th>
                <th className={`p-2 md:p-3 text-white font-medium text-center ${fullView ? "" : "hidden"}`}>S6</th>
                <th className="p-2 md:p-3 text-white font-medium text-center">GPA</th>
              </tr>
            </thead>
            <tbody>
              {teams
                .map((t) => ({ ...t, gpa: t.scores.reduce((a, b) => a + b, 0) / t.scores.length }))
                .sort((a, b) => b.gpa - a.gpa)
                .map((team, i) => {
                const rowColors = [
                  "rgba(255,215,0,0.12)",
                  "rgba(192,192,192,0.12)",
                  "rgba(205,127,50,0.12)",
                ];
                return (
                  <tr key={team.name} className="border-t transition-all" style={{
                    borderColor: "#eff5f9",
                    color: "#1d2a4d",
                    backgroundColor: i < 3 ? rowColors[i] : "white",
                  }}>
                    <td className="p-2 md:p-3 text-center">
                      <div className="flex justify-center">
                        {i < 3 ? (
                          <span style={{ color: [ "#FFD700", "#C0C0C0", "#CD7F32" ][i] }}>
                            {rankIcons[i]}
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm font-bold" style={{ color: "#1d2a4d" }}>{i + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 md:p-3 font-bold text-xs md:text-sm">{team.name}</td>
                    <td className="p-2 md:p-3 text-center">{team.played}</td>
                    {team.scores.map((score, si) => (
                      <td key={si} className={`p-2 md:p-3 text-center font-medium ${fullView ? "" : "hidden"}`} style={{ color: score === 2 ? "#13c5dd" : "#1d2a4d" }}>{score}</td>
                    ))}
                    <td className="p-2 md:p-3 text-center font-bold text-xs md:text-sm" style={{ color: "#1d2a4d" }}>{team.gpa.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3 text-center" style={{ color: "#1d2a4d" }}>
          S1&ndash;S6 = score per session (2 = win, 0 = loss) &middot; GPA = average per session
        </p>
      </div>
    </section>
  );
}

function PrizesSection() {
  const prizes = [
    {
      rank: "1st",
      label: "Champion",
      accent: "#13c5dd",
      medalColor: "#FFD700",
      items: ["Trophy", "Gold Medal", "Relate-branded notebook", "Relate pen", "Relate mug", "Relate plate"],
    },
    {
      rank: "2nd",
      label: "Runner-up",
      accent: "#1d2a4d",
      medalColor: "#C0C0C0",
      items: ["Silver Medal", "Relate-branded notebook", "Relate pen", "Relate mug"],
    },
    {
      rank: "3rd",
      label: "Second Runner-up",
      accent: "#13c5dd",
      medalColor: "#CD7F32",
      items: ["Bronze Medal", "Relate-branded notebook", "Relate pen"],
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineStar className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-3xl font-medium" style={{ color: "#1d2a4d" }}>Prizes</h2>
          <p className="text-sm mt-2" style={{ color: "#1d2a4d" }}>
            Top 3 teams at the end of Season 2 take home Relate-branded goodies
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {prizes.map((p, i) => (
            <div
              key={p.rank}
              className="rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 flex flex-col items-center"
              style={{ backgroundColor: "white", border: `1px solid rgba(19,197,221,0.2)` }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <HiOutlineTrophy className="text-2xl" style={{ color: p.medalColor }} />
                <HiOutlineStar className="text-lg" style={{ color: p.medalColor }} />
              </div>
              <div
                className="inline-flex items-center justify-center rounded-full text-xs font-bold text-white px-4 py-1 mb-2"
                style={{ backgroundColor: p.accent }}
              >
                {p.rank} Place
              </div>
              <div className="text-sm font-medium mb-4" style={{ color: "#1d2a4d" }}>{p.label}</div>
              <ul className="space-y-2 w-full text-left max-w-[200px] mx-auto">
                {p.items.map((item, j) => {
                  const isMedal = item.includes("Medal");
                  const isTrophy = item === "Trophy";
                  return (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "#1d2a4d" }}>
                      <span className="shrink-0 flex items-center justify-center size-4">
                        {isTrophy || isMedal ? (
                          <span style={{ color: p.medalColor }}>
                            {isTrophy ? <HiOutlineTrophy /> : <HiOutlineStar />}
                          </span>
                        ) : (
                          <HiOutlineCheckCircle style={{ color: "#13c5dd" }} />
                        )}
                      </span>
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SampleQuestionsSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineLightBulb className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-3xl font-medium" style={{ color: "#1d2a4d" }}>Practice Questions</h2>
          <p className="text-sm mt-2" style={{ color: "#1d2a4d" }}>
            Tap a question to reveal the answer
          </p>
        </div>
        <div className="space-y-3">
          {sampleQuestions.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isOpen ? "#e9f7fa" : "#eff5f9",
                  boxShadow: isOpen ? "0 0 0 2px #13c5dd" : "none",
                }}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="shrink-0 mt-0.5 flex">
                    {isOpen ? (
                      <HiOutlineLightBulb className="text-lg" style={{ color: "#13c5dd" }} />
                    ) : (
                      <HiOutlineQuestionMarkCircle className="text-lg" style={{ color: "#1d2a4d" }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed font-medium" style={{ color: "#1d2a4d" }}>{item.q}</p>
                    {isOpen && (
                      <p className="text-sm leading-relaxed mt-3 pt-3 border-t font-medium flex items-center gap-1.5" style={{ color: "#13c5dd", borderColor: "rgba(19,197,221,0.25)" }}>
                        <HiOutlineCheckCircle />
                        <span>{item.a}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-3 flex items-center gap-1 text-xs" style={{ color: isOpen ? "#1d2a4d" : "#13c5dd" }}>
                  {isOpen ? "Tap to hide" : "Tap to reveal"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RegistrationCTA() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [member2, setMember2] = useState("");
  const [member3, setMember3] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const registration = { teamName, name, phone, member2, member3 };
    console.log("Registration data (backend pending):", registration);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-20 px-4 relative overflow-hidden" style={{ backgroundColor: "#eff5f9" }}>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="rounded-xl p-8 md:p-12 text-center" style={{ backgroundColor: "#1d2a4d" }}>
            <HiOutlineCheckCircle className="text-4xl mx-auto mb-4" style={{ color: "#13c5dd" }} />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Registration Received!</h2>
            <p className="text-sm text-white/70 max-w-md mx-auto">
              Your team <strong style={{ color: "#13c5dd" }}>{teamName}</strong> has been registered. We will confirm your spot soon.
            </p>
            <button
              onClick={() => { setSubmitted(false); setName(""); setPhone(""); setTeamName(""); setMember2(""); setMember3(""); }}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 cursor-pointer border-0"
              style={{ backgroundColor: "#13c5dd" }}
            >
              Register Another Team
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 px-4 relative overflow-hidden" style={{ backgroundColor: "#eff5f9" }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #13c5dd 2px, transparent 2px)", backgroundSize: "30px 30px" }} />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="rounded-xl p-8 md:p-12 relative overflow-hidden" style={{ backgroundColor: "#1d2a4d" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/3 translate-x-1/3" style={{ backgroundColor: "rgba(19,197,221,0.1)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/3 -translate-x-1/3" style={{ backgroundColor: "rgba(19,197,221,0.06)" }} />
          <div className="relative z-10">
            <div className="text-center mb-2">
              <div className="flex justify-center mb-2">
                <HiOutlineTrophy className="text-3xl" style={{ color: "#13c5dd" }} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Register Your Squad</h2>
              <p className="text-sm text-white/70 mt-1 max-w-md mx-auto">
                Grab 2 friends, pick a team name, and secure your spot. Only 12 teams get in!
              </p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-8 space-y-4">
              <div>
                <label className="block text-xs mb-1 text-white/80 font-medium">Team Name</label>
                <select
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 appearance-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                  required
                >
                  <option value="" disabled style={{ color: "#1d2a4d" }}>Select your team</option>
                  {teams.map((t) => (
                    <option key={t.name} value={t.name} style={{ color: "#1d2a4d" }}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1 text-white/80 font-medium">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-white/80 font-medium">Your Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                    placeholder="+27 XXX XXX XXX"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1 text-white/80 font-medium">Team Member 2</label>
                <input
                  type="text"
                  value={member2}
                  onChange={(e) => setMember2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-white/80 font-medium">Team Member 3</label>
                <input
                  type="text"
                  value={member3}
                  onChange={(e) => setMember3(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 cursor-pointer border-0"
                style={{ backgroundColor: "#13c5dd", boxShadow: "0 4px 14px rgba(19,197,221,0.35)" }}
              >
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function QuizPage() {
  return (
    <>
      <HeroSection />
      <OverviewSection />
      <PrizesSection />
      <BooksSection />
      <LeagueTableSection />
      <SampleQuestionsSection />
      <RegistrationCTA />
    </>
  );
}
