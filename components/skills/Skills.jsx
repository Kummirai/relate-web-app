"use client";

import { useState } from "react";

export default function Skills() {
  const [mode, setMode] = useState("learn");

  const skillCategories = [
    { id: 1, skill: "Music (Singing, Instruments, Production)", value: "music" },
    { id: 2, skill: "Art & Design", value: "art_design" },
    { id: 3, skill: "Photography & Video", value: "photography_video" },
    { id: 4, skill: "Writing & Content Creation", value: "writing_content" },
    { id: 5, skill: "Programming & Technology", value: "programming_tech" },
    { id: 6, skill: "Cooking & Baking", value: "cooking_baking" },
    { id: 7, skill: "Languages", value: "languages" },
    { id: 8, skill: "Sports & Fitness", value: "sports_fitness" },
    { id: 9, skill: "Business & Entrepreneurship", value: "business_entrepreneurship" },
    { id: 10, skill: "Academic Subjects", value: "academic_subjects" },
    { id: 11, skill: "Life Skills", value: "life_skills" },
    { id: 12, skill: "Other", value: "other" },
  ];

  return (
    <section className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 0%, #eff5f9 0%, white 70%)" }}>
      <div className="h-1 w-full" style={{ backgroundColor: "#13c5dd" }} />

      <div className="max-w-lg mx-auto px-6 pt-14 pb-24">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1
            className="text-4xl mb-3 tracking-tight"
            style={{
              color: "#1d2a4d",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
            }}
          >
            Skills Exchange
          </h1>
          <p
            className="text-[13px] tracking-wide"
            style={{ color: "#1d2a4d", fontFamily: "Georgia, serif", fontStyle: "italic" }}
          >
            Share what you know. Learn what you don&apos;t.
          </p>
          <p className="text-sm mt-4" style={{ color: "#1d2a4d" }}>
            Or reach out to us directly at{" "}
            <a
              href="mailto:ajaxmilton@hotmail.com"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#13c5dd" }}
            >
              ajaxmilton@hotmail.com
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px" style={{ backgroundColor: "#1d2a4d" }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#13c5dd" }} />
          <div className="flex-1 h-px" style={{ backgroundColor: "#1d2a4d" }} />
        </div>

        {/* Mode Toggle */}
        <div className="rounded-2xl px-8 pt-8 pb-6 mb-6" style={{ backgroundColor: "white" }}>
          <div className="flex rounded-xl p-1" style={{ backgroundColor: "#eff5f9" }}>
            <button
              onClick={() => setMode("learn")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "learn"
                  ? "bg-white shadow-sm"
                  : "hover:opacity-70"
              }`}
              style={{ color: mode === "learn" ? "#13c5dd" : "#1d2a4d" }}
            >
              I Want to Learn
            </button>
            <button
              onClick={() => setMode("teach")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "teach"
                  ? "bg-white shadow-sm"
                  : "hover:opacity-70"
              }`}
              style={{ color: mode === "teach" ? "#13c5dd" : "#1d2a4d" }}
            >
              I Want to Teach
            </button>
          </div>
        </div>

        <div className="rounded-2xl px-8 py-8" style={{ backgroundColor: "white" }}>
          <form className="flex flex-col gap-5 text-sm">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#1d2a4d" }}>
                Full Name
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl transition-all" style={{ border: "1px solid #13c5dd", backgroundColor: "#eff5f9" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0"
                  style={{ color: "#13c5dd" }}
                >
                  <path
                    d="M18.311 16.406a9.64 9.64 0 0 0-4.748-4.158 5.938 5.938 0 1 0-7.125 0 9.64 9.64 0 0 0-4.749 4.158.937.937 0 1 0 1.623.938c1.416-2.447 3.916-3.906 6.688-3.906 2.773 0 5.273 1.46 6.689 3.906a.938.938 0 0 0 1.622-.938M5.938 7.5a4.063 4.063 0 1 1 8.125 0 4.063 4.063 0 0 1-8.125 0"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="text"
                  className="h-full w-full outline-none bg-transparent text-[14px]"
                  style={{ color: "#1d2a4d" }}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#1d2a4d" }}>
                Email Address
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl transition-all" style={{ border: "1px solid #13c5dd", backgroundColor: "#eff5f9" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0"
                  style={{ color: "#13c5dd" }}
                >
                  <path
                    d="M17.5 3.438h-15a.937.937 0 0 0-.937.937V15a1.563 1.563 0 0 0 1.562 1.563h13.75A1.563 1.563 0 0 0 18.438 15V4.375a.94.94 0 0 0-.938-.937m-2.41 1.874L10 9.979 4.91 5.313zM3.438 14.688v-8.18l5.928 5.434a.937.937 0 0 0 1.268 0l5.929-5.435v8.182z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="email"
                  className="h-full w-full outline-none bg-transparent text-[14px]"
                  style={{ color: "#1d2a4d" }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#1d2a4d" }}>
                {mode === "learn" ? "Skill I Want to Learn" : "Skill I Can Teach"}
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl transition-all" style={{ border: "1px solid #13c5dd", backgroundColor: "#eff5f9" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0"
                  style={{ color: "#13c5dd" }}
                >
                  <path
                    d="M10 1.875a8.125 8.125 0 1 0 0 16.25A8.125 8.125 0 0 0 10 1.875m0 14.375a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5m2.813-6.25a2.813 2.813 0 1 1-5.626 0 2.813 2.813 0 0 1 5.625 0"
                    fill="currentColor"
                  />
                </svg>
                <select
                  className="h-full w-full outline-none bg-transparent text-[14px] appearance-none cursor-pointer"
                  style={{ color: "#1d2a4d" }}
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0 pointer-events-none"
                  style={{ color: "#13c5dd" }}
                >
                  <path
                    d="M5 7.5l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#1d2a4d" }}>
                {mode === "learn" ? "Why This Skill?" : "About Your Offer"}
              </label>
              <textarea
                rows={6}
                className="w-full px-3.5 py-3 rounded-xl resize-none outline-none text-[14px] transition-all leading-relaxed"
                style={{ border: "1px solid #13c5dd", backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                placeholder={
                  mode === "learn"
                    ? "Tell us why you want to learn this skill and your experience level..."
                    : "Describe what you can teach and your experience level..."
                }
                required
              />
            </div>

            <p
              className="text-[12px] text-center -mt-1"
              style={{ color: "#1d2a4d", fontStyle: "italic" }}
            >
              {mode === "learn"
                ? "We'll connect you with someone who can help."
                : "Your offer will help someone in our community grow."}
            </p>

            <button
              type="submit"
              className="group relative mt-1 flex items-center justify-center gap-2 text-white text-[13px] font-medium tracking-wide uppercase py-3.5 w-full rounded-xl transition-all duration-300 overflow-hidden hover:opacity-90"
              style={{ backgroundColor: "#13c5dd" }}
            >
              <span className="relative z-10">
                {mode === "learn" ? "Submit Learning Request" : "Submit Teaching Offer"}
              </span>
              <svg
                className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5"
                width="16"
                height="16"
                viewBox="0 0 21 20"
                fill="none"
              >
                <path
                  d="m18.038 10.663-5.625 5.625a.94.94 0 0 1-1.328-1.328l4.024-4.023H3.625a.938.938 0 0 1 0-1.875h11.484l-4.022-4.025a.94.94 0 0 1 1.328-1.328l5.625 5.625a.935.935 0 0 1-.002 1.33"
                  fill="#fff"
                />
              </svg>
            </button>
          </form>
        </div>

        <p
          className="text-center text-[12px] mt-8"
          style={{ color: "#1d2a4d", fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          Every skill shared strengthens our community.
        </p>
      </div>
    </section>
  );
}
