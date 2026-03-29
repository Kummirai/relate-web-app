import Link from "next/link";
import { FaHome, FaFileAlt, FaPlusCircle, FaDatabase } from "react-icons/fa";

export default function HomePage() {
  const features = [
    {
      title: "Create Records",
      description: "Add new family support records with comprehensive details",
      icon: <FaPlusCircle className="text-4xl text-blue-600" />,
      link: "/records/create",
      linkText: "Create New Record",
    },
    {
      title: "View Records",
      description: "Access and manage all family support records",
      icon: <FaFileAlt className="text-4xl text-green-600" />,
      link: "/records/view-records",
      linkText: "View Records",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pt-10 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-medium text-zinc-950 mb-4">Records</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          A comprehensive system for managing family care records and support
          services. Maintain confidentiality while providing effective
          assistance.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-lg max-w-90.5"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-medium text-zinc-950 mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-600 mb-5 text-[14px]">
                {feature.description}
              </p>
              <Link
                href={feature.link}
                className="bg-zinc-950 to-zinc-500 text-neutral-50  px-7 py-3 rounded-full font-medium transition text-[14px]"
              >
                {feature.linkText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl text-zinc-950 font-bold mb-4">
          About This System
        </h2>
        <div className="prose max-w-none">
          <p className="mb-4">
            This system is designed to help social workers and case managers
            efficiently track and manage family support cases. It includes:
          </p>
          <ul className="list-disc pl-5 mb-4 text-neutral-700">
            <li>Secure family information storage</li>
            <li>Assessment and urgency level tracking</li>
            <li>Short-term and long-term need identification</li>
            <li>Action log and follow-up management</li>
            <li>Print-friendly record output</li>
          </ul>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="font-semibold">Confidentiality Notice:</p>
            <p className="text-sm">
              This system contains private and confidential information. It is
              to be used only by authorized personnel involved in the support
              project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
