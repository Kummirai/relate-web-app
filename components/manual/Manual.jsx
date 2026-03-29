"use client";

import { useState, useEffect, useRef } from "react";

const chapters = [
  {
    id: "welcome",
    number: "00",
    title: "Welcome & Introduction",
    icon: "◎",
    content: `Welcome to Relate. This handbook serves as your guide to understanding the heart, mind, and operational framework of our organization. Whether you are a board member, a volunteer, a sponsor, or a community partner, you are now part of a mission dedicated to transforming lives through sustainable empowerment.\n\nRelate exists at the intersection of compassion and practical action. We believe that every individual and family possesses inherent strength and potential. Our role is not to create dependence but to help you be self-reliant and sustainable — this is the promise of our mission statement.\n\nThis document outlines our core objectives, the values that guide our every interaction, the structure of our leadership, and the detailed responsibilities of each role. Please familiarize yourself with its contents, as they form the foundation of our shared commitment to serving the less privileged in our community.`,
    sections: [],
  },
  {
    id: "identity",
    number: "01",
    title: "Our Identity",
    icon: "◈",
    content: null,
    sections: [
      {
        title: "Organization Name: Relate",
        body: `The name "Relate" signifies our foundational principle: authentic, supportive relationships. We believe lasting change happens through connection — relating to individuals' stories, struggles, and aspirations. We are not a distant charity; we are engaged partners.`,
      },
      {
        title: "Core Objectives",
        list: [
          "To Help the Less Privileged: We proactively identify and reach out to individuals and families facing systemic or circumstantial disadvantages.",
          "To Provide Mentoring: We establish one-on-one or group mentoring relationships to offer guidance, support, and skill development.",
          "To Attend to Social Needs: We address immediate and long-term social determinants of well-being, including food security, housing stability, educational access, and emotional health.",
          "To Guide to Relevant Authorities: We act as a knowledgeable bridge, connecting individuals with appropriate government agencies, non-profits, healthcare providers, and legal services.",
        ],
      },
      {
        title: "Mission Statement",
        body: `"To help you be self-reliant and sustainable." This mission is a commitment to an outcome, not just an activity. Every program, interaction, and resource is evaluated against this goal: does it move the individual or family closer to independence and long-term stability?`,
        highlight: true,
      },
      {
        title: "Core Values",
        tags: [
          "Empowerment over Aid",
          "Dignity in Every Interaction",
          "Integrity in Stewardship",
          "Sustainability in Solutions",
          "Community through Partnership",
        ],
      },
    ],
  },
  {
    id: "principles",
    number: "02",
    title: "Our Guiding Principles",
    icon: "◇",
    sections: [
      {
        title: "Compassionate Empowerment",
        body: `We lead with empathy but focus on activating an individual's own agency. We ask, "How can we help you achieve your goal?" rather than deciding unilaterally.`,
      },
      {
        title: "Dignity & Respect",
        body: `All service is rendered with utmost respect for privacy, cultural background, and personal autonomy. We practice active listening and uphold confidentiality.`,
      },
      {
        title: "Integrity & Stewardship",
        body: `We are transparent and accountable for all resources — financial, material, and human. Donations and time are used efficiently and for their intended purpose.`,
      },
      {
        title: "Sustainability & Self-Reliance",
        body: `We favor solutions that teach skills, create opportunities, and build networks, ensuring help today doesn't create a need for help tomorrow.`,
      },
      {
        title: "Community & Partnership",
        body: `We acknowledge we cannot do everything alone. We build strong networks with other organizations, businesses, and government entities to provide a web of support.`,
      },
    ],
  },
  {
    id: "governance",
    number: "03",
    title: "Leadership & Governance",
    icon: "◉",
    content: `Relate is governed by a Board of Directors, which holds ultimate responsibility for the organization's health, strategy, and fiduciary integrity. Day-to-day operations are managed by directors and their teams.`,
    sections: [
      {
        title: "The Relate Board",
        list: [
          "Chairman",
          "Family Liaison Director/s",
          "Secretary",
          "Treasurer",
          "Relate Sponsorship Director",
        ],
        note: "The Board meets quarterly to set policy, review programs, and ensure alignment with the mission.",
      },
      {
        title: "General Members & Volunteers",
        body: `General Members and Volunteers are the lifeblood of Relate, serving on teams (e.g., Family Liaison Team) and contributing to specific projects under the guidance of directors.`,
      },
    ],
  },
  {
    id: "roles",
    number: "04",
    title: "Role Descriptions",
    icon: "◐",
    sections: [
      {
        title: "Chairman",
        body: `Provides strategic leadership and chairs Board and annual meetings. Ensures the organization remains true to its mission, values, and objectives. Acts as the primary liaison for high-level community partners and stakeholders.`,
        badge: "Board",
      },
      {
        title: "Secretary",
        body: `Maintains all official records, minutes, and legal documents of Relate. Manages correspondence and official communication. Ensures timely notice is given for all meetings. Maintains the official member/volunteer roster and contact information.`,
        badge: "Board",
      },
      {
        title: "Treasurer / Resource Manager",
        body: `Manages all financial affairs, including budgeting, bookkeeping, and financial reporting. Ensures strict financial controls and compliance with relevant laws. Presents clear financial statements at each Board meeting.`,
        badge: "Board",
      },
      {
        title: "Family Liaison Director",
        body: `Leads the Family Liaison Team and oversees all direct client/family interactions. Develops and manages the intake and assessment process. Creates individualized support plans in collaboration with families.`,
        badge: "Director",
      },
      {
        title: "Family Liaison Team",
        body: `Conducts respectful home visits and assessments. Builds trusting, professional relationships with assigned individuals/families. Implements the support plan through regular check-ins, mentoring, and task assistance.`,
        badge: "Team",
      },
      {
        title: "Sponsorship Director",
        body: `Develops and manages programs for financial, employment, and entrepreneurial sponsorship. Cultivates relationships with potential sponsors. Creates pathways for job shadowing, internships, and skills training.`,
        badge: "Director",
      },
      {
        title: "Relate Sponsor",
        body: `Provides financial support, job opportunities, or entrepreneurial seed funding. May offer professional mentorship or networking connections. Commits to a relationship based on empowerment, not paternalism.`,
        badge: "Partner",
      },
    ],
  },
  {
    id: "performance",
    number: "05",
    title: "Performance Management",
    icon: "◑",
    sections: [
      {
        title: "Performance Expectations & Standards",
        list: [
          "Minimum service and attendance requirements",
          "Quality standards for client interactions",
          "Documentation and reporting expectations",
          "Team collaboration and communication standards",
          "Adherence to Relate values in all activities",
        ],
      },
      {
        title: "Supportive Intervention Process",
        stages: [
          {
            label: "Stage 1 — Days 1–30",
            name: "Informal Support",
            items: [
              "Private conversation with immediate supervisor",
              "Clarification of expectations and standards",
              "Identification of potential barriers",
              "Agreement on simple corrective actions",
            ],
          },
          {
            label: "Stage 2 — Days 31–60",
            name: "Formal Development Plan",
            items: [
              "Written Performance Improvement Plan (PIP)",
              "Specific, measurable goals with clear timelines",
              "Required training or skill development",
              "Weekly progress reviews",
            ],
          },
          {
            label: "Stage 3 — Days 61–90",
            name: "Board Review & Decision",
            items: [
              "Formal presentation to Board if improvement insufficient",
              "Consideration of extenuating circumstances",
              "Determination of next steps",
              "Compassionate but firm decision-making",
            ],
          },
        ],
      },
      {
        title: "Progressive Discipline",
        list: [
          "Verbal Warning — Documented conversation about specific concerns",
          "Written Warning — Formal letter outlining issues and required changes",
          "Probation Period — 30–60-day period with specific conditions",
          "Suspension — Temporary removal from duties",
          "Termination — Final step after all interventions exhausted",
        ],
      },
    ],
  },
  {
    id: "programs",
    number: "06",
    title: "Programs & Methodology",
    icon: "◒",
    sections: [
      {
        title: "The Intake Process",
        body: `A standardized but compassionate assessment identifies immediate crises, long-term challenges, strengths, and goals of the individual/family.`,
      },
      {
        title: "Mentoring Framework",
        body: `We match mentors and mentees based on goals, personality, and background. Mentors receive training and ongoing support.`,
      },
      {
        title: "Addressing Social Needs",
        body: `We use a "wraparound" model, coordinating multiple types of support — connecting a family with a food bank while helping a parent enrol in a vocational program.`,
      },
      {
        title: "Guidance and Referral",
        body: `We maintain an updated directory of vetted service providers (social services, medical, legal) and provide warm referrals — often making the initial contact with the individual.`,
      },
      {
        title: "The Sponsorship Pathway",
        body: `A structured program where sponsors invest in sustainable change: funding a certification course, providing a vehicle for work, or offering a small business loan with partnered mentorship.`,
      },
    ],
  },
  {
    id: "philosophy",
    number: "07",
    title: "Why We Help",
    icon: "◓",
    content: `Relate helps because we recognize our shared humanity and the interdependence of community. We believe that when one member struggles, the collective well-being is diminished. Our work is driven by a conviction that every person deserves the opportunity to live with dignity and hope.\n\nFurthermore, we operate on the principle of "teaching to fish." Alleviating immediate suffering is urgent and moral, but our deeper purpose is to break cycles of dependency and poverty. We are not just giving help; we are investing in the restoration of human potential.`,
    sections: [],
  },
  {
    id: "policies",
    number: "08",
    title: "Policies & Procedures",
    icon: "◔",
    sections: [
      {
        title: "Confidentiality Agreement",
        body: `All members will sign an agreement to protect the personal information of clients, sponsors, and other members. Breaches are taken seriously.`,
      },
      {
        title: "Conflict of Interest Policy",
        body: `Board members and directors must disclose any personal or business interests that could influence their decisions for Relate.`,
      },
      {
        title: "Resource Allocation Guidelines",
        body: `A clear process for approving financial assistance, ensuring it is fair, documented, and aligned with the mission of self-reliance.`,
      },
      {
        title: "Safety & Boundaries Protocol",
        body: `Guidelines for safe home visits, communication (e.g., using official channels, not personal social media), and maintaining professional boundaries at all times.`,
      },
    ],
  },
];

