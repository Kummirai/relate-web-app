"use client";

import { useState } from "react";
import {
  HiOutlineBookOpen, HiOutlineTrophy, HiOutlineCalendarDays, HiOutlineUsers,
  HiOutlineLightBulb, HiOutlineArrowRight, HiOutlineClock, HiOutlineMapPin,
  HiOutlineStar, HiOutlineQuestionMarkCircle, HiOutlineFlag, HiOutlineHeart,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const books = [
  { book: "Gospel of John", chapters: "1–21", season: "1", focus: "The divinity of Christ, the I AM statements, the Farewell Discourse" },
  { book: "Acts of the Apostles", chapters: "1–15", season: "1", focus: "The birth of the church, Pentecost, Peter's ministry, the Jerusalem Council" },
  { book: "Acts of the Apostles", chapters: "16–28", season: "2", focus: "Paul's missionary journeys, trials, and journey to Rome" },
  { book: "Romans", chapters: "1–8", season: "2", focus: "Salvation by faith, grace, sin, and life in the Spirit" },
];

const sessions = [
  { session: 1, date: "March 15, 2026", books: "John 1–10", season: 1 },
  { session: 2, date: "April 19, 2026", books: "John 11–21", season: 1 },
  { session: 3, date: "May 17, 2026", books: "Acts 1–15", season: 1 },
  { session: 4, date: "July 12, 2026", books: "Acts 16–28", season: 2 },
  { session: 5, date: "August 16, 2026", books: "Romans 1–4", season: 2 },
  { session: 6, date: "September 13, 2026", books: "Romans 5–8", season: 2 },
];

const teams = [
  { name: "Faithful Warriors", played: 6, won: 5, lost: 1, points: 10 },
  { name: "Scripture Seekers", played: 6, won: 5, lost: 1, points: 10 },
  { name: "Light of the Word", played: 6, won: 4, lost: 2, points: 8 },
  { name: "Bible Champions", played: 6, won: 4, lost: 2, points: 8 },
  { name: "Grace Defenders", played: 6, won: 3, lost: 3, points: 6 },
  { name: "Truth Bearers", played: 6, won: 3, lost: 3, points: 6 },
  { name: "Living Stones", played: 6, won: 3, lost: 3, points: 6 },
  { name: "Salt & Light", played: 6, won: 2, lost: 4, points: 4 },
  { name: "Bread of Life", played: 6, won: 2, lost: 4, points: 4 },
  { name: "New Creation", played: 6, won: 2, lost: 4, points: 4 },
  { name: "Mighty Vessels", played: 6, won: 1, lost: 5, points: 2 },
  { name: "Rising Disciples", played: 6, won: 1, lost: 5, points: 2 },
];

const rankIcons = [
  <HiOutlineTrophy key="gold" className="text-lg" style={{ color: "#FFD700" }} />,
  <HiOutlineTrophy key="silver" className="text-lg" style={{ color: "#C0C0C0" }} />,
  <HiOutlineTrophy key="bronze" className="text-lg" style={{ color: "#CD7F32" }} />,
];

const sampleQuestions = [
  {
    q: "How many chapters are there in the Gospel of John?",
    a: "21 chapters.",
  },
  {
    q: "Fill in the blank: \"In the beginning was the ____, and the ____ was with God, and the ____ was God.\" (John 1:1)",
    a: "Word.",
  },
  {
    q: "How many baskets of leftovers were collected after Jesus fed the 5,000?",
    a: "12 baskets.",
  },
  {
    q: "What is the name of the man born blind whom Jesus healed in John 9?",
    a: "The text does not give his name; he is simply referred to as 'the man born blind.'",
  },
  {
    q: "In Acts 2, what sign accompanied the coming of the Holy Spirit at Pentecost?",
    a: "A sound like a mighty rushing wind and tongues of fire resting on each of them.",
  },
  {
    q: "Which disciple was added to replace Judas Iscariot?",
    a: "Matthias.",
  },
  {
    q: "Who was the first Christian martyr?",
    a: "Stephen.",
  },
  {
    q: "In Romans 3:23, what does Paul say about all people?",
    a: "\"For all have sinned and fall short of the glory of God.\"",
  },
  {
    q: "According to Romans 6:23, what is the wage of sin and what is the gift of God?",
    a: "The wage of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.",
  },
  {
    q: "Name three of the seven miracles (signs) recorded in the Gospel of John.",
    a: "Water into wine (John 2), healing the official's son (John 4), healing the invalid at Bethesda (John 5), feeding the 5,000 (John 6), walking on water (John 6), healing the man born blind (John 9), raising Lazarus (John 11).",
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
          12 teams &middot; 3 players each &middot; 6 sessions &middot; Ages 10&ndash;15
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(19,197,221,0.3)", color: "#13c5dd" }}>Season 1: Mar&ndash;May</span>
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(19,197,221,0.3)", color: "#13c5dd" }}>Season 2: Jul&ndash;Sep</span>
        </div>
      </div>
    </section>
  );
}

function OverviewSection() {
  const stats = [
    { icon: <HiOutlineFlag />, label: "Teams", value: "12" },
    { icon: <HiOutlineUsers />, label: "Per Team", value: "3 Players" },
    { icon: <HiOutlineCalendarDays />, label: "Sessions", value: "6" },
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
  return (
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineBookOpen className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-3xl font-medium" style={{ color: "#1d2a4d" }}>What We&apos;re Studying</h2>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "#1d2a4d" }}>
            Study these books before each session to help your team win
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {books.map((b, i) => (
            <div key={i} className="rounded-lg p-6 relative overflow-hidden" style={{ backgroundColor: b.season === "1" ? "#e9f7fa" : "#eef0f6" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: b.season === "1" ? "rgba(19,197,221,0.1)" : "rgba(29,42,77,0.06)" }} />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full text-white font-medium" style={{ backgroundColor: b.season === "1" ? "#13c5dd" : "#1d2a4d" }}>
                  Season {b.season}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#1d2a4d" }}>{b.book}</h3>
              <p className="text-xs font-medium mb-2" style={{ color: "#13c5dd" }}>Chapters {b.chapters}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#1d2a4d" }}>{b.focus}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HiOutlineCalendarDays className="text-xl" style={{ color: "#13c5dd" }} />
            <h3 className="text-xl font-bold" style={{ color: "#1d2a4d" }}>Session Schedule</h3>
          </div>
          <div className="overflow-x-auto rounded-lg" style={{ boxShadow: "0 2px 12px rgba(29,42,77,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1d2a4d" }}>
                  <th className="p-3 text-white font-medium">#</th>
                  <th className="p-3 text-white font-medium">Date</th>
                  <th className="p-3 text-white font-medium">Books</th>
                  <th className="p-3 text-white font-medium">Season</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.session} className="border-t" style={{ borderColor: "#eff5f9", color: "#1d2a4d" }}>
                    <td className="p-3 font-bold">{s.session}</td>
                    <td className="p-3">{s.date}</td>
                    <td className="p-3">{s.books}</td>
                    <td className="p-3">
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
  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #eff5f9 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            <HiOutlineTrophy className="text-3xl" style={{ color: "#13c5dd" }} />
          </div>
          <h2 className="text-3xl font-medium" style={{ color: "#1d2a4d" }}>Leaderboard</h2>
          <p className="text-sm mt-2" style={{ color: "#1d2a4d" }}>
            Updated after each quiz session
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl" style={{ boxShadow: "0 4px 20px rgba(29,42,77,0.1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#1d2a4d" }}>
                <th className="p-3 text-white font-medium">Rank</th>
                <th className="p-3 text-white font-medium">Team</th>
                <th className="p-3 text-white font-medium text-center">P</th>
                <th className="p-3 text-white font-medium text-center">W</th>
                <th className="p-3 text-white font-medium text-center">L</th>
                <th className="p-3 text-white font-medium text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => {
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
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {i < 3 ? (
                          <span style={{ color: [ "#FFD700", "#C0C0C0", "#CD7F32" ][i] }}>
                            {rankIcons[i]}
                          </span>
                        ) : (
                          <span className="text-sm font-bold" style={{ color: "#1d2a4d" }}>{i + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{team.name}</td>
                    <td className="p-3 text-center">{team.played}</td>
                    <td className="p-3 text-center" style={{ color: "#13c5dd", fontWeight: 600 }}>{team.won}</td>
                    <td className="p-3 text-center">{team.lost}</td>
                    <td className="p-3 text-center font-bold text-lg" style={{ color: i < 3 ? "#1d2a4d" : "#13c5dd" }}>{team.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-4 text-center" style={{ color: "#1d2a4d" }}>
          Win = 2 pts, Loss = 0
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `Bible Quiz League Registration\nTeam: ${teamName}\nContact: ${name}\nPhone: ${phone}\nTeam Members: ${name}, ${member2}, ${member3}`;
    const url = `https://wa.me/27782677436?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

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
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                  placeholder="e.g. Faithful Warriors"
                  required
                />
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
                Register via WhatsApp
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
