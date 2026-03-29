import { BiSolidLowVision } from "react-icons/bi";
import { GoGoal } from "react-icons/go";
import { GiFlagObjective } from "react-icons/gi";

export default function About() {
  const featuresData = [
    {
      icon: <BiSolidLowVision />,
      title: "Vision",
      description:
        "Spirit-filled communities where every individual and family walks in dignity, hope, and God-given purpose.",
    },
    {
      icon: <GiFlagObjective />,
      title: "Objectives",
      description:
        "We are called to reach the less privileged, offer Spirit-led mentorship, address the needs of the whole person — body, mind, and soul — and connect people to the right support and guidance, trusting God in every step of the journey",
    },
    {
      icon: <GoGoal />,
      title: "Mission",
      description:
        "To pray for, empower, and walk alongside individuals and families on their spiritual journey toward wholeness, self-reliance, and lasting restoration.",
    },
  ];
  return (
    <section className="h-screen text-zinc-950 bg-white flex items-center justify-center">
      <div className="  max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-center mx-auto mt-4 text-zinc-950">
            About Us
          </h2>
          <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2 text-neutral-700 font-light">
            We are Relate — a faith-rooted community bound together by prayer,
            love, and a shared calling to serve. We believe that no one should
            walk their spiritual and life journey alone. We come alongside
            individuals and families, interceding for them, walking with them,
            and trusting God to bring transformation that lasts far beyond what
            we could accomplish in our own strength.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-4 mt-10 px-6">
          {featuresData.map((feature, index) => (
            <div
              key={index}
              className={`hover:-translate-y-0.5 transition duration-300 h-[266px]${index === 1 ? "p-px rounded-[13px] bg-linear-to-br from-[#9544FF] to-[#223B60]" : ""}`}
            >
              <div className="p-6 rounded-xl space-y-4 border border-slate-800 bg-zinc-950  max-w-80 w-full flex flex-col items-center">
                <p className="text-white text-2xl">{feature.icon}</p>

                <h3 className="text-xl font-medium text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-300 line-clamp-6 pb-4 text-sm text-center">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
