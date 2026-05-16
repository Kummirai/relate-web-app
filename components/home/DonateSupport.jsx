import { HiOutlineGift } from "react-icons/hi2";
import { HiOutlineHeart } from "react-icons/hi2";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { PiHandHeart } from "react-icons/pi";

export default function DonateSupport() {
  const ways = [
    {
      icon: <HiOutlineHeart />,
      title: "One-Time Gift",
      desc: "Make a single donation to support our ongoing programs and community outreach efforts.",
    },
    {
      icon: <HiOutlineGlobeAlt />,
      title: "Monthly Partner",
      desc: "Become a monthly partner and provide consistent support for our mission and operations.",
    },
    {
      icon: <PiHandHeart />,
      title: "Sponsor a Family",
      desc: "Sponsor a family in need with food, clothing, and essential resources throughout the year.",
    },
    {
      icon: <HiOutlineGift />,
      title: "Donate Supplies",
      desc: "Contribute physical items like food, clothing, books, or equipment for our programs.",
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 60%, #f0f6fa 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div
            className="size-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: "#13c5dd", color: "white" }}
          >
            <HiOutlineGift />
          </div>
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Support Our Mission
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Your generosity makes it possible for us to serve, mentor, and uplift our community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {ways.map((way, i) => (
            <div
              key={i}
              className="rounded-lg p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div
                className="size-12 rounded-lg flex items-center justify-center text-xl mx-auto mb-4"
                style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
              >
                {way.icon}
              </div>
              <h3 className="text-base font-medium mb-2" style={{ color: "#1d2a4d" }}>
                {way.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                {way.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            className="px-10 py-3.5 rounded-lg text-sm text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            Make a Donation
          </button>
          <p className="text-xs mt-4" style={{ color: "#1d2a4d" }}>
            All donations go directly toward supporting our community programs and operations.
          </p>
        </div>
      </div>
    </section>
  );
}