const badgeClass = {
  Board: "bg-amber-950 text-amber-400 border border-amber-800",
  Director: "bg-teal-950 text-teal-400 border border-teal-800",
  Team: "bg-violet-950 text-violet-400 border border-violet-800",
  Partner: "bg-rose-950 text-rose-400 border border-rose-800",
};

export default function RelateManual() {
  const [activeId, setActiveId] = useState("welcome");
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const mainRef = useRef(null);

  const chapter = chapters.find((c) => c.id === activeId);
  const activeIdx = chapters.findIndex((c) => c.id === activeId);
  const filtered = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.sections?.some((s) =>
        s.title?.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const go = (id) => {
    setActiveId(id);
    setAnimKey((k) => k + 1);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
      @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      .anim { animation: fadeUp 0.35s ease both; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #292a22; border-radius: 99px; }
      input::placeholder { color: #3f4035; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <section>
      <div
        className="flex h-screen overflow-hidden bg-stone-950 text-stone-200 max-w-6xl mx-auto"
        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
      >
        {/* ── Sidebar ── */}
        <aside
          className={`flex flex-col flex-shrink-0 border-r border-stone-800 bg-stone-950 transition-all duration-300 overflow-hidden ${open ? "w-72" : "w-14"}`}
        >
          {/* Logo row */}
          <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-stone-800">
            {open && (
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-amber-500 text-2xl leading-none flex-shrink-0">
                  ◎
                </span>
                <div className="min-w-0">
                  <p
                    className="text-stone-100 font-semibold tracking-wide truncate"
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 17,
                    }}
                  >
                    Relate
                  </p>
                  <p
                    className="text-stone-600 uppercase tracking-widest truncate"
                    style={{ fontSize: 9 }}
                  >
                    FamilyCare Handbook
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded border border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600 transition-colors text-xs"
            >
              {open ? "←" : "→"}
            </button>
          </div>

          {/* Search */}
          {open && (
            <div className="px-4 py-3 border-b border-stone-800">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chapters…"
                className="w-full bg-stone-900 border border-stone-800 rounded text-stone-300 px-3 py-1.5 outline-none focus:border-stone-600 transition-colors"
                style={{ fontFamily: "inherit", fontSize: 13 }}
              />
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => go(c.id)}
                title={!open ? c.title : undefined}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-l-2 transition-colors ${
                  activeId === c.id
                    ? "border-amber-500 bg-amber-950/20 text-amber-400"
                    : "border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/40"
                }`}
              >
                <span className="text-sm w-5 text-center flex-shrink-0">
                  {c.icon}
                </span>
                {open && (
                  <>
                    <span
                      className="font-mono text-stone-700 flex-shrink-0"
                      style={{ fontSize: 10 }}
                    >
                      {c.number}
                    </span>
                    <span className="truncate" style={{ fontSize: 13 }}>
                      {c.title}
                    </span>
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          {open && (
            <div className="px-4 py-3 border-t border-stone-800">
              <span
                className="font-mono text-stone-700 tracking-widest uppercase"
                style={{ fontSize: 10 }}
              >
                Version 1.0
              </span>
            </div>
          )}
        </aside>

        {/* ── Content ── */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Topbar */}
          <div className="flex items-center justify-between px-8 py-3 border-b border-stone-800 bg-stone-950/90 backdrop-blur-sm flex-shrink-0">
            <div
              className="flex items-center gap-2 text-stone-600"
              style={{ fontSize: 12 }}
            >
              <span>Relate Handbook</span>
              <span className="text-stone-800">/</span>
              <span className="text-stone-400">{chapter?.title}</span>
            </div>
            <span
              className="font-mono text-amber-600 border border-amber-900/50 px-3 py-0.5 rounded-sm tracking-widest"
              style={{ fontSize: 11 }}
            >
              Ch.&nbsp;{chapter?.number}
            </span>
          </div>

          {/* Scrollable body */}
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <div
              key={animKey}
              className="anim max-w-3xl mx-auto px-8 py-12 pb-24"
            >
              {/* Chapter header */}
              <div className="flex items-start gap-5 mb-10">
                <span
                  className="text-amber-500 flex-shrink-0 leading-none"
                  style={{ fontSize: 46, marginTop: 4 }}
                >
                  {chapter?.icon}
                </span>
                <div>
                  <p
                    className="font-mono text-stone-600 tracking-widest uppercase mb-1.5"
                    style={{ fontSize: 11 }}
                  >
                    Chapter {chapter?.number}
                  </p>
                  <h1
                    className="text-stone-100 font-normal leading-tight"
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 38,
                    }}
                  >
                    {chapter?.title}
                  </h1>
                </div>
              </div>

              {/* Intro text */}
              {chapter?.content && (
                <p
                  className="text-stone-400 leading-relaxed mb-12 pb-10 border-b border-stone-800 whitespace-pre-line"
                  style={{ fontSize: 16 }}
                >
                  {chapter.content}
                </p>
              )}

              {/* Sections */}
              {chapter?.sections?.map((sec, i) => (
                <div
                  key={i}
                  className="mb-10 pb-10 border-b border-stone-900 last:border-0 last:mb-0"
                >
                  {/* Section title + badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2
                      className="text-stone-300 font-normal"
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 20,
                      }}
                    >
                      {sec.title}
                    </h2>
                    {sec.badge && (
                      <span
                        className={`font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm ${badgeClass[sec.badge]}`}
                        style={{ fontSize: 10 }}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  {/* Highlight box */}
                  {sec.highlight && sec.body && (
                    <div className="bg-amber-950/20 border-l-4 border-amber-600 pl-6 pr-5 py-5 rounded-r-md">
                      <div
                        className="text-amber-800 leading-none mb-1"
                        style={{ fontSize: 44, fontFamily: "serif" }}
                      >
                        "
                      </div>
                      <p
                        className="text-amber-200/80 italic leading-relaxed"
                        style={{ fontSize: 16 }}
                      >
                        {sec.body}
                      </p>
                    </div>
                  )}

                  {/* Body */}
                  {!sec.highlight && sec.body && (
                    <p
                      className="text-stone-400 leading-relaxed"
                      style={{ fontSize: 15 }}
                    >
                      {sec.body}
                    </p>
                  )}

                  {/* Note */}
                  {sec.note && (
                    <p className="mt-3 text-stone-600 italic bg-stone-900 border border-stone-800 px-4 py-2.5 rounded text-sm">
                      ℹ&nbsp;{sec.note}
                    </p>
                  )}

                  {/* Tag pills */}
                  {sec.tags && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sec.tags.map((tag, ti) => (
                        <span
                          key={ti}
                          className="bg-stone-900 border border-stone-800 text-stone-500 px-3 py-1 rounded-full"
                          style={{ fontSize: 12 }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bullet list */}
                  {sec.list && (
                    <ul className="mt-3 space-y-2.5">
                      {sec.list.map((item, li) => (
                        <li
                          key={li}
                          className="flex gap-3 text-stone-400 leading-relaxed"
                          style={{ fontSize: 14 }}
                        >
                          <span
                            className="text-amber-600 flex-shrink-0 mt-1.5"
                            style={{ fontSize: 7 }}
                          >
                            ◆
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Stage cards */}
                  {sec.stages && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {sec.stages.map((stage, si) => (
                        <div
                          key={si}
                          className="bg-stone-900 border border-stone-800 rounded-md p-4"
                        >
                          <p
                            className="font-mono text-stone-600 uppercase tracking-wider mb-1"
                            style={{ fontSize: 10 }}
                          >
                            {stage.label}
                          </p>
                          <p
                            className="text-amber-500 font-medium mb-3"
                            style={{
                              fontFamily: "'Playfair Display',serif",
                              fontSize: 14,
                            }}
                          >
                            {stage.name}
                          </p>
                          <ul className="space-y-2">
                            {stage.items.map((item, ii) => (
                              <li
                                key={ii}
                                className="flex gap-2 text-stone-500 leading-snug"
                                style={{ fontSize: 12 }}
                              >
                                <span className="text-teal-500 flex-shrink-0">
                                  ✓
                                </span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom navigation */}
              <div className="flex items-center justify-between mt-16 pt-6 border-t border-stone-800">
                {activeIdx > 0 ? (
                  <button
                    onClick={() => go(chapters[activeIdx - 1].id)}
                    className="text-stone-500 hover:text-stone-300 border border-stone-800 hover:border-stone-600 px-4 py-2 rounded transition-colors text-sm"
                  >
                    ← Previous
                  </button>
                ) : (
                  <div />
                )}

                {/* Dot indicators */}
                <div className="flex items-center gap-1.5">
                  {chapters.map((c, ci) => (
                    <button
                      key={c.id}
                      onClick={() => go(c.id)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${ci === activeIdx ? "w-5 bg-amber-500" : "w-1.5 bg-stone-700 hover:bg-stone-500"}`}
                    />
                  ))}
                </div>

                {activeIdx < chapters.length - 1 ? (
                  <button
                    onClick={() => go(chapters[activeIdx + 1].id)}
                    className="text-amber-600 hover:text-amber-400 border border-amber-900/50 hover:border-amber-700/60 px-4 py-2 rounded transition-colors text-sm"
                  >
                    Next →
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
