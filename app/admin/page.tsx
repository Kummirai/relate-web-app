import Link from "next/link";
import { requireServerAdmin } from "@/lib/session";

const links = [
  {
    href: "/admin/magazines",
    icon: "📰",
    title: "Magazines",
    desc: "Create, edit and publish magazines and seasonal study guides.",
  },
  {
    href: "/records/streaks",
    icon: "🔥",
    title: "Restore Streaks",
    desc: "Repair reading streaks for members.",
  },
  {
    href: "/admin/social-joins",
    icon: "💬",
    title: "Social Joins",
    desc: "Review WhatsApp community join requests.",
  },
];

export default async function AdminHub() {
  await requireServerAdmin();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">
          Admin Console
        </p>
        <h1 className="font-display text-3xl font-bold text-[#1d2a4d]">Relate tools</h1>
        <p className="mt-1 text-sm text-[#6b7a8d]">Manage magazines, streaks and community requests.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-2xl border border-white/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#1d2a4d]/5 text-xl ring-1 ring-[#1d2a4d]/10">
              {l.icon}
            </div>
            <h2 className="font-semibold text-[#1d2a4d]">{l.title}</h2>
            <p className="mt-1 text-sm text-[#6b7a8d]">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}