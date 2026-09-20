import { LuHandHeart, LuUsers, LuMessageCircle, LuTrendingUp } from "react-icons/lu";

export default function WhyChooseUs() {
  const points = [
    {
      icon: <LuUsers className={"text-4xl text-cyan"} />,
      title: "A Club for Every Age",
      description:
        "From 6 to 60+ — Sprout kids to Prime singles, single parents, couples and families. There's a place for your whole household.",
    },
    {
      icon: <LuMessageCircle className={"text-4xl text-cyan"} />,
      title: "Real Community",
      description:
        "Join a real WhatsApp group with weekly meetups, not a mailing list. Trained facilitators walk with you.",
    },
    {
      icon: <LuHandHeart className={"text-4xl text-cyan"} />,
      title: "Free to Join, Always",
      description:
        "Every club, program and prayer time is free. Sponsorship covers school fees, uniforms and meals for those who need it.",
    },
    {
      icon: <LuTrendingUp className={"text-4xl text-cyan"} />,
      title: "Grow Day by Day",
      description:
        "Prayer streaks, daily verses, reading guides and Bible quizzes — small daily steps that add up to real growth.",
    },
  ];

  return (
    <section className={"py-16 md:py-24 bg-alice-blue px-4"}>
      <div className={"max-w-6xl mx-auto"}>
        <div className={"text-center mb-12 md:mb-16"}>
          <h4 className={"text-cyan font-medium mb-3"}>WHY CHOOSE US</h4>
          <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
            More Reasons to{" "}
            <span className={"text-cyan"}>Choose RelateWorld</span>
          </h2>
        </div>
        <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"}>
          {points.map((point, i) => (
            <div
              key={i}
              className={
                "bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300"
              }
            >
              <div className={"mb-4 flex justify-center"}>{point.icon}</div>
              <h3 className={"text-lg font-semibold text-gray-800 mb-2"}>
                {point.title}
              </h3>
              <p className={"text-gray-600 text-sm leading-relaxed"}>
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
