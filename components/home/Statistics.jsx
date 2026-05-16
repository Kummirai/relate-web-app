import { HiOutlineUsers } from "react-icons/hi2";
import { HiOutlineHeart } from "react-icons/hi2";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { HiOutlineHandRaised } from "react-icons/hi2";

export default function Statistics() {
  const stats = [
    { icon: <HiOutlineUsers />, value: "500+", label: "Community Members" },
    { icon: <HiOutlineHeart />, value: "200+", label: "Families Supported" },
    { icon: <HiOutlineAcademicCap />, value: "50+", label: "Skills Shared" },
    { icon: <HiOutlineHandRaised />, value: "100+", label: "Active Volunteers" },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold text-white">
            Our Impact
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#13c5dd" }}>
            By the numbers — lives changed, families strengthened, and a community growing together.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#eff5f9" }}>
              <div
                className="size-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ backgroundColor: "#13c5dd", color: "white" }}
              >
                {stat.icon}
              </div>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: "#1d2a4d" }}>
                {stat.value}
              </p>
              <p className="text-sm mt-2" style={{ color: "#1d2a4d" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
