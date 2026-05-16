import { HiOutlineHandRaised } from "react-icons/hi2";
import { HiOutlineHeart } from "react-icons/hi2";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { PiHandsClapping } from "react-icons/pi";

export default function Volunteer() {
  const roles = [
    {
      icon: <HiOutlineAcademicCap />,
      title: "Teach a Skill",
      desc: "Share your expertise in music, programming, art, languages, or any skill that can bless others.",
    },
    {
      icon: <HiOutlineHeart />,
      title: "Mentor Someone",
      desc: "Walk alongside someone who needs guidance, encouragement, and a listening ear.",
    },
    {
      icon: <HiOutlineHandRaised />,
      title: "Community Service",
      desc: "Help with home visits, outreach events, food drives, and practical community support.",
    },
    {
      icon: <PiHandsClapping />,
      title: "Prayer Team",
      desc: "Join our prayer team and intercede for the needs of our community and its members.",
    },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div
            className="size-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: "#13c5dd", color: "white" }}
          >
            <HiOutlineHandRaised />
          </div>
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Get Involved
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Your time and talents can make a real difference. Find a way to serve that fits your gifts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {roles.map((role, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-4"
                style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
              >
                {role.icon}
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: "#1d2a4d" }}>
                {role.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                {role.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            className="px-8 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            Sign Up to Volunteer
          </button>
        </div>
      </div>
    </section>
  );
}
