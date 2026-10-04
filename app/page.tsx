import Link from "next/link";
import {
  LuArrowUpRight,
  LuBookOpen,
  LuBraces,
  LuCode,
  LuFileJson,
  LuFlaskConical,
  LuFolderOpen,
  LuGauge,
  LuListTree,
  LuMail,
  LuShieldCheck,
  LuZap,
} from "react-icons/lu";

const BASE_URL = "https://relate-iota.vercel.app";

const sections = [
  { id: "api-docs", title: "Interactive docs", icon: LuFlaskConical },
  { id: "overview", title: "Overview", icon: LuBraces },
  { id: "base-url", title: "Base URL & access", icon: LuZap },
  { id: "endpoints", title: "Endpoints", icon: LuListTree },
  { id: "params", title: "Query parameters", icon: LuFolderOpen },
  { id: "examples", title: "Quick start", icon: LuCode },
  { id: "data", title: "Response shapes", icon: LuBookOpen },
  { id: "limits", title: "Rate limits & fair use", icon: LuGauge },
  { id: "support", title: "Support & stability", icon: LuMail },
] as const;

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
};

const endpointGroups: { name: string; endpoints: Endpoint[] }[] = [
  {
    name: "Magazines & Bulletins",
    endpoints: [
      {
        method: "GET",
        path: "/api/publications",
        title: "List publications",
        description:
          "Published magazines & bulletins, newest first. Content bodies (weeks/blocks) are stripped — use the single-publication route for full content.",
      },
      {
        method: "GET",
        path: "/api/publications/{id}",
        title: "Single publication",
        description:
          "One published magazine or bulletin by its stable id (e.g. rooted-kids-oct-2026), including its full weeks, days and interactive blocks.",
      },
      {
        method: "GET",
        path: "/api/reading-today",
        title: "Today's reading",
        description:
          "Finds the day to open for a club's guided reading: exact date, then next upcoming, then the first day — returns a compact deep-link target.",
      },
    ],
  },
  {
    name: "Reading Plans & Bible Study",
    endpoints: [
      {
        method: "GET",
        path: "/api/reading-plans",
        title: "List reading plans",
        description:
          "All reading plans with metadata — title, tagline, description, category, section, day count, gradient and cover image.",
      },
      {
        method: "GET",
        path: "/api/reading-plans/{slug}",
        title: "Plan with sections",
        description:
          "One reading plan plus its sections (book + chapter range), optional authored blocks, and a per-section quiz without answer keys.",
      },
    ],
  },
  {
    name: "Bible Quiz",
    endpoints: [
      {
        method: "GET",
        path: "/api/public-quiz/questions",
        title: "Question draw",
        description:
          "A fresh shuffled question set for a club — the hub season, Genesis 1–25. Answer keys are never sent; scoring happens on submit.",
      },
      {
        method: "POST",
        path: "/api/public-quiz/attempts",
        title: "Start or submit an attempt",
        description:
          "action=start persists a shuffled draw and returns it (no answers); action=submit scores it server-side and returns the result. Rate limited per IP.",
      },
      {
        method: "GET",
        path: "/api/public-quiz/logs",
        title: "Club board",
        description:
          "One club's top-5 board and recent attempts for the current weekly round.",
      },
      {
        method: "GET",
        path: "/api/public-quiz/overview",
        title: "Season overview",
        description:
          "The best scores across all five clubs this season.",
      },
    ],
  },
];

