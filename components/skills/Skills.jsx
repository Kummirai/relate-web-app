"use client";

import { useState } from "react";
import { HiOutlineLightBulb, HiOutlineHeart, HiOutlineUserGroup, HiOutlineArrowRight, HiOutlineBriefcase, HiOutlineScissors, HiOutlineWrench, HiOutlineSparkles, HiOutlineAcademicCap } from "react-icons/hi2";
import { LiaLaptopCodeSolid } from "react-icons/lia";
import { MdOutlineBakeryDining, MdOutlinePlumbing } from "react-icons/md";

const skills = [
  {
    icon: <HiOutlineBriefcase />,
    title: "Entrepreneurial",
    slug: "entrepreneurial",
    desc: "Business basics, financial literacy, marketing, and starting a small enterprise.",
    img: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=600&h=400&auto=format&fit=crop",
  },
  {
    icon: <MdOutlineBakeryDining />,
    title: "Baking",
    slug: "baking",
    desc: "Bread, pastries, cakes, and other baked goods — from basic recipes to advanced techniques.",
    img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&h=400&auto=format&fit=crop",
  },
  {
    icon: <HiOutlineScissors />,
    title: "Sewing",
    slug: "sewing",
    desc: "Mending, tailoring, dressmaking, and creative fabric projects for everyday use.",
    img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&h=400&auto=format&fit=crop",
  },
  {
    icon: <LiaLaptopCodeSolid />,
    title: "Programming",
    slug: "programming",
    desc: "Web development, mobile apps, automation, and basic computer literacy.",
    img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600&h=400&auto=format&fit=crop",
  },
  {
    icon: <MdOutlinePlumbing />,
    title: "Plumbing",
    slug: "plumbing",
    desc: "Pipe repairs, fixture installation, drainage solutions, and essential home maintenance.",
    img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&h=400&auto=format&fit=crop",
  },
  {
    icon: <HiOutlineSparkles />,
    title: "Basic Life Skills",
    slug: "life-skills",
    desc: "Cooking, cleaning, budgeting, time management, and other foundational skills for daily living.",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&h=400&auto=format&fit=crop",
  },
];

const skillCategories = [
  { id: 1, skill: "Entrepreneurial (Business, Marketing, Finance)", value: "entrepreneurial" },
  { id: 2, skill: "Baking & Culinary", value: "baking" },
  { id: 3, skill: "Sewing & Tailoring", value: "sewing" },
  { id: 4, skill: "Programming & Technology", value: "programming" },
  { id: 5, skill: "Plumbing & Home Maintenance", value: "plumbing" },
  { id: 6, skill: "Basic Life Skills", value: "life_skills" },
  { id: 7, skill: "Other (Please Specify)", value: "other" },
];

function HeroSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden flex flex-col items-center justify-evenly px-4 py-16">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(29,42,77,0.9) 0%, rgba(29,42,77,0.55) 100%)" }} />
      </div>

      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs mb-6" style={{ backgroundColor: "rgba(239,245,249,0.9)", color: "#13c5dd" }}>
          <HiOutlineHeart className="text-sm" />
          <span>Community-Powered Skills Exchange</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-medium leading-tight text-white">
          Share Your Skills.
          <br />
          <span style={{ color: "#13c5dd" }}>
            Strengthen Our Community.
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-xl mx-auto mt-6 leading-relaxed" style={{ color: "#eff5f9" }}>
          Every skill you share plants a seed of growth in someone else&apos;s life.
          Whether you&apos;re teaching baking, mentoring in plumbing, or guiding in
          entrepreneurship — your knowledge becomes a gift that keeps giving.
        </p>
      </div>
    </section>
  );
}

