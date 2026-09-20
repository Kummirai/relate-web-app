import { IoStarSharp } from "react-icons/io5";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "I joined Pulse to grow my network and stayed for the people. The wallet course changed how I handle money — I opened my first savings account and I'm finally building something.",
      name: "Lerato M.",
      role: "Pulse Member · Youth",
      initials: "LM",
    },
    {
      quote:
        "As a single mom, Anchor gave me more than support — it gave me a village. Free childcare during our meetups, food parcels in a hard month, and friends who actually understand.",
      name: "Nomsa K.",
      role: "Anchor Member · Single Parent",
      initials: "NK",
    },
    {
      quote:
        "My son counts down the days to Sprout club on Saturday. He's reading on his own now, and the leaders know every child by name. It's the highlight of his week.",
      name: "Sipho D.",
      role: "Sprout Parent · Children",
      initials: "SD",
    },
  ];

  return (
    <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
      <div className={"max-w-6xl mx-auto"}>
        <div className={"text-center mb-12 md:mb-16"}>
          <h4 className={"text-cyan font-medium mb-3"}>TESTIMONIALS</h4>
          <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
            What Our Members & Families <br className={"hidden sm:block"} />
            Say About Us
          </h2>
        </div>
        <div className={"grid grid-cols-1 md:grid-cols-3 gap-6"}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={
                "bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              }
            >
              <div className={"flex gap-1 text-amber-400 mb-4"}>
                {[...Array(5)].map((_, j) => (
                  <IoStarSharp key={j} />
                ))}
              </div>
              <p className={"text-gray-600 text-sm leading-relaxed mb-6"}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className={"flex items-center gap-3"}>
                <div
                  className={
                    "size-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-semibold"
                  }
                >
                  {t.initials}
                </div>
                <div>
                  <h4 className={"font-semibold text-gray-800 text-sm"}>
                    {t.name}
                  </h4>
                  <p className={"text-gray-500 text-xs"}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