const queryParams: { endpoint: string; params: { name: string; type: string; description: string }[] }[] = [
  {
    endpoint: "GET /api/publications",
    params: [
      { name: "club", type: "string", description: "Club slug (e.g. sprout-kids, anchors). Use relate for umbrella issues only." },
      { name: "kind", type: "string", description: "magazine or bulletin." },
      { name: "series", type: "string", description: "Series name (Relate, Rooted, Footsteps)." },
      { name: "limit", type: "number", description: "Results per page, 1–100 (default 100)." },
      { name: "offset", type: "number", description: "Skip N results for pagination (default 0)." },
    ],
  },
  {
    endpoint: "GET /api/reading-today",
    params: [
      { name: "tag", type: "string", description: "Club tag (defaults to RELATE, e.g. ANCHOR, SPROUT-KIDS)." },
      { name: "date", type: "string", description: "YYYY-MM-DD — the day to resolve (defaults to today)." },
    ],
  },
  {
    endpoint: "GET /api/public-quiz/questions",
    params: [
      { name: "club", type: "string", description: "Club slug: sprout, surge, pulse, prime or anchor." },
      { name: "count", type: "number", description: "Question count, 5–15 (default 10)." },
    ],
  },
  {
    endpoint: "GET /api/public-quiz/logs",
    params: [{ name: "club", type: "string", description: "Club slug: sprout, surge, pulse, prime or anchor." }],
  },
];

const examples: { title: string; language: string; code: string }[] = [
  {
    title: "curl — recent magazines",
    language: "bash",
    code: `curl "${BASE_URL}/api/publications?limit=3" \\
  -H "Accept: application/json"`,
  },
  {
    title: "JavaScript — one publication",
    language: "js",
    code: `const res = await fetch(
  \`${BASE_URL}/api/publications/rooted-kids-oct-2026\`
);
const magazine = await res.json(); // full weeks + days`,
  },
  {
    title: "JavaScript — a reading plan with sections",
    language: "js",
    code: `const res = await fetch(
  \`${BASE_URL}/api/reading-plans/pentateuch-in-60-days\`
);
const { plan, sections } = await res.json();`,
  },
];

const shapes: { title: string; json: string }[] = [
  {
    title: "Publication summary",
    json: `{
  "id": "rooted-kids-oct-2026",
  "kind": "magazine",
  "series": "Rooted",
  "clubSlug": "sprout-kids",
  "title": "Rooted Kids — October 2026",
  "issue": "10",
  "month": "October",
  "year": 2026,
  "cover": "https://…/cover.png",
  "summary": "…",
  "tags": ["SPROUT-KIDS"],
  "season": { "label": "Autumn", "start": "2026-10-01", "end": "2026-11-30" },
  "publishedAt": "2026-09-20T10:00:00.000Z"
}`,
  },
  {
    title: "Reading plan",
    json: `{
  "slug": "pentateuch-in-60-days",
  "title": "The Pentateuch in 60 Days",
  "tagline": "Genesis, Exodus, Leviticus, Numbers, Deuteronomy",
  "category": "Bible Reading",
  "section": "Old Testament",
  "days": 60,
  "gradient": ["#4caf50", "#5c8d4e"],
  "image": "https://…/cover.jpg"
}`,
  },
  {
    title: "Plan section",
    json: `{
  "id": "pentateuch-in-60-days-genesis-1",
  "planSlug": "pentateuch-in-60-days",
  "title": "In the Beginning",
  "book": "Genesis",
  "startCh": 1,
  "endCh": 5,
  "sort": 0,
  "quiz": [
    {
      "id": "pentateuch-in-60-days-genesis-1",
      "book": "Genesis",
      "chapter": 1,
      "question": "What did God create on day one?",
      "options": ["Light", "The sun", "Fish", "Adam"]
    }
  ]
}`,
  },
];

function MethodBadge({ method }: { method: Endpoint["method"] }) {
  return (
    <span className="inline-block rounded-md bg-cyan/10 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-dark ring-1 ring-cyan/20">
      {method}
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-gray-100 bg-ghost-white px-4 py-3 font-mono text-xs leading-relaxed text-navy-dark">
      {code}
    </pre>
  );
}

