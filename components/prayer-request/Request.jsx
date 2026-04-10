export default function Request() {
  const prayerCategories = [
    { id: 1, request: "Personal Healing", value: "personal_healing" },
    {
      id: 2,
      request: "Financial Breakthrough",
      value: "financial_breakthrough",
    },
    { id: 3, request: "Family Restoration", value: "family_restoration" },
    { id: 4, request: "Spiritual Growth", value: "spiritual_growth" },
    { id: 5, request: "Employment & Career", value: "employment_career" },
    {
      id: 6,
      request: "Mental & Emotional Wellbeing",
      value: "mental_emotional_wellbeing",
    },
    {
      id: 7,
      request: "Relationships & Marriage",
      value: "relationships_marriage",
    },
    { id: 8, request: "Children & Parenting", value: "children_parenting" },
    { id: 9, request: "Grief & Loss", value: "grief_loss" },
    { id: 10, request: "Housing & Shelter", value: "housing_shelter" },
    {
      id: 11,
      request: "Salvation & Faith Journey",
      value: "salvation_faith_journey",
    },
    {
      id: 12,
      request: "Community & Social Needs",
      value: "community_social_needs",
    },
  ];

  return (
    <section className="min-h-screen bg-[#FAF8F5]">
      {/* Decorative top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

      <div className="max-w-lg mx-auto px-6 pt-14 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Cross icon */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div className="absolute w-0.5 h-10 bg-amber-400 rounded-full" />
              <div className="absolute w-6 h-0.5 bg-amber-400 rounded-full -mt-2" />
            </div>
          </div>
          <h1
            className="text-4xl text-stone-900 mb-3 tracking-tight"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
            }}
          >
            Prayer Request
          </h1>
          <p
            className="text-[13px] text-stone-400 tracking-wide"
            style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
          >
            "Ask and it will be given to you" — Matthew 7:7
          </p>
          <p className="text-sm text-stone-500 mt-4">
            Or reach out to us directly at{" "}
            <a
              href="mailto:ajaxmilton@hotmail.com"
              className="text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              ajaxmilton@hotmail.com
            </a>
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-stone-200" />
          <div className="w-1 h-1 rounded-full bg-amber-400" />
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm shadow-stone-100 px-8 py-8">
          <form className="flex flex-col gap-5 text-sm">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Full Name
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 border border-stone-200 rounded-xl bg-stone-50 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0 text-stone-400"
                >
                  <path
                    d="M18.311 16.406a9.64 9.64 0 0 0-4.748-4.158 5.938 5.938 0 1 0-7.125 0 9.64 9.64 0 0 0-4.749 4.158.937.937 0 1 0 1.623.938c1.416-2.447 3.916-3.906 6.688-3.906 2.773 0 5.273 1.46 6.689 3.906a.938.938 0 0 0 1.622-.938M5.938 7.5a4.063 4.063 0 1 1 8.125 0 4.063 4.063 0 0 1-8.125 0"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="text"
                  className="h-full w-full outline-none bg-transparent text-stone-800 placeholder:text-stone-300 text-[14px]"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 border border-stone-200 rounded-xl bg-stone-50 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0 text-stone-400"
                >
                  <path
                    d="M17.5 3.438h-15a.937.937 0 0 0-.937.937V15a1.563 1.563 0 0 0 1.562 1.563h13.75A1.563 1.563 0 0 0 18.438 15V4.375a.94.94 0 0 0-.938-.937m-2.41 1.874L10 9.979 4.91 5.313zM3.438 14.688v-8.18l5.928 5.434a.937.937 0 0 0 1.268 0l5.929-5.435v8.182z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="email"
                  className="h-full w-full outline-none bg-transparent text-stone-800 placeholder:text-stone-300 text-[14px]"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Prayer Category
              </label>
              <div className="flex items-center gap-2.5 h-11 px-3.5 border border-stone-200 rounded-xl bg-stone-50 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0 text-stone-400"
                >
                  <path
                    d="M10 1.875a8.125 8.125 0 1 0 0 16.25A8.125 8.125 0 0 0 10 1.875m0 14.375a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5m2.813-6.25a2.813 2.813 0 1 1-5.626 0 2.813 2.813 0 0 1 5.625 0"
                    fill="currentColor"
                  />
                </svg>
                <select
                  className="h-full w-full outline-none bg-transparent text-stone-700 text-[14px] appearance-none cursor-pointer"
                  required
                >
                  {prayerCategories.map((category) => (
                    <option key={category.id} value={category.value}>
                      {category.request}
                    </option>
                  ))}
                </select>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0 text-stone-300 pointer-events-none"
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

            {/* Message */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Your Prayer Request
              </label>
              <textarea
                rows={6}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl bg-stone-50 resize-none outline-none text-[14px] text-stone-800 placeholder:text-stone-300 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all leading-relaxed"
                placeholder="Share your heart with us. Every request is held in prayer…"
                required
              />
            </div>

            {/* Privacy note */}
            <p
              className="text-[12px] text-stone-400 text-center -mt-1"
              style={{ fontStyle: "italic" }}
            >
              Your request is kept in confidence and lifted in prayer.
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="group relative mt-1 flex items-center justify-center gap-2 bg-stone-900 hover:bg-amber-800 text-white text-[13px] font-medium tracking-wide uppercase py-3.5 w-full rounded-xl transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Submit Prayer Request</span>
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

        {/* Footer note */}
        <p
          className="text-center text-[12px] text-stone-400 mt-8"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          We pray together. You are not alone.
        </p>
      </div>
    </section>
  );
}
