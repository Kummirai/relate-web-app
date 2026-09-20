import Link from "next/link";
import { IoMdAddCircle } from "react-icons/io";
import { FaBookReader } from "react-icons/fa";
import { FaFire } from "react-icons/fa";

export default function HomePage() {
  const features = [
    {
      title: "Create Records",
      description: "Add new family support records with comprehensive details",
      icon: <IoMdAddCircle className="text-4xl text-zinc-950" />,
      link: "/records/create",
      linkText: "Create New Record",
    },
    {
      title: "View Records",
      description: "Access and manage all family support records",
      icon: <FaBookReader className="text-4xl text-zinc-950" />,
      link: "/records/view-records",
      linkText: "View Records",
    },
    {
      title: "Restore Streaks",
      description: "Restore prayer and reading streaks for app users",
      icon: <FaFire className="text-4xl text-zinc-950" />,
      link: "/records/streaks",
      linkText: "Restore Streaks",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pt-10 pb-20">
      <div className="text-center mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan mb-2">Relate Team</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-navy mb-4">Records</h1>
        <p className="text-sm md:text-base mx-auto max-w-2xl text-center text-slate-gray max-md:px-2">
          Every record represents a life being transformed. Track and manage the
          journeys of those we walk with — with care, confidentiality, and a
          heart for lasting change.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 size-12 rounded-full bg-alice-blue flex items-center justify-center text-navy">{feature.icon}</div>
              <h3 className="text-xl font-bold text-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-gray mb-5 text-sm leading-relaxed">
                {feature.description}
              </p>
              <Link
                href={feature.link}
                className="bg-navy text-white px-6 py-2.5 rounded-lg font-semibold transition hover:bg-navy-soft text-sm"
              >
                {feature.linkText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight text-navy mb-4">
          About This System
        </h2>
        <div className="prose max-w-none">
          <p className="mb-4 text-sm">
            Built to support those who serve, this system helps our team
            faithfully steward every family's journey — with accuracy,
            compassion, and the confidentiality each person deserves.
          </p>
          <ul className="list-disc pl-5 mb-4 text-neutral-700 font-light text-sm">
            <li>Secure family information storage</li>
            <li>Assessment and urgency level tracking</li>
            <li>Short-term and long-term need identification</li>
            <li>Action log and follow-up management</li>
            <li>Print-friendly record output</li>
          </ul>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="font-semibold">Confidentiality Notice:</p>
            <p className="text-sm">
              This system holds sacred the trust families place in us. All
              information is private and confidential, accessible only to
              authorized members of the Relate team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