function SkillsCards() {
  return (
    <section id="skills" className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #eff5f9 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Available Skills
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Practical skills that build self-reliance and community strength — from baking and sewing to programming and plumbing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, i) => (
            <div
              key={i}
              className="group rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="overflow-hidden">
                <img
                  src={skill.img}
                  alt={skill.title}
                  className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}>
                    {skill.icon}
                  </div>
                  <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>
                    {skill.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#1d2a4d" }}>
                  {skill.desc}
                </p>
                <a
                  href={`/resources?skill=${skill.slug}`}
                  className="inline-block text-sm px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#13c5dd" }}
                >
                  View Resources
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PurposeSection() {
  const reasons = [
    {
      icon: <HiOutlineAcademicCap />,
      title: "Grow Together",
      desc: "When you teach, you reinforce your own knowledge. When you learn, you open new doors. Everyone benefits when skills circulate freely in the community.",
    },
    {
      icon: <HiOutlineHeart />,
      title: "Give Back",
      desc: "Your skills can transform someone's life — whether it's helping them start a small business, fix a leak, or bake bread to feed their family.",
    },
    {
      icon: <HiOutlineUserGroup />,
      title: "Build Community",
      desc: "Skills exchange creates real connections. It's not just about what you learn — it's about who you meet and the relationships you build along the way.",
    },
  ];

  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(ellipse at 30% 50%, #13c5dd 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, #13c5dd 0%, transparent 50%)" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium text-white">
            Why Share Skills?
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#13c5dd" }}>
            Skills exchange is about more than learning — it&apos;s about lifting each other up.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((reason, i) => (
            <div key={i} className="text-center rounded-lg p-6 md:p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-14 rounded-lg flex items-center justify-center text-2xl mx-auto mb-5" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                {reason.icon}
              </div>
              <h3 className="text-lg font-medium mb-3" style={{ color: "#1d2a4d" }}>
                {reason.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                {reason.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { number: "01", title: "Choose Your Path", desc: "Decide whether you want to learn a new skill or share one you already have. Browse the categories to find what interests you." },
    { number: "02", title: "Get Connected", desc: "Fill out the form and tell us about yourself. We&apos;ll match you with the right people based on your interests and availability." },
    { number: "03", title: "Grow Together", desc: "Start learning or teaching in a supportive community environment. Build skills, confidence, and lasting relationships." },
  ];

  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(160deg, white 0%, #f0f6fa 50%, white 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            How It Works
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Three simple steps to start sharing and growing your skills.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#eff5f9" }}>
                <span className="text-lg font-medium" style={{ color: "#13c5dd" }}>{step.number}</span>
              </div>
              <div className="absolute top-8 left-[calc(50%+3rem)] hidden md:block w-[calc(100%-6rem)] h-px" style={{ backgroundColor: "#13c5dd", opacity: 0.3 }} />
              <h3 className="text-lg font-medium mb-3" style={{ color: "#1d2a4d" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#1d2a4d" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FormSection() {
  const [mode, setMode] = useState("learn");

  return (
    <section id="form" className="py-16 md:py-20 px-4" style={{ background: "radial-gradient(ellipse at 50% 0%, #eff5f9 0%, white 70%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Get Started Today
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Ready to share or learn a skill? Fill out the form below and we&apos;ll connect you with the right people.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg p-6 md:p-8" style={{ backgroundColor: "white" }}>
            <div className="flex rounded-lg p-1 mb-8" style={{ backgroundColor: "#eff5f9" }}>
              <button
                onClick={() => setMode("learn")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "learn" ? "bg-white shadow-sm" : "hover:opacity-70"}`}
                style={{ color: mode === "learn" ? "#13c5dd" : "#1d2a4d" }}
              >
                I Want to Learn
              </button>
              <button
                onClick={() => setMode("teach")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "teach" ? "bg-white shadow-sm" : "hover:opacity-70"}`}
                style={{ color: mode === "teach" ? "#13c5dd" : "#1d2a4d" }}
              >
                I Want to Teach
              </button>
            </div>

            <form className="flex flex-col gap-5 text-sm">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#1d2a4d" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg outline-none"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d", border: "1px solid transparent" }}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#1d2a4d" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg outline-none"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d", border: "1px solid transparent" }}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#1d2a4d" }}>
                  {mode === "learn" ? "Skill I Want to Learn" : "Skill I Can Teach"}
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-lg outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: "#eff5f9", color: "#1d2a4d", border: "1px solid transparent" }}
                    defaultValue=""
                    required
                  >
                    <option value="" disabled hidden>
                      {mode === "learn" ? "Select a skill to learn" : "Select a skill to teach"}
                    </option>
                    {skillCategories.map((category) => (
                      <option key={category.id} value={category.value}>
                        {category.skill}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5l5 5 5-5" stroke="#1d2a4d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#1d2a4d" }}>
                  {mode === "learn" ? "Why This Skill?" : "About Your Offer"}
                </label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg outline-none resize-none leading-relaxed"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d", border: "1px solid transparent" }}
                  placeholder={
                    mode === "learn"
                      ? "Tell us why you want to learn this skill and your experience level..."
                      : "Describe what you can teach and your experience level..."
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                {mode === "learn" ? "Submit Learning Request" : "Submit Teaching Offer"}
              </button>

              <p className="text-xs text-center" style={{ color: "#1d2a4d" }}>
                {mode === "learn"
                  ? "We'll connect you with someone who can help."
                  : "Your offer will help someone in our community grow."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="rounded-lg px-8 py-12 md:py-16" style={{ background: "linear-gradient(135deg, #1d2a4d 0%, #1d2a4d 100%)" }}>
          <HiOutlineLightBulb className="text-4xl mx-auto mb-4" style={{ color: "#13c5dd" }} />
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: "#13c5dd" }}>
            Every skill shared is a life impacted. Join our community today and start making a difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#form"
              className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "#13c5dd" }}
            >
              <span>Join Skills Exchange</span>
              <HiOutlineArrowRight className="text-base" />
            </a>
            <a
              href="mailto:ajaxmilton@hotmail.com"
              className="text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-80"
              style={{ border: "1px solid #13c5dd", color: "white" }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SkillsPage() {
  return (
    <>
      <HeroSection />
      <SkillsCards />
      <PurposeSection />
      <HowItWorks />
      <FormSection />
      <ClosingCTA />
    </>
  );
}
