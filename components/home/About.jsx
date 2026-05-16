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
    <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: "#13c5dd" }} />
        </div>
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            About Us
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-6 font-light leading-relaxed" style={{ color: "#1d2a4d" }}>
            We are Relate — a faith-rooted community bound together by prayer,
            love, and a shared calling to serve. We believe that no one should
            walk their spiritual and life journey alone. We come alongside
            individuals and families, interceding for them, walking with them,
            and trusting God to bring transformation that lasts far beyond what
            we could accomplish in our own strength.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {featuresData.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl p-6 md:p-8 text-center transition-all duration-500 hover:-translate-y-1"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(19, 197, 221, 0.12)",
                boxShadow: "0 4px 20px rgba(29,42,77,0.08), 0 1px 3px rgba(29,42,77,0.04)",
              }}
            >
              <div
                className="size-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 transition-transform duration-500 hover:scale-110"
                style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
              >
                {feature.icon}
              </div>

              <h3 className="text-xl font-medium mb-3" style={{ color: "#1d2a4d" }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
