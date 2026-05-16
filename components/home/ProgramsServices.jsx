import { HiOutlineHeart } from "react-icons/hi2";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { HiOutlineUsers } from "react-icons/hi2";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

export default function ProgramsServices() {
  const programs = [
    {
      icon: <HiOutlineHeart />,
      title: "Pastoral Care & Prayer",
      desc: "One-on-one prayer support, home visits, and spiritual guidance for individuals and families in need.",
    },
    {
      icon: <HiOutlineBookOpen />,
      title: "Bible Studies",
      desc: "Weekly scripture-based gatherings that deepen faith, build community, and provide practical wisdom for daily life.",
    },
    {
      icon: <HiOutlineUsers />,
      title: "Mentorship Program",
      desc: "Spirit-led mentorship that walks alongside people through life's challenges toward wholeness and independence.",
    },
    {
      icon: <HiOutlineAcademicCap />,
      title: "Skills Exchange",
      desc: "A platform for community members to teach and learn practical skills — from music to programming to life skills.",
    },
    {
      icon: <HiOutlineGlobeAlt />,
      title: "Community Outreach",
      desc: "Identifying and reaching the less privileged with practical support, resources, and compassionate care.",
    },
    {
      icon: <HiOutlineChatBubbleLeftRight />,
      title: "Counseling & Support",
      desc: "Emotional and spiritual counseling to help individuals and families navigate difficult seasons with hope.",
    },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Our Programs & Services
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            We walk with individuals and families through every season — offering prayer, mentorship, and practical support.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ backgroundColor: "#13c5dd", color: "white" }}
              >
                {program.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#1d2a4d" }}>
                {program.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                {program.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