export default function DeveloperApiPage() {
  return (
    <section className="flex-1 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
            Developer API
          </p>
          <h1 className="mb-3 text-3xl font-semibold text-navy-dark md:text-4xl">
            Relate World public API
          </h1>
          <p className="mx-auto max-w-xl text-gray-500">
            Free, key-less access to Relate World&apos;s magazines, bulletins
            and Bible reading plans — plus the public Bible Quiz. Reads are
            cached and safe for any app, site or community tool; quiz attempts
            are rate-limited per IP.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-navy-dark transition-colors hover:bg-cyan-dark"
            >
              <LuFlaskConical className="text-base" />
              Try it live — Swagger UI
              <LuArrowUpRight className="text-base" />
            </Link>
            <a
              href="/openapi.json"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-dark transition-colors hover:border-cyan hover:text-cyan-dark"
            >
              <LuFileJson className="text-base" />
              openapi.json
            </a>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:col-span-3 lg:block">
            <nav className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Table of Contents
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block py-0.5 text-gray-600 transition-colors hover:text-cyan"
                >
                  <span className="mr-1.5 font-mono text-xs text-cyan">
                    {String(sections.indexOf(s) + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-8 lg:col-span-9">
            {/* Interactive docs */}
            <article id="api-docs" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 01</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Interactive docs
                </h2>
              </header>
              <p className="text-sm leading-relaxed text-gray-600">
                The full API is described as a standard OpenAPI 3.1 document.
                Use the hosted Swagger UI to explore each endpoint and fire
                real test requests right from the page.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/api-docs"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-navy-dark transition-colors hover:bg-cyan-dark"
                >
                  <LuFlaskConical className="text-base" /> Open Swagger UI
                </Link>
                <a
                  href="/openapi.json"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-dark transition-colors hover:border-cyan hover:text-cyan-dark"
                >
                  <LuFileJson className="text-base" /> View openapi.json
                </a>
              </div>
            </article>

            {/* Overview */}
            <article id="overview" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">
                  Section 02
                </p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Overview
                </h2>
              </header>
              <p className="text-sm leading-relaxed text-gray-600">
                The Relate World API serves the content behind the Relate World
                app and website: season study guides (magazines), one-off
                bulletins, daily reading targets, and reading plans with
                chapter-by-chapter Bible study sections. Everything is cached
                for performance and served with open CORS, so you can call it
                straight from a browser, a script, or a server.
              </p>
              <div className="mt-4 space-y-2">
                <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                  <LuShieldCheck className="mt-0.5 shrink-0 text-cyan" />
                  No API key, no sign-up, no auth headers.
                </p>
                <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                  <LuZap className="mt-0.5 shrink-0 text-cyan" />
                  Read-only: published content only, drafts are never exposed.
                </p>
              </div>
            </article>

            {/* Base URL */}
            <article id="base-url" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 03</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Base URL &amp; access
                </h2>
                <p className="text-sm text-gray-500">
                  Every endpoint below is relative to this base URL.
                </p>
              </header>
              <CodeBlock code={`${BASE_URL}/api`} />
              <div className="mt-4 rounded-lg border border-cyan/15 bg-cyan/5 px-4 py-3 text-sm leading-relaxed text-gray-600">
                JSON is returned everywhere, errors use a consistent{" "}
                <span className="font-mono text-xs text-navy-dark">
                  {"{ \"error\": \"…\" }"}
                </span>{" "}
                shape, and HTTP status codes follow the standard conventions
                (200, 400, 404, 429, 500).
              </div>
            </article>

            {/* Endpoints */}
            <article id="endpoints" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 04</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Endpoints
                </h2>
                <p className="text-sm text-gray-500">
                  Nine endpoints across three feature groups — reads are
                  cached, quiz attempts are rate-limited per IP.
                </p>
              </header>

              <div className="space-y-6">
                {endpointGroups.map((group) => (
                  <div key={group.name}>
                    <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-navy-dark">
                      {group.name}
                    </h3>
                    <div className="space-y-4">
                      {group.endpoints.map((ep) => (
                        <div
                          key={ep.path}
                          className="rounded-lg border border-gray-100 bg-alice-blue/60 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <MethodBadge method={ep.method} />
                            <code className="font-mono text-xs font-semibold text-navy-dark">
                              {ep.path}
                            </code>
                          </div>
                          <p className="mt-1.5 text-xs font-semibold text-gray-800">
                            {ep.title}
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
                            {ep.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Query params */}
            <article id="params" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 05</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Query parameters
                </h2>
              </header>
              <div className="space-y-5">
                {queryParams.map((group) => (
                  <div key={group.endpoint}>
                    <code className="font-mono text-xs font-semibold text-navy-dark">
                      {group.endpoint}
                    </code>
                    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-100">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-alice-blue/60 text-[11px] font-semibold uppercase tracking-widest text-slate-gray">
                            <th className="px-4 py-2.5">Param</th>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.params.map((p) => (
                            <tr key={p.name} className="border-b border-gray-100 last:border-0">
                              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-navy-dark">
                                {p.name}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-gray">
                                {p.type}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-gray-600">
                                {p.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Examples */}
            <article id="examples" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 06</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Quick start
                </h2>
                <p className="text-sm text-gray-500">
                  Copy-paste examples — no keys, no setup.
                </p>
              </header>
              <div className="space-y-5">
                {examples.map((ex) => (
                  <div key={ex.title}>
                    <div className="mb-2 flex items-center gap-2">
                      <LuCode className="text-cyan" />
                      <h3 className="text-sm font-semibold text-gray-800">{ex.title}</h3>
                    </div>
                    <CodeBlock code={ex.code} />
                  </div>
                ))}
              </div>
            </article>

            {/* Response shapes */}
            <article id="data" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 07</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Response shapes
                </h2>
                <p className="text-sm text-gray-500">
                  Representative payloads; fields may be optional.
                </p>
              </header>
              <div className="space-y-5">
                {shapes.map((s) => (
                  <div key={s.title}>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">{s.title}</h3>
                    <CodeBlock code={s.json} />
                  </div>
                ))}
              </div>
            </article>

            {/* Limits */}
            <article id="limits" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 08</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Rate limits &amp; fair use
                </h2>
              </header>
              <ul className="space-y-1.5">
                {[
                  "Free for all use — community, education, and fair commercial use.",
                  "Best-effort rate limit: 120 requests per minute per IP per endpoint.",
                  "Responses are cacheable (Cache-Control: public); we recommend caching list responses for 5 minutes.",
                  "No reliable SLA — the API may change or move as Relate World grows; follow the support section.",
                ].map((li, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-gray-600"
                  >
                    <span className="mt-px shrink-0 text-cyan">›</span>
                    {li}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-cyan/15 bg-cyan/5 px-4 py-3 text-sm leading-relaxed text-gray-600">
                Hit the limit and requests answer with HTTP 429 plus an{" "}
                <span className="font-mono text-xs text-navy-dark">
                  X-RateLimit-Reset
                </span>{" "}
                header telling you when to try again.
              </div>
            </article>

            {/* Support */}
            <article id="support" className="scroll-mt-24 rounded-xl bg-white p-8 shadow-sm md:p-10">
              <header className="mb-6">
                <p className="mb-2 font-mono text-xs text-cyan">Section 09</p>
                <h2 className="mb-2 text-xl font-semibold text-navy-dark md:text-2xl">
                  Support &amp; stability
                </h2>
              </header>
              <div className="flex items-start gap-3 rounded-lg border-l-4 border-cyan bg-white p-4 shadow-sm">
                <LuMail className="mt-0.5 shrink-0 text-xl text-cyan" />
                <p className="text-sm leading-relaxed text-gray-600">
                  Questions, bugs or new-content ideas? Get in touch through the
                  Relate World contact page. If you build something with the
                  API, we&apos;d love to hear about it — this surface is shaped
                  by the people who use it.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}