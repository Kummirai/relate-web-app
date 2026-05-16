import { BiSolidQuoteLeft } from "react-icons/bi";
import { PiStarFill } from "react-icons/pi";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Community Member",
      quote: "Through Relate's mentorship program, I found direction and purpose. The support I received helped me discover skills I never knew I had.",
      rating: 5,
    },
    {
      name: "James K.",
      role: "Volunteer",
      quote: "Being able to teach music to young people in our community has been incredibly rewarding. This is what true community looks like.",
      rating: 5,
    },
    {
      name: "Esther W.",
      role: "Program Participant",
      quote: "The prayer and emotional support carried me through the hardest season of my life. I am forever grateful for this community.",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "radial-gradient(ellipse at center, white 0%, #eff5f9 70%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Stories of Hope
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Real stories from real people whose lives have been transformed through our community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-6 md:p-8 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <BiSolidQuoteLeft className="text-3xl mb-4" style={{ color: "#13c5dd" }} />
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#1d2a4d" }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <PiStarFill key={j} style={{ color: "#13c5dd" }} />
                ))}
              </div>
              <div>
                <p className="text-sm" style={{ color: "#1d2a4d" }}>{item.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#13c5dd" }}>{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
